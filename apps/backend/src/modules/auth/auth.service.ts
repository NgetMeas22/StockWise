import { prisma } from '../../lib/prisma.js';
import { verifyPassword, hashPassword } from '../../lib/password.js';
import {
  generateOpaqueToken,
  hashToken,
  generateCsrfToken,
  hashCsrfToken,
} from '../../lib/tokens.js';
import { AuthError, ValidationError } from '../../http/errors.js';
import { env } from '../../config/env.js';
import { writeAuditLog } from '../../lib/audit.js';
import { PermissionKey, RoleKey } from '@stockwise/shared';

export interface LoginResult {
  token: string;
  csrfToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    isActive: boolean;
    mustChangePassword: boolean;
    avatarKey?: string | null;
    avatarUrl?: string | null;
    phone?: string | null;
  };
  role: RoleKey;
  permissions: PermissionKey[];
}

export class AuthService {
  public async login(
    email: string,
    plainPassword: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ): Promise<LoginResult> {
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        userRole: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Check account lock
    if (user && user.lockedUntil && user.lockedUntil > now) {
      throw new AuthError(
        'Account is temporarily locked due to multiple failed login attempts. Please try again later.',
        'ACCOUNT_LOCKED'
      );
    }

    // Verify user and password
    const passwordValid = user ? await verifyPassword(user.passwordHash, plainPassword) : false;

    if (!user || !passwordValid) {
      if (user) {
        const nextFailed = user.failedLoginCount + 1;
        let lockedUntil = user.lockedUntil;
        if (nextFailed >= 5) {
          lockedUntil = new Date(now.getTime() + 15 * 60 * 1000); // Lock for 15 minutes
        }
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginCount: nextFailed,
            lockedUntil,
          },
        });
      }

      await writeAuditLog({
        actorUserId: user?.id || null,
        action: 'AUTH_LOGIN_FAILED',
        entityType: 'USER',
        entityId: user?.id || null,
        after: { email: normalizedEmail, reason: 'Invalid credentials' },
        ip,
        userAgent,
        requestId,
      });

      // Generic message to prevent user enumeration
      throw new AuthError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new AuthError('Account is deactivated. Please contact an administrator.');
    }

    // Reset failed login counter and update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: now,
      },
    });

    // Create session
    const rawToken = generateOpaqueToken();
    const tokenHash = hashToken(rawToken);
    const rawCsrf = generateCsrfToken();
    const csrfHash = hashCsrfToken(rawCsrf);

    const idleExpiresAt = new Date(now.getTime() + env.SESSION_IDLE_MINUTES * 60 * 1000);
    const absoluteExpiresAt = new Date(now.getTime() + env.SESSION_ABSOLUTE_HOURS * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        csrfHash,
        idleExpiresAt,
        absoluteExpiresAt,
        ip: ip || null,
        userAgent: userAgent || null,
      },
    });

    const roleKey = (user.userRole?.role.key as RoleKey) || 'VIEWER';
    const permissions: PermissionKey[] =
      user.userRole?.role.rolePermissions.map((rp) => rp.permission.key as PermissionKey) || [];

    await writeAuditLog({
      actorUserId: user.id,
      action: 'AUTH_LOGIN_SUCCESS',
      entityType: 'USER',
      entityId: user.id,
      ip,
      userAgent,
      requestId,
    });

    return {
      token: rawToken,
      csrfToken: rawCsrf,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        avatarKey: (user as any).avatarKey || null,
        avatarUrl: (user as any).avatarKey ? `/api/v1/public/images/${(user as any).avatarKey}` : null,
        phone: (user as any).phone || null,
      },
      role: roleKey,
      permissions,
    };
  }

  public async logout(sessionId: string, userId: string, ip?: string, userAgent?: string, requestId?: string | number | null): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        revokedAt: new Date(),
        revokedReason: 'User logged out',
      },
    });

    await writeAuditLog({
      actorUserId: userId,
      action: 'AUTH_LOGOUT',
      entityType: 'SESSION',
      entityId: sessionId,
      ip,
      userAgent,
      requestId,
    });
  }

  public async changePassword(
    userId: string,
    currentPlain: string,
    newPlain: string,
    currentSessionId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AuthError('User not found');
    }

    const currentMatches = await verifyPassword(user.passwordHash, currentPlain);
    if (!currentMatches) {
      throw new ValidationError('Current password is incorrect');
    }

    const newHash = await hashPassword(newPlain);
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash: newHash,
          passwordChangedAt: now,
          mustChangePassword: false,
        },
      });

      // Revoke all OTHER sessions for this user
      await tx.session.updateMany({
        where: {
          userId,
          id: { not: currentSessionId },
          revokedAt: null,
        },
        data: {
          revokedAt: now,
          revokedReason: 'Password changed by user',
        },
      });
    });

    await writeAuditLog({
      actorUserId: userId,
      action: 'AUTH_PASSWORD_CHANGED',
      entityType: 'USER',
      entityId: userId,
      ip,
      userAgent,
      requestId,
    });
  }

  public async updateProfile(
    userId: string,
    input: { fullName?: string; email?: string; phone?: string | null },
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AuthError('User not found');
    }

    if (input.email && input.email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing) {
        throw new ValidationError('Email address is already in use by another account');
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: input.fullName !== undefined ? input.fullName.trim() : undefined,
        email: input.email !== undefined ? input.email.trim().toLowerCase() : undefined,
        phone: input.phone !== undefined ? (input.phone ? input.phone.trim() : null) : undefined,
      },
      include: {
        userRole: {
          include: {
            role: true,
          },
        },
      },
    });

    await writeAuditLog({
      actorUserId: userId,
      action: 'USER_PROFILE_UPDATED',
      entityType: 'USER',
      entityId: userId,
      before: { fullName: user.fullName, email: user.email, phone: user.phone },
      after: { fullName: updated.fullName, email: updated.email, phone: updated.phone },
      ip,
      userAgent,
      requestId,
    });

    return {
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      roleKey: (updated.userRole?.role.key as RoleKey) || 'VIEWER',
      isActive: updated.isActive,
      mustChangePassword: updated.mustChangePassword,
      failedLoginCount: updated.failedLoginCount,
      lockedUntil: updated.lockedUntil ? updated.lockedUntil.toISOString() : null,
      lastLoginAt: updated.lastLoginAt ? updated.lastLoginAt.toISOString() : null,
      passwordChangedAt: updated.passwordChangedAt ? updated.passwordChangedAt.toISOString() : null,
      avatarKey: updated.avatarKey,
      avatarUrl: updated.avatarKey ? `/api/v1/public/images/${updated.avatarKey}` : null,
      phone: updated.phone,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  public async updateAvatar(
    userId: string,
    avatarKey: string | null,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AuthError('User not found');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatarKey },
    });

    await writeAuditLog({
      actorUserId: userId,
      action: 'USER_AVATAR_UPDATED',
      entityType: 'USER',
      entityId: userId,
      before: { avatarKey: user.avatarKey },
      after: { avatarKey: updated.avatarKey },
      ip,
      userAgent,
      requestId,
    });

    return {
      avatarKey: updated.avatarKey,
      avatarUrl: updated.avatarKey ? `/api/v1/public/images/${updated.avatarKey}` : null,
    };
  }

  public async requestPasswordReset(
    email: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.isActive) {
      // Return success anyway to avoid user enumeration
      return {
        message: 'If that email address exists in our system, a 6-digit reset code has been sent.',
      };
    }

    // 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    await prisma.appSetting.upsert({
      where: { key: `pwd_reset_${normalizedEmail}` },
      update: {
        value: { code, expiresAt, attempts: 0 },
        updatedBy: user.id,
      },
      create: {
        key: `pwd_reset_${normalizedEmail}`,
        value: { code, expiresAt, attempts: 0 },
        updatedBy: user.id,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'USER',
      entityId: user.id,
      ip,
      userAgent,
      requestId,
    });

    return {
      message: 'If that email address exists in our system, a 6-digit reset code has been sent.',
      devCode: env.NODE_ENV !== 'production' ? code : undefined,
    };
  }

  public async resetPasswordWithCode(
    email: string,
    code: string,
    newPass: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.isActive) {
      throw new ValidationError('Invalid or expired verification code');
    }

    const resetRecord = await prisma.appSetting.findUnique({
      where: { key: `pwd_reset_${normalizedEmail}` },
    });

    if (!resetRecord || !resetRecord.value) {
      throw new ValidationError('No active password reset request found for this email');
    }

    const data = resetRecord.value as { code?: string; expiresAt?: number; attempts?: number };
    if (!data.code || !data.expiresAt || Date.now() > data.expiresAt) {
      await prisma.appSetting.delete({ where: { key: `pwd_reset_${normalizedEmail}` } }).catch(() => {});
      throw new ValidationError('Verification code has expired. Please request a new one.');
    }

    if (data.code !== code.trim()) {
      // Increment attempt counter
      await prisma.appSetting.update({
        where: { key: `pwd_reset_${normalizedEmail}` },
        data: { value: { ...data, attempts: (data.attempts || 0) + 1 } },
      });
      throw new ValidationError('Incorrect verification code. Please check and try again.');
    }

    // Code matches: update password
    const passwordHash = await hashPassword(newPass);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        failedLoginCount: 0,
        lockedUntil: null,
        passwordChangedAt: new Date(),
      },
    });

    // Cleanup reset record
    await prisma.appSetting.delete({ where: { key: `pwd_reset_${normalizedEmail}` } }).catch(() => {});

    // Invalidate existing sessions
    await prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'PASSWORD_RESET' },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'USER',
      entityId: user.id,
      ip,
      userAgent,
      requestId,
    });

    return {
      success: true,
      message: 'Your password has been successfully reset. You can now log in.',
    };
  }
}

export const authService = new AuthService();

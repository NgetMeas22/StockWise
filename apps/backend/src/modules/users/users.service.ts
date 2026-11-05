import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../lib/password.js';
import { ConflictError, NotFoundError, ValidationError } from '../../http/errors.js';
import { writeAuditLog } from '../../lib/audit.js';
import { RoleKey } from '@stockwise/shared';

export class UsersService {
  public async listUsers(params: {
    page: number;
    pageSize: number;
    q?: string;
    role?: string;
    status?: string;
  }) {
    const { page, pageSize, q, role, status } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (q) {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { fullName: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (status === 'ACTIVE') {
      where.isActive = true;
    } else if (status === 'INACTIVE') {
      where.isActive = false;
    }

    if (role) {
      where.userRole = {
        role: {
          key: role,
        },
      };
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          userRole: {
            include: { role: true },
          },
        },
      }),
    ]);

    const formatted = users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      roleKey: (u.userRole?.role.key as RoleKey) || 'VIEWER',
      isActive: u.isActive,
      mustChangePassword: u.mustChangePassword,
      failedLoginCount: u.failedLoginCount,
      lockedUntil: u.lockedUntil ? u.lockedUntil.toISOString() : null,
      lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
      passwordChangedAt: u.passwordChangedAt ? u.passwordChangedAt.toISOString() : null,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }));

    return { total, users: formatted };
  }

  public async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userRole: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roleKey: (user.userRole?.role.key as RoleKey) || 'VIEWER',
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      failedLoginCount: user.failedLoginCount,
      lockedUntil: user.lockedUntil ? user.lockedUntil.toISOString() : null,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      passwordChangedAt: user.passwordChangedAt ? user.passwordChangedAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  public async createUser(
    input: { email: string; fullName: string; roleKey: RoleKey },
    adminUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const normalizedEmail = input.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const role = await prisma.role.findUnique({
      where: { key: input.roleKey },
    });

    if (!role) {
      throw new NotFoundError(`Role ${input.roleKey} not found`);
    }

    // Generate temporary password (16 characters)
    const tempPassword = `Temp-${crypto.randomBytes(6).toString('hex')}!A1`;
    const passwordHash = await hashPassword(tempPassword);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: normalizedEmail,
          fullName: input.fullName.trim(),
          passwordHash,
          isActive: true,
          mustChangePassword: true,
        },
      });

      await tx.userRole.create({
        data: {
          userId: created.id,
          roleId: role.id,
          grantedBy: adminUserId,
        },
      });

      return created;
    });

    await writeAuditLog({
      actorUserId: adminUserId,
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: user.id,
      after: {
        email: user.email,
        fullName: user.fullName,
        role: input.roleKey,
      },
      ip,
      userAgent,
      requestId,
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roleKey: input.roleKey,
      temporaryPassword: tempPassword,
    };
  }

  public async updateUser(
    userId: string,
    input: { fullName?: string; roleKey?: RoleKey },
    actorUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      include: { userRole: { include: { role: true } } },
    });

    if (!target) {
      throw new NotFoundError('User not found');
    }

    // P-4: A user cannot change the role of their own account
    if (input.roleKey && userId === actorUserId) {
      throw new ConflictError('You cannot change your own role');
    }

    // P-4: If demoting an admin, check that it's not the last active admin
    if (input.roleKey && target.userRole?.role.key === 'ADMIN' && input.roleKey !== 'ADMIN') {
      const activeAdminCount = await prisma.userRole.count({
        where: {
          role: { key: 'ADMIN' },
          user: { isActive: true },
        },
      });
      if (activeAdminCount <= 1) {
        throw new ConflictError('Cannot demote the last active Administrator (P-4)');
      }
    }

    await prisma.$transaction(async (tx) => {
      if (input.fullName) {
        await tx.user.update({
          where: { id: userId },
          data: { fullName: input.fullName.trim() },
        });
      }

      if (input.roleKey) {
        const role = await tx.role.findUnique({ where: { key: input.roleKey } });
        if (!role) throw new NotFoundError(`Role ${input.roleKey} not found`);

        await tx.userRole.upsert({
          where: { userId },
          update: { roleId: role.id, grantedBy: actorUserId },
          create: { userId, roleId: role.id, grantedBy: actorUserId },
        });

        // Invalidate sessions cache for this user
        const now = new Date();
        await tx.session.updateMany({
          where: { userId, revokedAt: null },
          data: { lastSeenAt: new Date(now.getTime() - 70000) }, // force refresh
        });
      }
    });

    await writeAuditLog({
      actorUserId,
      action: 'USER_UPDATED',
      entityType: 'USER',
      entityId: userId,
      before: { fullName: target.fullName, roleKey: target.userRole?.role.key },
      after: { fullName: input.fullName || target.fullName, roleKey: input.roleKey || target.userRole?.role.key },
      ip,
      userAgent,
      requestId,
    });
  }

  public async deactivateUser(
    userId: string,
    actorUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    if (userId === actorUserId) {
      throw new ConflictError('You cannot deactivate your own account (P-4)');
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      include: { userRole: { include: { role: true } } },
    });

    if (!target) throw new NotFoundError('User not found');

    if (target.userRole?.role.key === 'ADMIN') {
      const activeAdminCount = await prisma.userRole.count({
        where: {
          role: { key: 'ADMIN' },
          user: { isActive: true },
        },
      });
      if (activeAdminCount <= 1) {
        throw new ConflictError('Cannot deactivate the last active Administrator (P-4)');
      }
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      // P-10: Deactivation revokes all active sessions immediately
      await tx.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now, revokedReason: 'User deactivated by administrator' },
      });
    });

    await writeAuditLog({
      actorUserId,
      action: 'USER_DEACTIVATED',
      entityType: 'USER',
      entityId: userId,
      ip,
      userAgent,
      requestId,
    });
  }

  public async activateUser(
    userId: string,
    actorUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true, failedLoginCount: 0, lockedUntil: null },
    });

    await writeAuditLog({
      actorUserId,
      action: 'USER_ACTIVATED',
      entityType: 'USER',
      entityId: userId,
      ip,
      userAgent,
      requestId,
    });
  }

  public async revokeSessions(
    userId: string,
    actorUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const now = new Date();
    await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now, revokedReason: 'Sessions revoked by administrator' },
    });

    await writeAuditLog({
      actorUserId,
      action: 'USER_SESSIONS_REVOKED',
      entityType: 'USER',
      entityId: userId,
      ip,
      userAgent,
      requestId,
    });
  }

  public async resetPassword(
    userId: string,
    actorUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const tempPassword = `Reset-${crypto.randomBytes(6).toString('hex')}!B2`;
    const passwordHash = await hashPassword(tempPassword);
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          mustChangePassword: true,
          failedLoginCount: 0,
          lockedUntil: null,
        },
      });

      await tx.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now, revokedReason: 'Password reset by administrator' },
      });
    });

    await writeAuditLog({
      actorUserId,
      action: 'USER_PASSWORD_RESET',
      entityType: 'USER',
      entityId: userId,
      ip,
      userAgent,
      requestId,
    });

    return { temporaryPassword: tempPassword };
  }
}

export const usersService = new UsersService();

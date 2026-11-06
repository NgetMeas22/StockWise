import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { hashToken } from '../lib/tokens.js';
import { AuthError } from '../http/errors.js';
import { env } from '../config/env.js';
import { PermissionKey, RoleKey } from '@stockwise/shared';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  mustChangePassword: boolean;
  avatarKey?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
}

export interface UserSession {
  id: string;
  userId: string;
  csrfHash: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      session?: UserSession;
      role?: RoleKey;
      permissions?: PermissionKey[];
    }
  }
}

// In-memory cache for permissions: tokenHash -> { permissions, role, cachedAt }
const permissionsCache = new Map<
  string,
  {
    role: RoleKey;
    permissions: PermissionKey[];
    cachedAt: number;
  }
>();

export function invalidateSessionPermissionsCache(tokenHash?: string): void {
  if (tokenHash) {
    permissionsCache.delete(tokenHash);
  } else {
    permissionsCache.clear();
  }
}

export async function sessionMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const rawToken = req.cookies?.sw_session;

  if (!rawToken) {
    return next();
  }

  const tokenHash = hashToken(rawToken);
  const now = new Date();

  try {
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
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
        },
      },
    });

    if (!session) {
      return next();
    }

    // Check validity
    if (session.revokedAt) {
      return next();
    }

    if (session.absoluteExpiresAt <= now || session.idleExpiresAt <= now) {
      return next();
    }

    if (!session.user.isActive) {
      return next();
    }

    if (session.user.lockedUntil && session.user.lockedUntil > now) {
      return next();
    }

    // Role and permissions
    const roleKey = (session.user.userRole?.role.key as RoleKey) || 'VIEWER';
    const permissions: PermissionKey[] =
      session.user.userRole?.role.rolePermissions.map((rp) => rp.permission.key as PermissionKey) || [];

    req.user = {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.fullName,
      isActive: session.user.isActive,
      mustChangePassword: session.user.mustChangePassword,
      avatarKey: (session.user as any).avatarKey || null,
      avatarUrl: (session.user as any).avatarKey ? `/api/v1/public/images/${(session.user as any).avatarKey}` : null,
      phone: (session.user as any).phone || null,
    };

    req.session = {
      id: session.id,
      userId: session.userId,
      csrfHash: session.csrfHash,
    };

    req.role = roleKey;
    req.permissions = permissions;

    // Sliding window: update idle expiration if > 60 seconds since last seen
    const lastSeenMs = session.lastSeenAt.getTime();
    if (now.getTime() - lastSeenMs > 60 * 1000) {
      const newIdleExpires = new Date(now.getTime() + env.SESSION_IDLE_MINUTES * 60 * 1000);
      prisma.session
        .update({
          where: { id: session.id },
          data: {
            lastSeenAt: now,
            idleExpiresAt: newIdleExpires,
          },
        })
        .catch(() => {});
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !req.session) {
    return next(new AuthError('Authentication required. Please log in.', 'UNAUTHENTICATED'));
  }
  next();
}


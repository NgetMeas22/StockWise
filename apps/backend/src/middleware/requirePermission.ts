import { Request, Response, NextFunction } from 'express';
import { PermissionKey, hasPermission } from '@stockwise/shared';
import { AuthError, ForbiddenError } from '../http/errors.js';

export function requirePermission(...requiredKeys: PermissionKey[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.permissions) {
      return next(new AuthError('Authentication required to access this resource'));
    }

    const permitted = hasPermission(req.permissions, requiredKeys);
    if (!permitted) {
      return next(
        new ForbiddenError(
          `Insufficient permissions. Missing: ${requiredKeys
            .filter((k) => !req.permissions!.includes(k))
            .join(', ')}`
        )
      );
    }

    next();
  };
}

export function can(req: Request, key: PermissionKey): boolean {
  if (!req.permissions) return false;
  return req.permissions.includes(key);
}


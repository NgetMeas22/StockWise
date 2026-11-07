import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { sendSuccess } from '../../http/response.js';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { generateCsrfToken, hashCsrfToken } from '../../lib/tokens.js';
import { storage } from '../../lib/storage.js';
import { ValidationError } from '../../http/errors.js';

export class AuthController {
  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(
        email,
        password,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );

      // Set HttpOnly cookie
      res.cookie('sw_session', result.token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: env.SESSION_ABSOLUTE_HOURS * 60 * 60 * 1000,
      });

      sendSuccess(res, {
        user: result.user,
        role: result.role,
        permissions: result.permissions,
        csrfToken: result.csrfToken,
      });
    } catch (err) {
      next(err);
    }
  }

  public async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.session && req.user) {
        await authService.logout(
          req.session.id,
          req.user.id,
          req.ip,
          req.headers['user-agent'],
          req.requestId
        );
      }

      res.clearCookie('sw_session', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      sendSuccess(res, { message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  public async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let csrfToken: string | undefined;
      if (req.session) {
        csrfToken = generateCsrfToken();
        const csrfHash = hashCsrfToken(csrfToken);
        await prisma.session.update({
          where: { id: req.session.id },
          data: { csrfHash },
        });
      }

      // Query latest user details to include avatarKey, phone, etc.
      let latestUser = req.user;
      if (req.user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: {
            id: true,
            email: true,
            fullName: true,
            isActive: true,
            mustChangePassword: true,
            failedLoginCount: true,
            lockedUntil: true,
            lastLoginAt: true,
            passwordChangedAt: true,
            avatarKey: true,
            phone: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        if (dbUser) {
          latestUser = {
            id: dbUser.id,
            email: dbUser.email,
            fullName: dbUser.fullName,
            isActive: dbUser.isActive,
            mustChangePassword: dbUser.mustChangePassword,
            avatarKey: dbUser.avatarKey,
            avatarUrl: dbUser.avatarKey ? `/api/v1/public/images/${dbUser.avatarKey}` : null,
            phone: dbUser.phone,
          } as any;
        }
      }

      sendSuccess(res, {
        user: latestUser,
        role: req.role,
        permissions: req.permissions,
        csrfToken,
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await authService.updateProfile(
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  public async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new ValidationError('No image file uploaded');
      }

      const saveResult = await storage.saveImage(req.file.buffer, req.file.originalname);
      const result = await authService.updateAvatar(
        req.user!.id,
        saveResult.fileKey,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  public async removeAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.updateAvatar(
        req.user!.id,
        null,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  public async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await authService.requestPasswordReset(
        email,
        req.ip,
        req.headers['user-agent'] as string | undefined,
        req.requestId
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  public async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, code, newPassword } = req.body;
      const result = await authService.resetPasswordWithCode(
        email,
        code,
        newPassword,
        req.ip,
        req.headers['user-agent'] as string | undefined,
        req.requestId
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  public async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(
        req.user!.id,
        currentPassword,
        newPassword,
        req.session!.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );

      sendSuccess(res, { message: 'Password updated successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();

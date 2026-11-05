import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { sendSuccess } from '../../http/response.js';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { generateCsrfToken, hashCsrfToken } from '../../lib/tokens.js';

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

      sendSuccess(res, {
        user: req.user,
        role: req.role,
        permissions: req.permissions,
        csrfToken,
      });
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

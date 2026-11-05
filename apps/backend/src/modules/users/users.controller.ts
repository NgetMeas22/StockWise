import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service.js';
import { sendSuccess, sendPaginated } from '../../http/response.js';

export class UsersController {
  public async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 25;
      const q = req.query.q as string | undefined;
      const role = req.query.role as string | undefined;
      const status = req.query.status as string | undefined;

      const { total, users } = await usersService.listUsers({
        page,
        pageSize,
        q,
        role,
        status,
      });

      sendPaginated(res, users, page, pageSize, total);
    } catch (err) {
      next(err);
    }
  }

  public async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.getUserById(req.params.id);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  public async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await usersService.createUser(
        req.body,
        req.user!.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  public async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await usersService.updateUser(
        req.params.id,
        req.body,
        req.user!.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, { message: 'User updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  public async deactivateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await usersService.deactivateUser(
        req.params.id,
        req.user!.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, { message: 'User deactivated successfully' });
    } catch (err) {
      next(err);
    }
  }

  public async activateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await usersService.activateUser(
        req.params.id,
        req.user!.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, { message: 'User activated successfully' });
    } catch (err) {
      next(err);
    }
  }

  public async revokeSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await usersService.revokeSessions(
        req.params.id,
        req.user!.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, { message: 'User sessions revoked successfully' });
    } catch (err) {
      next(err);
    }
  }

  public async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await usersService.resetPassword(
        req.params.id,
        req.user!.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const usersController = new UsersController();

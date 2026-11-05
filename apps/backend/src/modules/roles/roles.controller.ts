import { Request, Response, NextFunction } from 'express';
import { rolesService } from './roles.service.js';
import { sendSuccess } from '../../http/response.js';

export class RolesController {
  public async listRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await rolesService.listRoles();
      sendSuccess(res, roles);
    } catch (err) {
      next(err);
    }
  }

  public async listPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = await rolesService.listPermissions();
      sendSuccess(res, permissions);
    } catch (err) {
      next(err);
    }
  }

  public async updateRolePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await rolesService.updateRolePermissions(
        req.params.id,
        req.body.permissions,
        req.user!.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, { message: 'Role permissions updated successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const rolesController = new RolesController();

import { Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service.js';
import { sendSuccess, sendPaginated } from '../../http/response.js';

export class AuditController {
  public async listLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 25;
      const actorUserId = req.query.actorUserId as string | undefined;
      const action = req.query.action as string | undefined;
      const entityType = req.query.entityType as string | undefined;
      const entityId = req.query.entityId as string | undefined;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      const { total, logs } = await auditService.listLogs({
        page,
        pageSize,
        actorUserId,
        action,
        entityType,
        entityId,
        from,
        to,
      });

      sendPaginated(res, logs, page, pageSize, total);
    } catch (err) {
      next(err);
    }
  }

  public async getLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const log = await auditService.getLogById(req.params.id);
      sendSuccess(res, log);
    } catch (err) {
      next(err);
    }
  }
}

export const auditController = new AuditController();


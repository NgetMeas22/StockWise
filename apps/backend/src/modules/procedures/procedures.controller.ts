import { Request, Response, NextFunction } from 'express';
import { proceduresService } from './procedures.service.js';
import { sendSuccess } from '../../http/response.js';

export class ProceduresController {
  public async listProcedures(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await proceduresService.listProcedures();
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async getProcedure(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await proceduresService.getProcedure(req.params.id);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async deductProcedure(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.session?.userId!;
      const data = await proceduresService.deductProcedureMaterials(
        req.params.id,
        req.body,
        userId,
        req.ip,
        req.headers['user-agent']
      );
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  }
}

export const proceduresController = new ProceduresController();


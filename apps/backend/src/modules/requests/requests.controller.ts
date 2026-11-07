import { Request, Response, NextFunction } from 'express';
import { requestsService } from './requests.service.js';
import { sendSuccess } from '../../http/response.js';

export class RequestsController {
  public async listRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, room, urgency } = req.query;
      const data = await requestsService.listRequests({
        status: status as string,
        room: room as string,
        urgency: urgency as string,
      });
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async createRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { room, productId, quantity, urgency, notes } = req.body;
      const result = await requestsService.createRequest(
        { room, productId, quantity: Number(quantity), urgency, notes },
        req.user!.id,
        req.ip,
        req.headers['user-agent'] as string | undefined,
        req.requestId
      );
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  public async fulfillRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { warehouseId } = req.body;
      const result = await requestsService.fulfillRequest(
        id,
        warehouseId,
        req.user!.id,
        req.ip,
        req.headers['user-agent'] as string | undefined,
        req.requestId
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  public async rejectRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason = 'Rejected by stock manager' } = req.body;
      const result = await requestsService.rejectRequest(
        id,
        reason,
        req.user!.id,
        req.ip,
        req.headers['user-agent'] as string | undefined,
        req.requestId
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const requestsController = new RequestsController();


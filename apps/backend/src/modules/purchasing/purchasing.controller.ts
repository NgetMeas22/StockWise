import { Request, Response, NextFunction } from 'express';
import { PurchaseOrderStatus } from '@prisma/client';
import { purchasingService } from './purchasing.service.js';
import { sendSuccess, sendPaginated } from '../../http/response.js';
import { can } from '../../middleware/requirePermission.js';

export class PurchasingController {
  public async listPurchaseOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 25;
      const status = req.query.status as PurchaseOrderStatus | undefined;
      const supplierId = req.query.supplierId as string | undefined;
      const warehouseId = req.query.warehouseId as string | undefined;
      const q = req.query.q as string | undefined;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      const canViewCost = can(req, 'products:view_cost');

      const { total, orders } = await purchasingService.listPurchaseOrders({
        page,
        pageSize,
        status,
        supplierId,
        warehouseId,
        q,
        from,
        to,
        canViewCost,
      });

      sendPaginated(res, orders, page, pageSize, total);
    } catch (err) {
      next(err);
    }
  }

  public async getPurchaseOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const canViewCost = can(req, 'products:view_cost');
      const order = await purchasingService.getPurchaseOrderById(req.params.id, canViewCost);
      sendSuccess(res, order);
    } catch (err) {
      next(err);
    }
  }

  public async createPurchaseOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await purchasingService.createPurchaseOrder(
        req.body,
        req.user!.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, order, 201);
    } catch (err) {
      next(err);
    }
  }

  public async updatePurchaseOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await purchasingService.updatePurchaseOrder(
        req.params.id,
        req.body,
        req.user!.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, order);
    } catch (err) {
      next(err);
    }
  }

  public async submitPurchaseOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await purchasingService.submitPurchaseOrder(
        req.params.id,
        req.user!.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, order);
    } catch (err) {
      next(err);
    }
  }

  public async cancelPurchaseOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reason } = req.body;
      const order = await purchasingService.cancelPurchaseOrder(
        req.params.id,
        reason,
        req.user!.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, order);
    } catch (err) {
      next(err);
    }
  }

  public async receivePurchaseOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await purchasingService.receivePurchaseOrder(
        req.params.id,
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
}

export const purchasingController = new PurchasingController();

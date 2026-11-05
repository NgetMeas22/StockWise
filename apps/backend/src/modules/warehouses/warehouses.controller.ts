import { Request, Response, NextFunction } from 'express';
import { warehousesService } from './warehouses.service.js';
import { sendSuccess } from '../../http/response.js';

export class WarehousesController {
  public async listWarehouses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const list = await warehousesService.listWarehouses();
      sendSuccess(res, list);
    } catch (err) {
      next(err);
    }
  }

  public async getWarehouse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const wh = await warehousesService.getWarehouseById(req.params.id);
      sendSuccess(res, wh);
    } catch (err) {
      next(err);
    }
  }

  public async createWarehouse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const wh = await warehousesService.createWarehouse(
        req.body,
        req.user!.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, wh, 201);
    } catch (err) {
      next(err);
    }
  }

  public async updateWarehouse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const wh = await warehousesService.updateWarehouse(
        req.params.id,
        req.body,
        req.user!.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, wh);
    } catch (err) {
      next(err);
    }
  }
}

export const warehousesController = new WarehousesController();

import { Request, Response, NextFunction } from 'express';
import { SupplierStatus } from '@prisma/client';
import { suppliersService } from './suppliers.service.js';
import { sendSuccess, sendPaginated } from '../../http/response.js';
import { can } from '../../middleware/requirePermission.js';

export class SuppliersController {
  public async listSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 25;
      const q = req.query.q as string | undefined;
      const status = req.query.status as SupplierStatus | undefined;

      const { total, suppliers } = await suppliersService.listSuppliers({
        page,
        pageSize,
        q,
        status,
      });

      sendPaginated(res, suppliers, page, pageSize, total);
    } catch (err) {
      next(err);
    }
  }

  public async getSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplier = await suppliersService.getSupplierById(req.params.id);
      sendSuccess(res, supplier);
    } catch (err) {
      next(err);
    }
  }

  public async createSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplier = await suppliersService.createSupplier(
        req.body,
        req.user!.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, supplier, 201);
    } catch (err) {
      next(err);
    }
  }

  public async updateSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplier = await suppliersService.updateSupplier(
        req.params.id,
        req.body,
        req.user!.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, supplier);
    } catch (err) {
      next(err);
    }
  }

  public async deactivateSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await suppliersService.setSupplierStatus(
        req.params.id,
        SupplierStatus.INACTIVE,
        req.user!.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, { message: 'Supplier deactivated successfully' });
    } catch (err) {
      next(err);
    }
  }

  public async activateSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await suppliersService.setSupplierStatus(
        req.params.id,
        SupplierStatus.ACTIVE,
        req.user!.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, { message: 'Supplier activated successfully' });
    } catch (err) {
      next(err);
    }
  }

  public async getSupplierPurchaseOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const canViewCost = can(req, 'products:view_cost');
      const pos = await suppliersService.getSupplierPurchaseOrders(req.params.id, canViewCost);
      sendSuccess(res, pos);
    } catch (err) {
      next(err);
    }
  }
}

export const suppliersController = new SuppliersController();

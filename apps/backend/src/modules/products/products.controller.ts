import { Request, Response, NextFunction } from 'express';
import { productsService } from './products.service.js';
import { sendSuccess, sendPaginated } from '../../http/response.js';
import { can } from '../../middleware/requirePermission.js';
import { storage } from '../../lib/storage.js';
import { ValidationError } from '../../http/errors.js';
import { RecordStatus } from '@prisma/client';

export class ProductsController {
  public async listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 25;
      const q = req.query.q as string | undefined;
      const categoryId = req.query.categoryId as string | undefined;
      const status = req.query.status as RecordStatus | undefined;
      const brand = req.query.brand as string | undefined;
      const stockState = req.query.stockState as 'in' | 'low' | 'out' | undefined;
      const isPublished =
        req.query.isPublished !== undefined
          ? req.query.isPublished === 'true'
          : undefined;
      const sort = req.query.sort as string | undefined;

      const canViewCost = can(req, 'products:view_cost');

      const { total, products } = await productsService.listProducts({
        page,
        pageSize,
        q,
        categoryId,
        status,
        brand,
        stockState,
        isPublished,
        sort,
        canViewCost,
      });

      sendPaginated(res, products, page, pageSize, total);
    } catch (err) {
      next(err);
    }
  }

  public async getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const canViewCost = can(req, 'products:view_cost');
      const canViewBalances = can(req, 'inventory:read');
      const product = await productsService.getProductById(req.params.id, canViewCost, canViewBalances);
      sendSuccess(res, product);
    } catch (err) {
      next(err);
    }
  }

  public async lookupProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = req.query.code as string;
      if (!code) {
        throw new ValidationError('Query parameter code is required');
      }
      const canViewCost = can(req, 'products:view_cost');
      const product = await productsService.lookupProduct(code, canViewCost);
      sendSuccess(res, product);
    } catch (err) {
      next(err);
    }
  }

  public async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const canViewCost = can(req, 'products:view_cost');
      const product = await productsService.createProduct(
        req.body,
        req.user!.id,
        canViewCost,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, product, 201);
    } catch (err) {
      next(err);
    }
  }

  public async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const canViewCost = can(req, 'products:view_cost');
      const product = await productsService.updateProduct(
        req.params.id,
        req.body,
        req.user!.id,
        canViewCost,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, product);
    } catch (err) {
      next(err);
    }
  }

  public async archiveProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productsService.archiveProduct(
        req.params.id,
        req.user?.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, product);
    } catch (err) {
      next(err);
    }
  }

  public async restoreProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productsService.restoreProduct(
        req.params.id,
        req.user?.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, product);
    } catch (err) {
      next(err);
    }
  }

  public async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new ValidationError('No image file uploaded');
      }

      const saveResult = await storage.saveImage(req.file.buffer, req.file.originalname);

      const updated = await productsService.updateProductImage(
        req.params.id,
        saveResult.fileKey,
        req.user?.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );

      sendSuccess(res, {
        imageKey: saveResult.fileKey,
        product: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const productsController = new ProductsController();

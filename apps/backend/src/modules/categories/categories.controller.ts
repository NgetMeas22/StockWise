import { Request, Response, NextFunction } from 'express';
import { categoriesService } from './categories.service.js';
import { sendSuccess } from '../../http/response.js';
import { RecordStatus } from '@prisma/client';

export class CategoriesController {
  public async listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tree = req.query.tree === 'true';
      const status = req.query.status as RecordStatus | undefined;
      const parentId = req.query.parentId !== undefined ? (req.query.parentId as string) || null : undefined;
      const q = req.query.q as string | undefined;

      const result = await categoriesService.listCategories({
        tree,
        status,
        parentId,
        q,
      });

      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  public async getCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoriesService.getCategoryById(req.params.id);
      sendSuccess(res, category);
    } catch (err) {
      next(err);
    }
  }

  public async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await categoriesService.createCategory(
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

  public async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await categoriesService.updateCategory(
        req.params.id,
        req.body,
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

  public async archiveCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { moveProductsTo } = req.body || {};
      await categoriesService.archiveCategory(
        req.params.id,
        moveProductsTo,
        req.user?.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, { message: 'Category archived successfully' });
    } catch (err) {
      next(err);
    }
  }

  public async restoreCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await categoriesService.restoreCategory(
        req.params.id,
        req.user?.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, { message: 'Category restored successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const categoriesController = new CategoriesController();

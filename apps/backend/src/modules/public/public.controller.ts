import { Request, Response, NextFunction } from 'express';
import { publicService } from './public.service.js';
import { sendSuccess, sendPaginated } from '../../http/response.js';
import { storage } from '../../lib/storage.js';
import { NotFoundError } from '../../http/errors.js';

export class PublicController {
  public async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tree = await publicService.getCategoriesTree();
      res.setHeader('Cache-Control', 'public, max-age=60'); // 1 minute cache
      sendSuccess(res, tree);
    } catch (err) {
      next(err);
    }
  }

  public async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Math.min(Number(req.query.pageSize) || 24, 48); // max 48 per spec
      const categorySlug = req.query.categorySlug as string | undefined;
      const brand = req.query.brand as string | undefined;
      const q = req.query.q as string | undefined;
      const sort = req.query.sort as string | undefined;
      const minPrice = req.query.minPrice !== undefined ? Number(req.query.minPrice) : undefined;
      const maxPrice = req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : undefined;

      const { total, products } = await publicService.getProducts({
        page,
        pageSize,
        categorySlug,
        brand,
        q,
        sort,
        minPrice,
        maxPrice,
      });

      res.setHeader('Cache-Control', 'public, max-age=30');
      sendPaginated(res, products, page, pageSize, total);
    } catch (err) {
      next(err);
    }
  }

  public async getProductBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await publicService.getProductBySlug(req.params.slug);
      res.setHeader('Cache-Control', 'public, max-age=60');
      sendSuccess(res, product);
    } catch (err) {
      next(err);
    }
  }

  public async getBrands(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brands = await publicService.getBrands();
      res.setHeader('Cache-Control', 'public, max-age=300');
      sendSuccess(res, brands);
    } catch (err) {
      next(err);
    }
  }

  public async getImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filePath = storage.getFilePath(req.params.key);
      if (!filePath) {
        throw new NotFoundError('Image not found');
      }

      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h cache
      res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  }
}

export const publicController = new PublicController();


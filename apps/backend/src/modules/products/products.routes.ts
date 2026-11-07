import { Router } from 'express';
import multer from 'multer';
import { productsController } from './products.controller.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { validate } from '../../middleware/validate.js';
import { createProductSchema, updateProductSchema, paginationQuerySchema } from '@stockwise/shared';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB memory limit before sniffer check
});

const router = Router();

router.get('/lookup', requirePermission('products:read'), productsController.lookupProduct);
router.get('/', requirePermission('products:read'), validate({ query: paginationQuerySchema }), productsController.listProducts);
router.post('/', requirePermission('products:create'), validate({ body: createProductSchema }), productsController.createProduct);
router.get('/:id', requirePermission('products:read'), productsController.getProduct);
router.patch('/:id', requirePermission('products:update'), validate({ body: updateProductSchema }), productsController.updateProduct);
router.put('/:id', requirePermission('products:update'), validate({ body: updateProductSchema }), productsController.updateProduct);
router.delete('/:id', requirePermission('products:archive'), productsController.archiveProduct);
router.post('/:id/restore', requirePermission('products:archive'), productsController.restoreProduct);
router.post('/:id/image', requirePermission('products:update'), upload.single('image'), productsController.uploadImage);
router.delete('/:id/image', requirePermission('products:update'), productsController.removeImage);

export const productsRoutes = router;


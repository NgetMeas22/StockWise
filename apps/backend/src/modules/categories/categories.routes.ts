import { Router } from 'express';
import { categoriesController } from './categories.controller.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { validate } from '../../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from '@stockwise/shared';

const router = Router();

router.get('/', requirePermission('categories:read'), categoriesController.listCategories);
router.post('/', requirePermission('categories:manage'), validate({ body: createCategorySchema }), categoriesController.createCategory);
router.get('/:id', requirePermission('categories:read'), categoriesController.getCategory);
router.patch('/:id', requirePermission('categories:manage'), validate({ body: updateCategorySchema }), categoriesController.updateCategory);
router.put('/:id', requirePermission('categories:manage'), validate({ body: updateCategorySchema }), categoriesController.updateCategory);
router.post('/:id/archive', requirePermission('categories:manage'), categoriesController.archiveCategory);
router.post('/:id/restore', requirePermission('categories:manage'), categoriesController.restoreCategory);

export const categoriesRoutes = router;


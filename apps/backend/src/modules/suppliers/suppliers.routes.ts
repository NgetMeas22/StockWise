import { Router } from 'express';
import { suppliersController } from './suppliers.controller.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { validate } from '../../middleware/validate.js';
import { createSupplierSchema, updateSupplierSchema, paginationQuerySchema } from '@stockwise/shared';

const router = Router();

router.get('/', requirePermission('suppliers:read'), validate({ query: paginationQuerySchema }), suppliersController.listSuppliers);
router.post('/', requirePermission('suppliers:manage'), validate({ body: createSupplierSchema }), suppliersController.createSupplier);
router.get('/:id', requirePermission('suppliers:read'), suppliersController.getSupplier);
router.patch('/:id', requirePermission('suppliers:manage'), validate({ body: updateSupplierSchema }), suppliersController.updateSupplier);
router.post('/:id/deactivate', requirePermission('suppliers:manage'), suppliersController.deactivateSupplier);
router.post('/:id/activate', requirePermission('suppliers:manage'), suppliersController.activateSupplier);
router.get('/:id/purchase-orders', requirePermission('suppliers:read', 'purchases:read'), suppliersController.getSupplierPurchaseOrders);

export const suppliersRoutes = router;


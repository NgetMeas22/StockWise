import { Router } from 'express';
import { purchasingController } from './purchasing.controller.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { validate } from '../../middleware/validate.js';
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  cancelPurchaseOrderSchema,
  receivePurchaseOrderSchema,
  paginationQuerySchema,
} from '@stockwise/shared';

const router = Router();

router.get('/', requirePermission('purchases:read'), validate({ query: paginationQuerySchema }), purchasingController.listPurchaseOrders);
router.post('/', requirePermission('purchases:manage'), validate({ body: createPurchaseOrderSchema }), purchasingController.createPurchaseOrder);
router.get('/:id', requirePermission('purchases:read'), purchasingController.getPurchaseOrder);
router.patch('/:id', requirePermission('purchases:manage'), validate({ body: updatePurchaseOrderSchema }), purchasingController.updatePurchaseOrder);
router.post('/:id/submit', requirePermission('purchases:manage'), purchasingController.submitPurchaseOrder);
router.post('/:id/cancel', requirePermission('purchases:cancel'), validate({ body: cancelPurchaseOrderSchema }), purchasingController.cancelPurchaseOrder);
router.post('/:id/receipts', requirePermission('purchases:receive'), validate({ body: receivePurchaseOrderSchema }), purchasingController.receivePurchaseOrder);

export const purchasingRoutes = router;


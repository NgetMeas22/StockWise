import { Router } from 'express';
import { inventoryController } from './inventory.controller.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { validate } from '../../middleware/validate.js';
import {
  stockReceiptSchema,
  stockIssueSchema,
  stockAdjustmentSchema,
  stockTransferSchema,
  stockReversalSchema,
} from '@stockwise/shared';

const router = Router();

router.get('/balances', requirePermission('inventory:read'), inventoryController.getBalances);
router.get('/movements', requirePermission('inventory:read'), inventoryController.getMovements);
router.get('/movements/:id', requirePermission('inventory:read'), inventoryController.getMovementById);

router.post('/receipts', requirePermission('inventory:receive'), validate({ body: stockReceiptSchema }), inventoryController.receiveStock);
router.post('/issues', requirePermission('inventory:issue'), validate({ body: stockIssueSchema }), inventoryController.issueStock);
router.post('/adjustments', requirePermission('inventory:adjust'), validate({ body: stockAdjustmentSchema }), inventoryController.adjustStock);
router.post('/transfers', requirePermission('inventory:transfer'), validate({ body: stockTransferSchema }), inventoryController.transferStock);
router.post('/movements/:id/reversals', requirePermission('inventory:adjust'), validate({ body: stockReversalSchema }), inventoryController.reverseMovement);

export const inventoryRoutes = router;


import { Router } from 'express';
import { warehousesController } from './warehouses.controller.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { validate } from '../../middleware/validate.js';
import { createWarehouseSchema, updateWarehouseSchema } from '@stockwise/shared';

const router = Router();

router.get('/', requirePermission('inventory:read'), warehousesController.listWarehouses);
router.post('/', requirePermission('settings:manage'), validate({ body: createWarehouseSchema }), warehousesController.createWarehouse);
router.get('/:id', requirePermission('inventory:read'), warehousesController.getWarehouse);
router.patch('/:id', requirePermission('settings:manage'), validate({ body: updateWarehouseSchema }), warehousesController.updateWarehouse);

export const warehousesRoutes = router;


import { Router } from 'express';
import { proceduresController } from './procedures.controller.js';
import { requireAuth } from '../../middleware/session.js';
import { requirePermission } from '../../middleware/requirePermission.js';

export const proceduresRouter = Router();

proceduresRouter.use(requireAuth);

proceduresRouter.get(
  '/',
  requirePermission('products:read'),
  proceduresController.listProcedures
);

proceduresRouter.get(
  '/:id',
  requirePermission('products:read'),
  proceduresController.getProcedure
);

proceduresRouter.post(
  '/:id/deduct',
  requirePermission('inventory:issue'),
  proceduresController.deductProcedure
);

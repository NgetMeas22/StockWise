import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { exportRateLimiter } from '../../middleware/rateLimit.js';

const router = Router();

router.get('/summary', requirePermission('reports:read'), reportsController.getSummary);
router.get('/inventory-valuation', requirePermission('reports:valuation'), exportRateLimiter, reportsController.getInventoryValuation);
router.get('/low-stock', requirePermission('reports:read'), exportRateLimiter, reportsController.getLowStock);
router.get('/out-of-stock', requirePermission('reports:read'), exportRateLimiter, reportsController.getOutOfStock);

export const reportsRoutes = router;


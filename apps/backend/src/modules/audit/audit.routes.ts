import { Router } from 'express';
import { auditController } from './audit.controller.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { validate } from '../../middleware/validate.js';
import { paginationQuerySchema } from '@stockwise/shared';

const router = Router();

router.get('/', requirePermission('audit_logs:read'), validate({ query: paginationQuerySchema }), auditController.listLogs);
router.get('/:id', requirePermission('audit_logs:read'), auditController.getLog);

export const auditRoutes = router;


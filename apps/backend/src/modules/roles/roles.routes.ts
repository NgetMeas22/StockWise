import { Router } from 'express';
import { rolesController } from './roles.controller.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { validate } from '../../middleware/validate.js';
import { updateRolePermissionsSchema } from '@stockwise/shared';

const router = Router();

router.get('/roles', requirePermission('users:read'), rolesController.listRoles);
router.get('/permissions', requirePermission('users:read'), rolesController.listPermissions);
router.put('/roles/:id/permissions', requirePermission('roles:manage'), validate({ body: updateRolePermissionsSchema }), rolesController.updateRolePermissions);

export const rolesRoutes = router;


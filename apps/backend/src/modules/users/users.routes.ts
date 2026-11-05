import { Router } from 'express';
import { usersController } from './users.controller.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { validate } from '../../middleware/validate.js';
import { createUserSchema, updateUserSchema, paginationQuerySchema } from '@stockwise/shared';

const router = Router();

router.get('/', requirePermission('users:read'), validate({ query: paginationQuerySchema }), usersController.listUsers);
router.post('/', requirePermission('users:manage'), validate({ body: createUserSchema }), usersController.createUser);
router.get('/:id', requirePermission('users:read'), usersController.getUser);
router.patch('/:id', requirePermission('users:manage'), validate({ body: updateUserSchema }), usersController.updateUser);
router.post('/:id/deactivate', requirePermission('users:manage'), usersController.deactivateUser);
router.post('/:id/activate', requirePermission('users:manage'), usersController.activateUser);
router.post('/:id/revoke-sessions', requirePermission('users:manage'), usersController.revokeSessions);
router.post('/:id/reset-password', requirePermission('users:manage'), usersController.resetPassword);

export const usersRoutes = router;


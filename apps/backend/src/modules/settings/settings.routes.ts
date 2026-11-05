import { Router } from 'express';
import { settingsController } from './settings.controller.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { requireAuth } from '../../middleware/session.js';
import { validate } from '../../middleware/validate.js';
import { updateSettingsSchema } from '@stockwise/shared';

const router = Router();

router.get('/', requireAuth, settingsController.getSettings);
router.patch('/', requirePermission('settings:manage'), validate({ body: updateSettingsSchema }), settingsController.updateSettings);

export const settingsRoutes = router;


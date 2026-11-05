import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { loginSchema, changePasswordSchema } from '@stockwise/shared';
import { loginRateLimiter } from '../../middleware/rateLimit.js';
import { requireAuth } from '../../middleware/session.js';

const router = Router();

router.post('/login', loginRateLimiter, validate({ body: loginSchema }), authController.login);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.getMe);
router.post('/change-password', requireAuth, validate({ body: changePasswordSchema }), authController.changePassword);

export const authRoutes = router;


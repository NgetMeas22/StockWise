import { Router } from 'express';
import multer from 'multer';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} from '@stockwise/shared';
import { loginRateLimiter } from '../../middleware/rateLimit.js';
import { requireAuth } from '../../middleware/session.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router();

router.post('/login', loginRateLimiter, validate({ body: loginSchema }), authController.login);
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), authController.forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), authController.resetPassword);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.getMe);
router.post('/change-password', requireAuth, validate({ body: changePasswordSchema }), authController.changePassword);
router.patch('/profile', requireAuth, validate({ body: updateProfileSchema }), authController.updateProfile);
router.post('/profile/avatar', requireAuth, upload.single('avatar'), authController.uploadAvatar);
router.delete('/profile/avatar', requireAuth, authController.removeAvatar);

export const authRoutes = router;


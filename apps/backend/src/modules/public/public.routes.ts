import { Router } from 'express';
import { publicController } from './public.controller.js';
import { publicApiRateLimiter } from '../../middleware/rateLimit.js';

const router = Router();

// Strict public rate limiter applied to all public catalog endpoints
router.use(publicApiRateLimiter);

router.get('/categories', publicController.getCategories);
router.get('/products', publicController.getProducts);
router.get('/products/:slug', publicController.getProductBySlug);
router.get('/brands', publicController.getBrands);
router.get('/images/:key', publicController.getImage);

export const publicRoutes = router;


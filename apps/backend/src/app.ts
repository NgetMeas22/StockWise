import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { requestIdMiddleware } from './http/request-id.js';
import { sessionMiddleware } from './middleware/session.js';
import { csrfProtection } from './middleware/csrf.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './http/errors.js';

// Import route modules
import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { rolesRoutes } from './modules/roles/roles.routes.js';
import { categoriesRoutes } from './modules/categories/categories.routes.js';
import { productsRoutes } from './modules/products/products.routes.js';
import { warehousesRoutes } from './modules/warehouses/warehouses.routes.js';
import { inventoryRoutes } from './modules/inventory/inventory.routes.js';
import { suppliersRoutes } from './modules/suppliers/suppliers.routes.js';
import { purchasingRoutes } from './modules/purchasing/purchasing.routes.js';
import { reportsRoutes } from './modules/reports/reports.routes.js';
import { auditRoutes } from './modules/audit/audit.routes.js';
import { settingsRoutes } from './modules/settings/settings.routes.js';
import { publicRoutes } from './modules/public/public.routes.js';
import { systemRoutes } from './modules/system/system.routes.js';

// BigInt serialization polyfill for JSON.stringify
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

export function createApp(): Express {
  const app = express();

  // 1. Trust Proxy
  if (env.TRUST_PROXY > 0) {
    app.set('trust proxy', env.TRUST_PROXY);
  }

  // 2. Request ID
  app.use(requestIdMiddleware);

  // 3. Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // frontend handles its own CSP if needed
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // 4. CORS
  app.use(
    cors({
      origin: env.WEB_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-Id', 'Idempotency-Key'],
    })
  );

  // 5. Body Parsers with limits
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // 6. Request Logging
  app.use(
    pinoHttp({
      logger,
      genReqId: (req: any) => String(req.id || ''),
      autoLogging: env.NODE_ENV !== 'test',
    })
  );

  // 7. Cookies
  app.use(cookieParser());

  // 8. Session resolution
  app.use(sessionMiddleware);

  // 9. CSRF protection on state-changing requests
  app.use(csrfProtection);

  // 10. Mount API Routers
  const apiV1 = express.Router();

  apiV1.use('/', systemRoutes);
  apiV1.use('/public', publicRoutes);
  apiV1.use('/auth', authRoutes);
  apiV1.use('/users', usersRoutes);
  apiV1.use('/', rolesRoutes);
  apiV1.use('/categories', categoriesRoutes);
  apiV1.use('/products', productsRoutes);
  apiV1.use('/warehouses', warehousesRoutes);
  apiV1.use('/inventory', inventoryRoutes);
  apiV1.use('/suppliers', suppliersRoutes);
  apiV1.use('/purchase-orders', purchasingRoutes);
  apiV1.use('/reports', reportsRoutes);
  apiV1.use('/audit-logs', auditRoutes);
  apiV1.use('/settings', settingsRoutes);

  app.use('/api/v1', apiV1);

  // 11. Catch-all for undefined routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`));
  });

  // 12. Central Error Handler
  app.use(errorHandler);

  return app;
}

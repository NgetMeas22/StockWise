import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../http/errors.js';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(config: RateLimitConfig) {
  const store = new Map<string, ClientRecord>();

  // Cleanup expired entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = config.keyGenerator
      ? config.keyGenerator(req)
      : req.ip || req.socket.remoteAddress || 'unknown';

    const now = Date.now();
    const record = store.get(key);

    if (!record || now > record.resetTime) {
      store.set(key, { count: 1, resetTime: now + config.windowMs });
      return next();
    }

    record.count++;

    if (record.count > config.maxRequests) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return next(new RateLimitError(`Too many requests. Please retry in ${retryAfterSec} seconds.`));
    }

    next();
  };
}

// Pre-configured rate limiters per spec
export const loginRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
  keyGenerator: (req) => {
    const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : '';
    const ip = req.ip || 'unknown';
    return `login:${ip}:${email}`;
  },
});

export const publicApiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120,
  keyGenerator: (req) => `public:${req.ip || 'unknown'}`,
});

export const exportRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  keyGenerator: (req) => `export:${req.user?.id || req.ip || 'unknown'}`,
});

export const authenticatedRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 300,
  keyGenerator: (req) => `auth:${req.user?.id || req.ip || 'unknown'}`,
});


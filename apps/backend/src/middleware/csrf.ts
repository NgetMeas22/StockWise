import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { verifyCsrfToken } from '../lib/tokens.js';
import { ForbiddenError } from '../http/errors.js';

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());

  if (!isStateChanging) {
    return next();
  }

  // Login & recovery endpoints establish a new session and must never be blocked by an existing session's CSRF token
  const url = req.originalUrl || req.url || '';
  if (
    url.includes('/auth/login') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password')
  ) {
    return next();
  }

  // Allow unauthenticated routes like login or public endpoints to proceed past CSRF token check,
  // but verify Origin if present
  const origin = req.headers.origin || req.headers.referer;
  if (origin && env.NODE_ENV === 'production') {
    try {
      const originUrl = new URL(origin);
      const expectedUrl = new URL(env.WEB_ORIGIN);
      if (originUrl.origin !== expectedUrl.origin) {
        return next(new ForbiddenError('Invalid request origin'));
      }
    } catch {
      return next(new ForbiddenError('Malformed origin header'));
    }
  }

  // If request has an active session, CSRF token is MANDATORY
  if (req.session) {
    const rawCsrfHeader = req.header('X-CSRF-Token');
    if (!rawCsrfHeader) {
      return next(new ForbiddenError('Missing CSRF token header (X-CSRF-Token)'));
    }

    const isValid = verifyCsrfToken(rawCsrfHeader, req.session.csrfHash);
    if (!isValid) {
      return next(new ForbiddenError('Invalid or expired CSRF token'));
    }
  }

  next();
}


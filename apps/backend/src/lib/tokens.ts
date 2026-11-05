import crypto from 'crypto';
import { env } from '../config/env.js';

export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashCsrfToken(csrfToken: string): string {
  return crypto.createHmac('sha256', env.CSRF_SECRET).update(csrfToken).digest('hex');
}

export function verifyCsrfToken(rawToken: string, storedHash: string): boolean {
  const calculatedHash = hashCsrfToken(rawToken);
  try {
    return crypto.timingSafeEqual(Buffer.from(calculatedHash), Buffer.from(storedHash));
  } catch {
    return false;
  }
}


import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root if not already loaded
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_MIGRATION_URL: z.string().optional(),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  TRUST_PROXY: z.coerce.number().default(0),
  SESSION_IDLE_MINUTES: z.coerce.number().default(30),
  SESSION_ABSOLUTE_HOURS: z.coerce.number().default(12),
  CSRF_SECRET: z.string().min(32, 'CSRF_SECRET must be at least 32 characters long'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_MB: z.coerce.number().default(5),
  SEED_ADMIN_EMAIL: z.string().email().default('admin@stockwise.local'),
  SEED_ADMIN_PASSWORD: z.string().default('AdminPassword123!'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;


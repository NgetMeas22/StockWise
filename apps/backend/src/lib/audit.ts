import { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';
import { logger } from './logger.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'tokenhash',
  'csrfhash',
  'csrftoken',
  'token',
]);

function redactObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(redactObject);
  }

  // Handle Prisma Decimal or other decimal objects
  if ((obj as any).toFixed && typeof (obj as any).toFixed === 'function') {
    return (obj as any).toString();
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else if (typeof val === 'bigint') {
      result[key] = Number(val);
    } else if (val instanceof Date) {
      result[key] = val.toISOString();
    } else if (val && typeof (val as any).toFixed === 'function') {
      result[key] = (val as any).toString();
    } else if (typeof val === 'object' && val !== null) {
      result[key] = redactObject(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

export interface WriteAuditLogParams {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | number | null;
  tx?: Prisma.TransactionClient;
}

export async function writeAuditLog(params: WriteAuditLogParams): Promise<void> {
  const client = params.tx || prisma;
  const beforeJson = params.before ? (redactObject(params.before) as Prisma.InputJsonValue) : Prisma.JsonNull;
  const afterJson = params.after ? (redactObject(params.after) as Prisma.InputJsonValue) : Prisma.JsonNull;

  try {
    await client.auditLog.create({
      data: {
        actorUserId: params.actorUserId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        before: beforeJson,
        after: afterJson,
        ip: params.ip || null,
        userAgent: params.userAgent || null,
        requestId: params.requestId ? String(params.requestId) : null,
      },
    });
  } catch (error) {
    logger.error({ error, action: params.action }, 'Failed to write audit log entry');
  }
}

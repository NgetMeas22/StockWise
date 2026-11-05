import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../http/errors.js';

export class AuditService {
  public async listLogs(params: {
    page: number;
    pageSize: number;
    actorUserId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    from?: string;
    to?: string;
  }) {
    const { page, pageSize, actorUserId, action, entityType, entityId, from, to } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (actorUserId) where.actorUserId = actorUserId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { seq: 'desc' },
        include: {
          actor: { select: { fullName: true, email: true } },
        },
      }),
    ]);

    const formatted = logs.map((l) => ({
      id: l.id,
      seq: Number(l.seq),
      actorUserId: l.actorUserId,
      actorName: l.actor?.fullName || null,
      actorEmail: l.actor?.email || null,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      before: l.before,
      after: l.after,
      ip: l.ip,
      userAgent: l.userAgent,
      requestId: l.requestId,
      createdAt: l.createdAt.toISOString(),
    }));

    return { total, logs: formatted };
  }

  public async getLogById(id: string) {
    const l = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        actor: { select: { fullName: true, email: true } },
      },
    });

    if (!l) throw new NotFoundError('Audit log entry not found');

    return {
      id: l.id,
      seq: Number(l.seq),
      actorUserId: l.actorUserId,
      actorName: l.actor?.fullName || null,
      actorEmail: l.actor?.email || null,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      before: l.before,
      after: l.after,
      ip: l.ip,
      userAgent: l.userAgent,
      requestId: l.requestId,
      createdAt: l.createdAt.toISOString(),
    };
  }
}

export const auditService = new AuditService();


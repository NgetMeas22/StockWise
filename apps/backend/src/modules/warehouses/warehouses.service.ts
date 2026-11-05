import { RecordStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { ConflictError, NotFoundError } from '../../http/errors.js';
import { writeAuditLog } from '../../lib/audit.js';

export class WarehousesService {
  public async listWarehouses() {
    return prisma.warehouse.findMany({
      orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
      include: {
        _count: {
          select: { inventoryBalances: true },
        },
      },
    });
  }

  public async getWarehouseById(id: string) {
    const wh = await prisma.warehouse.findUnique({
      where: { id },
    });
    if (!wh) throw new NotFoundError('Warehouse not found');
    return wh;
  }

  public async createWarehouse(
    input: {
      code: string;
      name: string;
      address?: string | null;
      isDefault?: boolean;
      status?: RecordStatus;
    },
    actorUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const code = input.code.trim().toUpperCase();

    const existing = await prisma.warehouse.findUnique({ where: { code } });
    if (existing) {
      throw new ConflictError(`Warehouse with code '${code}' already exists`);
    }

    return await prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.warehouse.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      const wh = await tx.warehouse.create({
        data: {
          code,
          name: input.name.trim(),
          address: input.address?.trim() || null,
          isDefault: input.isDefault || false,
          status: input.status || RecordStatus.ACTIVE,
        },
      });

      await writeAuditLog({
        actorUserId,
        action: 'WAREHOUSE_CREATED',
        entityType: 'WAREHOUSE',
        entityId: wh.id,
        after: wh,
        ip,
        userAgent,
        requestId,
        tx,
      });

      return wh;
    });
  }

  public async updateWarehouse(
    id: string,
    input: {
      code?: string;
      name?: string;
      address?: string | null;
      isDefault?: boolean;
      status?: RecordStatus;
    },
    actorUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const existing = await prisma.warehouse.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Warehouse not found');

    const code = input.code ? input.code.trim().toUpperCase() : undefined;
    if (code && code !== existing.code) {
      const duplicate = await prisma.warehouse.findUnique({ where: { code } });
      if (duplicate) {
        throw new ConflictError(`Warehouse code '${code}' is already in use`);
      }
    }

    return await prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.warehouse.updateMany({
          where: { isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      const updated = await tx.warehouse.update({
        where: { id },
        data: {
          code,
          name: input.name ? input.name.trim() : undefined,
          address: input.address !== undefined ? (input.address ? input.address.trim() : null) : undefined,
          isDefault: input.isDefault !== undefined ? input.isDefault : undefined,
          status: input.status !== undefined ? input.status : undefined,
        },
      });

      await writeAuditLog({
        actorUserId,
        action: 'WAREHOUSE_UPDATED',
        entityType: 'WAREHOUSE',
        entityId: id,
        before: existing,
        after: updated,
        ip,
        userAgent,
        requestId,
        tx,
      });

      return updated;
    });
  }
}

export const warehousesService = new WarehousesService();

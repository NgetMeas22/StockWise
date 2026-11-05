import { SupplierStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { ConflictError, NotFoundError } from '../../http/errors.js';
import { writeAuditLog } from '../../lib/audit.js';

export class SuppliersService {
  public async listSuppliers(params: {
    page: number;
    pageSize: number;
    q?: string;
    status?: SupplierStatus;
  }) {
    const { page, pageSize, q, status } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { contactPerson: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, suppliers] = await Promise.all([
      prisma.supplier.count({ where }),
      prisma.supplier.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { purchaseOrders: true },
          },
        },
      }),
    ]);

    const formatted = suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      contactPerson: s.contactPerson,
      email: s.email,
      phone: s.phone,
      address: s.address,
      notes: s.notes,
      status: s.status,
      purchaseOrderCount: s._count.purchaseOrders,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return { total, suppliers: formatted };
  }

  public async getSupplierById(id: string) {
    const s = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: { select: { purchaseOrders: true } },
      },
    });

    if (!s) throw new NotFoundError('Supplier not found');

    return {
      id: s.id,
      name: s.name,
      contactPerson: s.contactPerson,
      email: s.email,
      phone: s.phone,
      address: s.address,
      notes: s.notes,
      status: s.status,
      purchaseOrderCount: s._count.purchaseOrders,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }

  public async createSupplier(
    input: {
      name: string;
      contactPerson?: string | null;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      notes?: string | null;
      status?: SupplierStatus;
    },
    actorUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const name = input.name.trim();

    const existing = await prisma.supplier.findUnique({ where: { name } });
    if (existing) {
      throw new ConflictError(`Supplier '${name}' already exists`);
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactPerson: input.contactPerson?.trim() || null,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        notes: input.notes?.trim() || null,
        status: input.status || SupplierStatus.ACTIVE,
      },
    });

    await writeAuditLog({
      actorUserId,
      action: 'SUPPLIER_CREATED',
      entityType: 'SUPPLIER',
      entityId: supplier.id,
      after: supplier,
      ip,
      userAgent,
      requestId,
    });

    return supplier;
  }

  public async updateSupplier(
    id: string,
    input: {
      name?: string;
      contactPerson?: string | null;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      notes?: string | null;
      status?: SupplierStatus;
    },
    actorUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Supplier not found');

    const name = input.name ? input.name.trim() : undefined;
    if (name && name !== existing.name) {
      const duplicate = await prisma.supplier.findUnique({ where: { name } });
      if (duplicate) {
        throw new ConflictError(`Supplier '${name}' already exists`);
      }
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        contactPerson: input.contactPerson !== undefined ? (input.contactPerson ? input.contactPerson.trim() : null) : undefined,
        email: input.email !== undefined ? (input.email ? input.email.trim() : null) : undefined,
        phone: input.phone !== undefined ? (input.phone ? input.phone.trim() : null) : undefined,
        address: input.address !== undefined ? (input.address ? input.address.trim() : null) : undefined,
        notes: input.notes !== undefined ? (input.notes ? input.notes.trim() : null) : undefined,
        status: input.status !== undefined ? input.status : undefined,
      },
    });

    await writeAuditLog({
      actorUserId,
      action: 'SUPPLIER_UPDATED',
      entityType: 'SUPPLIER',
      entityId: id,
      before: existing,
      after: updated,
      ip,
      userAgent,
      requestId,
    });

    return updated;
  }

  public async setSupplierStatus(
    id: string,
    status: SupplierStatus,
    actorUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const updated = await prisma.supplier.update({
      where: { id },
      data: { status },
    });

    await writeAuditLog({
      actorUserId,
      action: status === SupplierStatus.ACTIVE ? 'SUPPLIER_ACTIVATED' : 'SUPPLIER_DEACTIVATED',
      entityType: 'SUPPLIER',
      entityId: id,
      ip,
      userAgent,
      requestId,
    });

    return updated;
  }

  public async getSupplierPurchaseOrders(supplierId: string, canViewCost: boolean) {
    const pos = await prisma.purchaseOrder.findMany({
      where: { supplierId },
      orderBy: { createdAt: 'desc' },
      include: {
        warehouse: { select: { code: true, name: true } },
        items: true,
      },
    });

    return pos.map((po) => {
      let totalCost: number | undefined = undefined;
      if (canViewCost) {
        totalCost = po.items.reduce(
          (sum, it) => sum + Number(it.quantityOrdered) * Number(it.unitCost),
          0
        );
      }

      return {
        id: po.id,
        poNumber: po.poNumber,
        warehouseCode: po.warehouse.code,
        warehouseName: po.warehouse.name,
        status: po.status,
        orderDate: po.orderDate.toISOString(),
        expectedDate: po.expectedDate ? po.expectedDate.toISOString() : null,
        itemCount: po.items.length,
        totalCost: totalCost !== undefined ? totalCost.toFixed(2) : undefined,
        createdAt: po.createdAt.toISOString(),
      };
    });
  }
}

export const suppliersService = new SuppliersService();

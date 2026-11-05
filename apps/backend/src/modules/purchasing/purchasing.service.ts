import { PurchaseOrderStatus, MovementType, ReasonCode, ReferenceType, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { ConflictError, NotFoundError, ValidationError } from '../../http/errors.js';
import { stockService } from '../inventory/stockService.js';
import { writeAuditLog } from '../../lib/audit.js';

export class PurchasingService {
  /**
   * Helper to generate sequentially incremented document number inside a transaction
   */
  private async getNextDocumentNumber(tx: Prisma.TransactionClient, scope: 'PURCHASE_ORDER' | 'GOODS_RECEIPT', prefix: string): Promise<string> {
    const year = new Date().getFullYear();

    const counter = await tx.documentCounter.upsert({
      where: { scope_year: { scope, year } },
      update: { lastValue: { increment: 1 } },
      create: { scope, year, lastValue: 1 },
    });

    const seqStr = String(counter.lastValue).padStart(6, '0');
    return `${prefix}-${year}-${seqStr}`;
  }

  public async listPurchaseOrders(params: {
    page: number;
    pageSize: number;
    status?: PurchaseOrderStatus;
    supplierId?: string;
    warehouseId?: string;
    q?: string;
    from?: string;
    to?: string;
    canViewCost: boolean;
  }) {
    const { page, pageSize, status, supplierId, warehouseId, q, from, to, canViewCost } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (q) {
      where.poNumber = { contains: q, mode: 'insensitive' };
    }
    if (from || to) {
      where.orderDate = {};
      if (from) where.orderDate.gte = new Date(from);
      if (to) where.orderDate.lte = new Date(to);
    }

    const [total, orders] = await Promise.all([
      prisma.purchaseOrder.count({ where }),
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { id: true, name: true } },
          warehouse: { select: { id: true, code: true, name: true } },
          creator: { select: { id: true, fullName: true } },
          items: true,
        },
      }),
    ]);

    const formatted = orders.map((po) => {
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
        supplierId: po.supplierId,
        supplierName: po.supplier.name,
        warehouseId: po.warehouseId,
        warehouseCode: po.warehouse.code,
        warehouseName: po.warehouse.name,
        status: po.status,
        orderDate: po.orderDate.toISOString(),
        expectedDate: po.expectedDate ? po.expectedDate.toISOString() : null,
        notes: po.notes,
        createdBy: po.createdBy,
        creatorName: po.creator.fullName,
        version: po.version,
        itemCount: po.items.length,
        totalCost: totalCost !== undefined ? totalCost.toFixed(2) : undefined,
        createdAt: po.createdAt.toISOString(),
        updatedAt: po.updatedAt.toISOString(),
      };
    });

    return { total, orders: formatted };
  }

  public async getPurchaseOrderById(id: string, canViewCost: boolean) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        warehouse: true,
        creator: { select: { id: true, fullName: true, email: true } },
        orderer: { select: { id: true, fullName: true } },
        canceller: { select: { id: true, fullName: true } },
        items: {
          include: {
            product: { select: { id: true, sku: true, name: true, unit: true } },
          },
          orderBy: { lineNumber: 'asc' },
        },
        goodsReceipts: {
          include: {
            receiver: { select: { fullName: true } },
            items: {
              include: {
                product: { select: { sku: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!po) throw new NotFoundError('Purchase order not found');

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
      supplierId: po.supplierId,
      supplier: po.supplier,
      warehouseId: po.warehouseId,
      warehouse: po.warehouse,
      status: po.status,
      orderDate: po.orderDate.toISOString(),
      expectedDate: po.expectedDate ? po.expectedDate.toISOString() : null,
      notes: po.notes,
      createdBy: po.createdBy,
      creator: po.creator,
      orderedBy: po.orderedBy,
      orderer: po.orderer,
      orderedAt: po.orderedAt ? po.orderedAt.toISOString() : null,
      cancelledBy: po.cancelledBy,
      canceller: po.canceller,
      cancelledAt: po.cancelledAt ? po.cancelledAt.toISOString() : null,
      cancelReason: po.cancelReason,
      version: po.version,
      totalCost: totalCost !== undefined ? totalCost.toFixed(2) : undefined,
      items: po.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        productSku: it.product.sku,
        productName: it.product.name,
        unit: it.product.unit,
        lineNumber: it.lineNumber,
        quantityOrdered: Number(it.quantityOrdered).toFixed(3),
        quantityReceived: Number(it.quantityReceived).toFixed(3),
        unitCost: canViewCost ? Number(it.unitCost).toFixed(4) : undefined,
        lineTotal: canViewCost
          ? (Number(it.quantityOrdered) * Number(it.unitCost)).toFixed(2)
          : undefined,
      })),
      receipts: po.goodsReceipts.map((gr) => ({
        id: gr.id,
        receiptNumber: gr.receiptNumber,
        receivedAt: gr.receivedAt.toISOString(),
        receiverName: gr.receiver.fullName,
        deliveryNoteRef: gr.deliveryNoteRef,
        notes: gr.notes,
        items: gr.items.map((gri) => ({
          id: gri.id,
          productId: gri.productId,
          productSku: gri.product.sku,
          productName: gri.product.name,
          quantityReceived: Number(gri.quantityReceived).toFixed(3),
          unitCost: canViewCost ? Number(gri.unitCost).toFixed(4) : undefined,
        })),
      })),
      createdAt: po.createdAt.toISOString(),
      updatedAt: po.updatedAt.toISOString(),
    };
  }

  public async createPurchaseOrder(
    input: {
      supplierId: string;
      warehouseId: string;
      orderDate?: string;
      expectedDate?: string | null;
      notes?: string | null;
      items: Array<{ productId: string; quantityOrdered: number; unitCost: number }>;
    },
    actorUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const supplier = await prisma.supplier.findUnique({ where: { id: input.supplierId } });
    if (!supplier) throw new NotFoundError('Supplier not found');
    if (supplier.status !== 'ACTIVE') {
      throw new ConflictError('Cannot create purchase orders for inactive suppliers');
    }

    const warehouse = await prisma.warehouse.findUnique({ where: { id: input.warehouseId } });
    if (!warehouse) throw new NotFoundError('Warehouse not found');

    const po = await prisma.$transaction(async (tx) => {
      const poNumber = await this.getNextDocumentNumber(tx, 'PURCHASE_ORDER', 'PO');

      const created = await tx.purchaseOrder.create({
        data: {
          poNumber,
          supplierId: input.supplierId,
          warehouseId: input.warehouseId,
          status: PurchaseOrderStatus.DRAFT,
          orderDate: input.orderDate ? new Date(input.orderDate) : new Date(),
          expectedDate: input.expectedDate ? new Date(input.expectedDate) : null,
          notes: input.notes?.trim() || null,
          createdBy: actorUserId,
          items: {
            create: input.items.map((item, index) => ({
              productId: item.productId,
              lineNumber: index + 1,
              quantityOrdered: item.quantityOrdered,
              quantityReceived: 0,
              unitCost: item.unitCost,
            })),
          },
        },
        include: { items: true },
      });

      return created;
    });

    await writeAuditLog({
      actorUserId,
      action: 'PO_CREATED',
      entityType: 'PURCHASE_ORDER',
      entityId: po.id,
      after: po,
      ip,
      userAgent,
      requestId,
    });

    return po;
  }

  public async updatePurchaseOrder(
    id: string,
    input: {
      supplierId?: string;
      warehouseId?: string;
      expectedDate?: string | null;
      notes?: string | null;
      items?: Array<{ productId: string; quantityOrdered: number; unitCost: number }>;
      version?: number;
    },
    actorUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const existing = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) throw new NotFoundError('Purchase order not found');

    if (existing.status !== PurchaseOrderStatus.DRAFT) {
      throw new ConflictError('Purchase orders can only be edited while in DRAFT status');
    }

    if (input.version !== undefined && input.version !== existing.version) {
      throw new ConflictError('Stale version. Please refresh and try again.', 'STALE_VERSION');
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (input.items && input.items.length > 0) {
        await tx.purchaseOrderItem.deleteMany({
          where: { purchaseOrderId: id },
        });

        for (let i = 0; i < input.items.length; i++) {
          const item = input.items[i];
          await tx.purchaseOrderItem.create({
            data: {
              purchaseOrderId: id,
              productId: item.productId,
              lineNumber: i + 1,
              quantityOrdered: item.quantityOrdered,
              quantityReceived: 0,
              unitCost: item.unitCost,
            },
          });
        }
      }

      return await tx.purchaseOrder.update({
        where: { id },
        data: {
          supplierId: input.supplierId,
          warehouseId: input.warehouseId,
          expectedDate: input.expectedDate !== undefined ? (input.expectedDate ? new Date(input.expectedDate) : null) : undefined,
          notes: input.notes !== undefined ? (input.notes ? input.notes.trim() : null) : undefined,
          version: { increment: 1 },
        },
        include: { items: true },
      });
    });

    await writeAuditLog({
      actorUserId,
      action: 'PO_UPDATED',
      entityType: 'PURCHASE_ORDER',
      entityId: id,
      before: existing,
      after: updated,
      ip,
      userAgent,
      requestId,
    });

    return updated;
  }

  public async submitPurchaseOrder(
    id: string,
    actorUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!po) throw new NotFoundError('Purchase order not found');

    if (po.status !== PurchaseOrderStatus.DRAFT) {
      throw new ConflictError(
        `Cannot submit purchase order: current status is ${po.status}. Must be in DRAFT status.`,
        'INVALID_STATE_TRANSITION'
      );
    }

    if (po.items.length === 0) {
      throw new ValidationError('Purchase order must have at least one line item to be submitted');
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: PurchaseOrderStatus.ORDERED,
        orderedBy: actorUserId,
        orderedAt: new Date(),
        version: { increment: 1 },
      },
    });

    await writeAuditLog({
      actorUserId,
      action: 'PO_SUBMITTED',
      entityType: 'PURCHASE_ORDER',
      entityId: id,
      ip,
      userAgent,
      requestId,
    });

    return updated;
  }

  public async cancelPurchaseOrder(
    id: string,
    reason: string,
    actorUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!po) throw new NotFoundError('Purchase order not found');

    const cancellableStatuses: PurchaseOrderStatus[] = [
      PurchaseOrderStatus.DRAFT,
      PurchaseOrderStatus.ORDERED,
      PurchaseOrderStatus.PARTIALLY_RECEIVED,
    ];

    if (!cancellableStatuses.includes(po.status)) {
      throw new ConflictError(
        `Cannot cancel purchase order in ${po.status} status.`,
        'INVALID_STATE_TRANSITION'
      );
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: PurchaseOrderStatus.CANCELLED,
        cancelledBy: actorUserId,
        cancelledAt: new Date(),
        cancelReason: reason.trim(),
        version: { increment: 1 },
      },
    });

    await writeAuditLog({
      actorUserId,
      action: 'PO_CANCELLED',
      entityType: 'PURCHASE_ORDER',
      entityId: id,
      after: { cancelReason: reason },
      ip,
      userAgent,
      requestId,
    });

    return updated;
  }

  public async receivePurchaseOrder(
    id: string,
    input: {
      warehouseId?: string;
      deliveryNoteRef?: string | null;
      notes?: string | null;
      lines: Array<{ purchaseOrderItemId: string; quantityReceived: number; unitCost?: number }>;
    },
    actorUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!po) throw new NotFoundError('Purchase order not found');

    if (
      po.status !== PurchaseOrderStatus.ORDERED &&
      po.status !== PurchaseOrderStatus.PARTIALLY_RECEIVED
    ) {
      throw new ConflictError(
        `Goods receiving is only permitted on ORDERED or PARTIALLY_RECEIVED purchase orders. Current status: ${po.status}`,
        'INVALID_STATE_TRANSITION'
      );
    }

    const destinationWarehouseId = input.warehouseId || po.warehouseId;

    // Check over-receipt tolerance setting
    const toleranceSetting = await prisma.appSetting.findUnique({
      where: { key: 'over_receipt_tolerance_percent' },
    });
    const tolerancePercent = toleranceSetting ? Number(toleranceSetting.value) : 0;

    return await prisma.$transaction(async (tx) => {
      const receiptNumber = await this.getNextDocumentNumber(tx, 'GOODS_RECEIPT', 'GRN');

      const receipt = await tx.goodsReceipt.create({
        data: {
          receiptNumber,
          purchaseOrderId: id,
          warehouseId: destinationWarehouseId,
          receivedBy: actorUserId,
          deliveryNoteRef: input.deliveryNoteRef?.trim() || null,
          notes: input.notes?.trim() || null,
        },
      });

      for (const line of input.lines) {
        const poItem = po.items.find((it) => it.id === line.purchaseOrderItemId);
        if (!poItem) {
          throw new NotFoundError(`PO line item ${line.purchaseOrderItemId} not found in this order`);
        }

        const currentReceived = Number(poItem.quantityReceived);
        const ordered = Number(poItem.quantityOrdered);
        const allowedMax = ordered * (1 + tolerancePercent / 100);

        if (currentReceived + line.quantityReceived > allowedMax) {
          throw new ValidationError(
            `Line for item ${poItem.productId} exceeds allowed over-receipt tolerance (${tolerancePercent}%). Ordered: ${ordered}, already received: ${currentReceived}, attempted receipt: ${line.quantityReceived}`
          );
        }

        // Apply stock movement using stockService
        const unitCost = line.unitCost !== undefined ? line.unitCost : Number(poItem.unitCost);

        const movementResult = await stockService.apply({
          productId: poItem.productId,
          warehouseId: destinationWarehouseId,
          movementType: MovementType.RECEIPT,
          quantityDelta: line.quantityReceived,
          unitCost,
          reasonCode: ReasonCode.PURCHASE_RECEIPT,
          reason: `Goods receipt ${receiptNumber} against ${po.poNumber}`,
          referenceType: ReferenceType.GOODS_RECEIPT,
          referenceId: receipt.id,
          performedBy: actorUserId,
          ip,
          userAgent,
          requestId,
        });

        // Create goods receipt item
        await tx.goodsReceiptItem.create({
          data: {
            goodsReceiptId: receipt.id,
            purchaseOrderItemId: poItem.id,
            productId: poItem.productId,
            quantityReceived: line.quantityReceived,
            unitCost,
            stockMovementId: movementResult.movement.id,
          },
        });

        // Update purchase order item quantityReceived
        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: {
            quantityReceived: { increment: line.quantityReceived },
          },
        });
      }

      // Check all line items to compute updated PO status
      const updatedPoItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: id },
      });

      const allReceivedFully = updatedPoItems.every(
        (it) => Number(it.quantityReceived) >= Number(it.quantityOrdered)
      );

      const anyReceived = updatedPoItems.some((it) => Number(it.quantityReceived) > 0);

      const newStatus = allReceivedFully
        ? PurchaseOrderStatus.RECEIVED
        : anyReceived
        ? PurchaseOrderStatus.PARTIALLY_RECEIVED
        : PurchaseOrderStatus.ORDERED;

      await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: newStatus,
          version: { increment: 1 },
        },
      });

      await writeAuditLog({
        actorUserId,
        action: 'GOODS_RECEIPT_CREATED',
        entityType: 'GOODS_RECEIPT',
        entityId: receipt.id,
        after: {
          receiptNumber,
          poNumber: po.poNumber,
          newStatus,
          linesCount: input.lines.length,
        },
        ip,
        userAgent,
        requestId,
        tx,
      });

      return {
        receiptNumber,
        receiptId: receipt.id,
        purchaseOrderStatus: newStatus,
      };
    });
  }
}

export const purchasingService = new PurchasingService();

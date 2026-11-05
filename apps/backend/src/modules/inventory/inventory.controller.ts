import { Request, Response, NextFunction } from 'express';
import { MovementType, ReasonCode, ReferenceType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { stockService } from './stockService.js';
import { sendSuccess, sendPaginated } from '../../http/response.js';
import { can } from '../../middleware/requirePermission.js';
import { ForbiddenError, NotFoundError } from '../../http/errors.js';

export class InventoryController {
  public async getBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 25;
      const skip = (page - 1) * pageSize;
      const productId = req.query.productId as string | undefined;
      const warehouseId = req.query.warehouseId as string | undefined;
      const categoryId = req.query.categoryId as string | undefined;
      const state = req.query.state as 'in' | 'low' | 'out' | undefined;
      const q = req.query.q as string | undefined;

      const where: any = {};
      if (productId) where.productId = productId;
      if (warehouseId) where.warehouseId = warehouseId;
      if (categoryId) {
        where.product = { categoryId };
      }
      if (q) {
        where.product = {
          ...where.product,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { sku: { contains: q.toUpperCase(), mode: 'insensitive' } },
          ],
        };
      }

      const [total, balances] = await Promise.all([
        prisma.inventoryBalance.count({ where }),
        prisma.inventoryBalance.findMany({
          where,
          skip,
          take: pageSize,
          include: {
            product: {
              include: { category: true },
            },
            warehouse: true,
          },
          orderBy: { updatedAt: 'desc' },
        }),
      ]);

      const formatted = balances.map((b) => ({
        productId: b.productId,
        productSku: b.product.sku,
        productName: b.product.name,
        categoryName: b.product.category.name,
        warehouseId: b.warehouseId,
        warehouseCode: b.warehouse.code,
        warehouseName: b.warehouse.name,
        quantityOnHand: Number(b.quantityOnHand).toFixed(3),
        reorderLevel: Number(b.product.reorderLevel).toFixed(3),
        unit: b.product.unit,
        updatedAt: b.updatedAt.toISOString(),
      }));

      let filtered = formatted;
      if (state) {
        if (state === 'out') {
          filtered = filtered.filter((b) => Number(b.quantityOnHand) <= 0);
        } else if (state === 'low') {
          filtered = filtered.filter(
            (b) => Number(b.quantityOnHand) > 0 && Number(b.quantityOnHand) <= Number(b.reorderLevel)
          );
        } else if (state === 'in') {
          filtered = filtered.filter((b) => Number(b.quantityOnHand) > Number(b.reorderLevel));
        }
      }

      sendPaginated(res, filtered, page, pageSize, total);
    } catch (err) {
      next(err);
    }
  }

  public async getMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 25;
      const skip = (page - 1) * pageSize;
      const productId = req.query.productId as string | undefined;
      const warehouseId = req.query.warehouseId as string | undefined;
      const userId = req.query.userId as string | undefined;
      const type = req.query.type as MovementType | undefined;
      const reasonCode = req.query.reasonCode as ReasonCode | undefined;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      const canViewCost = can(req, 'products:view_cost');

      const where: any = {};
      if (productId) where.productId = productId;
      if (warehouseId) where.warehouseId = warehouseId;
      if (userId) where.performedBy = userId;
      if (type) where.movementType = type;
      if (reasonCode) where.reasonCode = reasonCode;
      if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to) where.createdAt.lte = new Date(to);
      }

      const [total, movements] = await Promise.all([
        prisma.stockMovement.count({ where }),
        prisma.stockMovement.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { seq: 'desc' },
          include: {
            product: { select: { sku: true, name: true } },
            warehouse: { select: { code: true, name: true } },
            performer: { select: { fullName: true, email: true } },
          },
        }),
      ]);

      const formatted = movements.map((m) => ({
        id: m.id,
        seq: Number(m.seq),
        productId: m.productId,
        productSku: m.product.sku,
        productName: m.product.name,
        warehouseId: m.warehouseId,
        warehouseCode: m.warehouse.code,
        warehouseName: m.warehouse.name,
        movementType: m.movementType,
        quantityDelta: Number(m.quantityDelta).toFixed(3),
        quantityAfter: Number(m.quantityAfter).toFixed(3),
        unitCost: canViewCost && m.unitCost !== null ? Number(m.unitCost).toFixed(4) : undefined,
        reasonCode: m.reasonCode,
        reason: m.reason,
        referenceType: m.referenceType,
        referenceId: m.referenceId,
        transferGroupId: m.transferGroupId,
        reversesMovementId: m.reversesMovementId,
        performedBy: m.performedBy,
        performerName: m.performer.fullName,
        createdAt: m.createdAt.toISOString(),
      }));

      sendPaginated(res, formatted, page, pageSize, total);
    } catch (err) {
      next(err);
    }
  }

  public async getMovementById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const canViewCost = can(req, 'products:view_cost');
      const m = await prisma.stockMovement.findUnique({
        where: { id: req.params.id },
        include: {
          product: true,
          warehouse: true,
          performer: true,
          reverses: true,
          reversedBy: true,
        },
      });

      if (!m) throw new NotFoundError('Movement not found');

      sendSuccess(res, {
        id: m.id,
        seq: Number(m.seq),
        productId: m.productId,
        productSku: m.product.sku,
        productName: m.product.name,
        warehouseId: m.warehouseId,
        warehouseCode: m.warehouse.code,
        warehouseName: m.warehouse.name,
        movementType: m.movementType,
        quantityDelta: Number(m.quantityDelta).toFixed(3),
        quantityAfter: Number(m.quantityAfter).toFixed(3),
        unitCost: canViewCost && m.unitCost !== null ? Number(m.unitCost).toFixed(4) : undefined,
        reasonCode: m.reasonCode,
        reason: m.reason,
        referenceType: m.referenceType,
        referenceId: m.referenceId,
        transferGroupId: m.transferGroupId,
        reversesMovementId: m.reversesMovementId,
        performedBy: m.performedBy,
        performerName: m.performer.fullName,
        createdAt: m.createdAt.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  public async receiveStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const canViewCost = can(req, 'products:view_cost');
      const unitCost = canViewCost ? req.body.unitCost : undefined;
      const idempotencyKey = req.header('Idempotency-Key');

      const result = await stockService.apply({
        productId: req.body.productId,
        warehouseId: req.body.warehouseId,
        movementType: MovementType.RECEIPT,
        quantityDelta: Number(req.body.quantity),
        unitCost,
        reasonCode: req.body.reasonCode,
        reason: req.body.reason,
        referenceType: ReferenceType.MANUAL,
        idempotencyKey,
        performedBy: req.user!.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.requestId,
      });

      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  public async issueStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idempotencyKey = req.header('Idempotency-Key');

      const result = await stockService.apply({
        productId: req.body.productId,
        warehouseId: req.body.warehouseId,
        movementType: MovementType.ISSUE,
        quantityDelta: -Math.abs(Number(req.body.quantity)),
        reasonCode: req.body.reasonCode,
        reason: req.body.reason,
        referenceType: ReferenceType.MANUAL,
        idempotencyKey,
        performedBy: req.user!.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.requestId,
      });

      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  public async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId, warehouseId, newQuantity, delta, reason } = req.body;
      const idempotencyKey = req.header('Idempotency-Key');

      let computedDelta: number;

      if (delta !== undefined) {
        computedDelta = Number(delta);
      } else {
        const bal = await prisma.inventoryBalance.findUnique({
          where: { productId_warehouseId: { productId, warehouseId } },
        });
        const currentQty = Number(bal?.quantityOnHand || 0);
        computedDelta = Number(newQuantity) - currentQty;
      }

      if (computedDelta === 0) {
        sendSuccess(res, { message: 'Stock already at requested quantity. No adjustment needed.' });
        return;
      }

      const result = await stockService.apply({
        productId,
        warehouseId,
        movementType: MovementType.ADJUSTMENT,
        quantityDelta: computedDelta,
        reasonCode: ReasonCode.COUNT_CORRECTION,
        reason,
        referenceType: ReferenceType.MANUAL,
        idempotencyKey,
        performedBy: req.user!.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.requestId,
      });

      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  public async transferStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await stockService.transfer({
        productId: req.body.productId,
        fromWarehouseId: req.body.fromWarehouseId,
        toWarehouseId: req.body.toWarehouseId,
        quantity: Number(req.body.quantity),
        notes: req.body.notes,
        performedBy: req.user!.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.requestId,
      });

      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  public async reverseMovement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const movementId = req.params.id;
      const original = await prisma.stockMovement.findUnique({
        where: { id: movementId },
        include: { goodsReceiptItem: true },
      });

      if (!original) throw new NotFoundError('Movement not found');

      // Rule P-8: Reversing a receipt that belongs to a goods receipt also needs purchases:receive
      if (original.goodsReceiptItem && !can(req, 'purchases:receive')) {
        throw new ForbiddenError(
          'Reversing a receipt tied to a Purchase Order requires purchases:receive permission (P-8)'
        );
      }

      const result = await stockService.reverse({
        movementId,
        reason: req.body.reason,
        performedBy: req.user!.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.requestId,
      });

      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }
}

export const inventoryController = new InventoryController();

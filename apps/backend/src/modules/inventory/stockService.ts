import { Prisma, MovementType, ReasonCode, ReferenceType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { ConflictError, NotFoundError } from '../../http/errors.js';
import { writeAuditLog } from '../../lib/audit.js';

export interface ApplyStockMovementInput {
  productId: string;
  warehouseId: string;
  movementType: MovementType;
  quantityDelta: number; // positive for receipt/adjustment-up, negative for issue/adjustment-down
  unitCost?: number | null;
  reasonCode: ReasonCode;
  reason: string;
  referenceType?: ReferenceType;
  referenceId?: string | null;
  transferGroupId?: string | null;
  reversesMovementId?: string | null;
  idempotencyKey?: string | null;
  performedBy: string;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | number | null;
}

export interface StockMovementResult {
  movement: any;
  balanceAfter: number;
  newAverageCost?: number;
}

export class StockService {
  /**
   * Core atomic stock movement applier
   */
  public async apply(input: ApplyStockMovementInput): Promise<StockMovementResult> {
    const {
      productId,
      warehouseId,
      movementType,
      quantityDelta,
      unitCost,
      reasonCode,
      reason,
      referenceType = ReferenceType.MANUAL,
      referenceId,
      transferGroupId,
      reversesMovementId,
      idempotencyKey,
      performedBy,
      ip,
      userAgent,
      requestId,
    } = input;

    if (quantityDelta === 0) {
      throw new ConflictError('Quantity delta must not be zero');
    }

    // Check idempotency first if key provided
    if (idempotencyKey) {
      const existingMovement = await prisma.stockMovement.findFirst({
        where: {
          performedBy,
          idempotencyKey,
        },
      });

      if (existingMovement) {
        const balance = await prisma.inventoryBalance.findUnique({
          where: { productId_warehouseId: { productId, warehouseId } },
        });
        return {
          movement: existingMovement,
          balanceAfter: Number(balance?.quantityOnHand || 0),
        };
      }
    }

    return await prisma.$transaction(
      async (tx) => {
        // Step 1: Ensure product exists
        const product = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          throw new NotFoundError(`Product ${productId} not found`);
        }

        // Step 2: Ensure warehouse exists
        const warehouse = await tx.warehouse.findUnique({
          where: { id: warehouseId },
        });

        if (!warehouse) {
          throw new NotFoundError(`Warehouse ${warehouseId} not found`);
        }

        // Step 3: Ensure balance record exists (INSERT ... ON CONFLICT DO NOTHING)
        await tx.$executeRaw`
          INSERT INTO inventory_balances (product_id, warehouse_id, quantity_on_hand, updated_at)
          VALUES (${productId}, ${warehouseId}, 0, NOW())
          ON CONFLICT (product_id, warehouse_id) DO NOTHING;
        `;

        // Step 4: Lock balance row with SELECT FOR UPDATE
        const lockedRows: Array<{ quantity_on_hand: string }> = await tx.$queryRaw`
          SELECT quantity_on_hand FROM inventory_balances
          WHERE product_id = ${productId} AND warehouse_id = ${warehouseId}
          FOR UPDATE;
        `;

        const currentQty = lockedRows.length > 0 ? Number(lockedRows[0].quantity_on_hand) : 0;
        const quantityAfter = currentQty + quantityDelta;

        if (quantityAfter < 0) {
          throw new ConflictError(
            `Insufficient stock for product ${product.sku} at warehouse ${warehouse.code}. Current stock is ${currentQty}, attempted reduction is ${Math.abs(
              quantityDelta
            )}.`
          );
        }

        // Step 5: Update balance
        await tx.$executeRaw`
          UPDATE inventory_balances
          SET quantity_on_hand = ${quantityAfter}, updated_at = NOW()
          WHERE product_id = ${productId} AND warehouse_id = ${warehouseId};
        `;

        // Step 6: Calculate weighted average cost if this is a costed receipt
        let calculatedUnitCost = unitCost !== undefined && unitCost !== null ? unitCost : Number(product.averageCost);
        let updatedAverageCost = Number(product.averageCost);

        if (
          quantityDelta > 0 &&
          (movementType === MovementType.RECEIPT ||
            (movementType === MovementType.ADJUSTMENT && unitCost !== undefined && unitCost !== null))
        ) {
          // Total on hand across ALL warehouses before this receipt
          const totalBalances = await tx.inventoryBalance.aggregate({
            where: { productId },
            _sum: { quantityOnHand: true },
          });

          // Subtract this warehouse's newly updated quantity to get total before
          const totalOnHandBefore = Math.max(
            0,
            Number(totalBalances._sum.quantityOnHand || 0) - quantityDelta
          );

          if (totalOnHandBefore <= 0) {
            updatedAverageCost = calculatedUnitCost;
          } else {
            const totalValueBefore = totalOnHandBefore * Number(product.averageCost);
            const incomingValue = quantityDelta * calculatedUnitCost;
            updatedAverageCost = Number(
              ((totalValueBefore + incomingValue) / (totalOnHandBefore + quantityDelta)).toFixed(4)
            );
          }

          await tx.product.update({
            where: { id: productId },
            data: {
              averageCost: updatedAverageCost,
            },
          });
        }

        // Step 7: Insert stock movement
        const movement = await tx.stockMovement.create({
          data: {
            productId,
            warehouseId,
            movementType,
            quantityDelta,
            quantityAfter,
            unitCost: calculatedUnitCost,
            reasonCode,
            reason,
            referenceType,
            referenceId: referenceId || null,
            transferGroupId: transferGroupId || null,
            reversesMovementId: reversesMovementId || null,
            idempotencyKey: idempotencyKey || null,
            performedBy,
          },
        });

        // Step 8: Write Audit Log
        await writeAuditLog({
          actorUserId: performedBy,
          action: `STOCK_${movementType}`,
          entityType: 'STOCK_MOVEMENT',
          entityId: movement.id,
          before: { quantityOnHand: currentQty },
          after: {
            quantityOnHand: quantityAfter,
            delta: quantityDelta,
            movementId: movement.id,
            reasonCode,
            reason,
          },
          ip,
          userAgent,
          requestId,
          tx,
        });

        return {
          movement,
          balanceAfter: quantityAfter,
          newAverageCost: updatedAverageCost,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        timeout: 10000,
      }
    );
  }

  /**
   * Transfer stock between warehouses atomically with ordered row locking
   */
  public async transfer(params: {
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    notes?: string;
    performedBy: string;
    ip?: string | null;
    userAgent?: string | null;
    requestId?: string | number | null;
  }): Promise<{ transferGroupId: string }> {
    const {
      productId,
      fromWarehouseId,
      toWarehouseId,
      quantity,
      notes,
      performedBy,
      ip,
      userAgent,
      requestId,
    } = params;

    if (quantity <= 0) {
      throw new ConflictError('Transfer quantity must be greater than zero');
    }

    if (fromWarehouseId === toWarehouseId) {
      throw new ConflictError('Source and destination warehouses must be different');
    }

    const transferGroupId = `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Order warehouses by ID lexicographically to avoid deadlocks
    const [firstWhId, secondWhId] = [fromWarehouseId, toWarehouseId].sort();

    await prisma.$transaction(
      async (tx) => {
        // Ensure both balance rows exist
        await tx.$executeRaw`
          INSERT INTO inventory_balances (product_id, warehouse_id, quantity_on_hand, updated_at)
          VALUES (${productId}, ${firstWhId}, 0, NOW()), (${productId}, ${secondWhId}, 0, NOW())
          ON CONFLICT (product_id, warehouse_id) DO NOTHING;
        `;

        // Lock both balance rows in deterministic order
        await tx.$queryRaw`
          SELECT warehouse_id, quantity_on_hand FROM inventory_balances
          WHERE product_id = ${productId} AND (warehouse_id = ${firstWhId} OR warehouse_id = ${secondWhId})
          ORDER BY warehouse_id ASC
          FOR UPDATE;
        `;

        // Check source stock
        const sourceBal = await tx.inventoryBalance.findUnique({
          where: { productId_warehouseId: { productId, warehouseId: fromWarehouseId } },
        });

        const currentSourceQty = Number(sourceBal?.quantityOnHand || 0);
        if (currentSourceQty < quantity) {
          throw new ConflictError(
            `Insufficient stock at source warehouse. Available: ${currentSourceQty}, Requested: ${quantity}`
          );
        }

        const sourceAfter = currentSourceQty - quantity;
        const destBal = await tx.inventoryBalance.findUnique({
          where: { productId_warehouseId: { productId, warehouseId: toWarehouseId } },
        });
        const destAfter = Number(destBal?.quantityOnHand || 0) + quantity;

        // Update balances
        await tx.inventoryBalance.update({
          where: { productId_warehouseId: { productId, warehouseId: fromWarehouseId } },
          data: { quantityOnHand: sourceAfter },
        });

        await tx.inventoryBalance.update({
          where: { productId_warehouseId: { productId, warehouseId: toWarehouseId } },
          data: { quantityOnHand: destAfter },
        });

        const product = await tx.product.findUnique({ where: { id: productId } });
        const avgCost = Number(product?.averageCost || 0);

        // Insert TRANSFER_OUT
        await tx.stockMovement.create({
          data: {
            productId,
            warehouseId: fromWarehouseId,
            movementType: MovementType.TRANSFER_OUT,
            quantityDelta: -quantity,
            quantityAfter: sourceAfter,
            unitCost: avgCost,
            reasonCode: ReasonCode.TRANSFER,
            reason: notes || `Transfer out to warehouse ${toWarehouseId}`,
            referenceType: ReferenceType.TRANSFER,
            referenceId: transferGroupId,
            transferGroupId,
            performedBy,
          },
        });

        // Insert TRANSFER_IN
        await tx.stockMovement.create({
          data: {
            productId,
            warehouseId: toWarehouseId,
            movementType: MovementType.TRANSFER_IN,
            quantityDelta: quantity,
            quantityAfter: destAfter,
            unitCost: avgCost,
            reasonCode: ReasonCode.TRANSFER,
            reason: notes || `Transfer in from warehouse ${fromWarehouseId}`,
            referenceType: ReferenceType.TRANSFER,
            referenceId: transferGroupId,
            transferGroupId,
            performedBy,
          },
        });

        // Write Audit Log
        await writeAuditLog({
          actorUserId: performedBy,
          action: 'STOCK_TRANSFER',
          entityType: 'STOCK_TRANSFER',
          entityId: transferGroupId,
          after: {
            productId,
            fromWarehouseId,
            toWarehouseId,
            quantity,
            notes,
          },
          ip,
          userAgent,
          requestId,
          tx,
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        timeout: 10000,
      }
    );

    return { transferGroupId };
  }

  /**
   * Reverse an existing stock movement atomically
   */
  public async reverse(params: {
    movementId: string;
    reason: string;
    performedBy: string;
    ip?: string | null;
    userAgent?: string | null;
    requestId?: string | number | null;
  }): Promise<StockMovementResult> {
    const { movementId, reason, performedBy, ip, userAgent, requestId } = params;

    if (!reason || reason.trim().length < 3) {
      throw new ConflictError('Reversal requires a mandatory reason of at least 3 characters');
    }

    return await prisma.$transaction(async (tx) => {
      const original = await tx.stockMovement.findUnique({
        where: { id: movementId },
        include: { goodsReceiptItem: true },
      });

      if (!original) {
        throw new NotFoundError(`Movement ${movementId} not found`);
      }

      if (original.movementType === MovementType.REVERSAL) {
        throw new ConflictError('Cannot reverse a movement that is already a reversal');
      }

      // Check if already reversed
      const existingReversal = await tx.stockMovement.findUnique({
        where: { reversesMovementId: movementId },
      });

      if (existingReversal) {
        throw new ConflictError(`Movement ${movementId} has already been reversed`);
      }

      const reversalDelta = -Number(original.quantityDelta);

      // Check balance
      const balance = await tx.inventoryBalance.findUnique({
        where: {
          productId_warehouseId: {
            productId: original.productId,
            warehouseId: original.warehouseId,
          },
        },
      });

      const currentQty = Number(balance?.quantityOnHand || 0);
      const newQty = currentQty + reversalDelta;

      if (newQty < 0) {
        throw new ConflictError(
          `Cannot reverse movement: resulting balance (${newQty}) would be negative`
        );
      }

      await tx.inventoryBalance.update({
        where: {
          productId_warehouseId: {
            productId: original.productId,
            warehouseId: original.warehouseId,
          },
        },
        data: { quantityOnHand: newQty },
      });

      const reversalMovement = await tx.stockMovement.create({
        data: {
          productId: original.productId,
          warehouseId: original.warehouseId,
          movementType: MovementType.REVERSAL,
          quantityDelta: reversalDelta,
          quantityAfter: newQty,
          unitCost: original.unitCost,
          reasonCode: ReasonCode.REVERSAL,
          reason,
          referenceType: ReferenceType.MOVEMENT,
          referenceId: original.id,
          reversesMovementId: original.id,
          performedBy,
        },
      });

      // If tied to goods receipt item, update purchase order item received quantity
      if (original.goodsReceiptItem) {
        const poItem = await tx.purchaseOrderItem.findUnique({
          where: { id: original.goodsReceiptItem.purchaseOrderItemId },
          include: { purchaseOrder: true },
        });

        if (poItem) {
          const updatedReceived = Math.max(
            0,
            Number(poItem.quantityReceived) - Number(original.goodsReceiptItem.quantityReceived)
          );
          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: { quantityReceived: updatedReceived },
          });

          // Recalculate PO status
          const allPoItems = await tx.purchaseOrderItem.findMany({
            where: { purchaseOrderId: poItem.purchaseOrderId },
          });

          const totalOrdered = allPoItems.reduce((acc, it) => acc + Number(it.quantityOrdered), 0);
          const totalReceived = allPoItems.reduce((acc, it) => {
            return acc + (it.id === poItem.id ? updatedReceived : Number(it.quantityReceived));
          }, 0);

          let newStatus = poItem.purchaseOrder.status;
          if (totalReceived === 0) {
            newStatus = 'ORDERED';
          } else if (totalReceived < totalOrdered) {
            newStatus = 'PARTIALLY_RECEIVED';
          }

          if (newStatus !== poItem.purchaseOrder.status) {
            await tx.purchaseOrder.update({
              where: { id: poItem.purchaseOrderId },
              data: { status: newStatus },
            });
          }
        }
      }

      await writeAuditLog({
        actorUserId: performedBy,
        action: 'STOCK_REVERSAL',
        entityType: 'STOCK_MOVEMENT',
        entityId: reversalMovement.id,
        before: { reversedMovementId: original.id, originalDelta: original.quantityDelta },
        after: {
          reversalMovementId: reversalMovement.id,
          reversalDelta,
          quantityOnHand: newQty,
          reason,
        },
        ip,
        userAgent,
        requestId,
        tx,
      });

      return {
        movement: reversalMovement,
        balanceAfter: newQty,
      };
    });
  }
}

export const stockService = new StockService();

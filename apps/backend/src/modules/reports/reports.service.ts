import { RecordStatus, MovementType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export class ReportsService {
  public async getDashboardSummary(canViewValuation: boolean, canViewCost: boolean) {
    // 1. Metrics
    const [activeProductsCount, lowStockProducts, outOfStockProducts, balances] =
      await Promise.all([
        prisma.product.count({ where: { status: RecordStatus.ACTIVE } }),
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(DISTINCT p.id) as count
          FROM products p
          LEFT JOIN inventory_balances ib ON p.id = ib.product_id
          WHERE p.status = 'ACTIVE'
          GROUP BY p.id, p.reorder_level
          HAVING COALESCE(SUM(ib.quantity_on_hand), 0) > 0
             AND COALESCE(SUM(ib.quantity_on_hand), 0) <= p.reorder_level;
        `,
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(DISTINCT p.id) as count
          FROM products p
          LEFT JOIN inventory_balances ib ON p.id = ib.product_id
          WHERE p.status = 'ACTIVE'
          GROUP BY p.id
          HAVING COALESCE(SUM(ib.quantity_on_hand), 0) <= 0;
        `,
        prisma.inventoryBalance.findMany({
          include: {
            product: {
              select: {
                averageCost: true,
                categoryId: true,
                category: { select: { id: true, name: true } },
              },
            },
          },
        }),
      ]);

    const totalStockQty = balances.reduce(
      (sum, b) => sum + Number(b.quantityOnHand),
      0
    );

    let valuation: number | null = null;
    if (canViewValuation) {
      valuation = balances.reduce(
        (sum, b) => sum + Number(b.quantityOnHand) * Number(b.product.averageCost),
        0
      );
    }

    // 2. Recent Movements (last 10)
    const recentMovementsRaw = await prisma.stockMovement.findMany({
      take: 10,
      orderBy: { seq: 'desc' },
      include: {
        product: { select: { sku: true, name: true } },
        warehouse: { select: { code: true, name: true } },
        performer: { select: { fullName: true } },
      },
    });

    const recentMovements = recentMovementsRaw.map((m) => ({
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
      performedByName: m.performer.fullName,
      createdAt: m.createdAt.toISOString(),
    }));

    // 3. Recent Purchases (last 10)
    const recentPurchasesRaw = await prisma.purchaseOrder.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: { select: { name: true } },
        warehouse: { select: { code: true, name: true } },
        items: true,
      },
    });

    const recentPurchases = recentPurchasesRaw.map((po) => {
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
        supplierName: po.supplier.name,
        warehouseCode: po.warehouse.code,
        warehouseName: po.warehouse.name,
        status: po.status,
        orderDate: po.orderDate.toISOString(),
        totalCost: totalCost !== undefined ? totalCost.toFixed(2) : undefined,
        itemCount: po.items.length,
      };
    });

    // 4. Low Stock List
    const lowStockListRaw = await prisma.$queryRaw<
      Array<{
        id: string;
        sku: string;
        name: string;
        unit: string;
        reorder_level: string;
        quantity_on_hand: string;
      }>
    >`
      SELECT p.id, p.sku, p.name, p.unit, p.reorder_level, COALESCE(SUM(ib.quantity_on_hand), 0) as quantity_on_hand
      FROM products p
      LEFT JOIN inventory_balances ib ON p.id = ib.product_id
      WHERE p.status = 'ACTIVE'
      GROUP BY p.id, p.sku, p.name, p.unit, p.reorder_level
      HAVING COALESCE(SUM(ib.quantity_on_hand), 0) <= p.reorder_level
      ORDER BY quantity_on_hand ASC
      LIMIT 10;
    `;

    const lowStockItems = lowStockListRaw.map((p) => ({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      unit: p.unit,
      reorderLevel: Number(p.reorder_level).toFixed(3),
      quantityOnHand: Number(p.quantity_on_hand).toFixed(3),
    }));

    // 5. Stock By Category
    const categoryTotalsMap = new Map<string, { categoryName: string; count: number; totalQty: number }>();
    for (const b of balances) {
      const catId = b.product.categoryId;
      const catName = b.product.category.name;
      const current = categoryTotalsMap.get(catId) || { categoryName: catName, count: 0, totalQty: 0 };
      current.count += 1;
      current.totalQty += Number(b.quantityOnHand);
      categoryTotalsMap.set(catId, current);
    }

    const stockByCategory = Array.from(categoryTotalsMap.entries()).map(([catId, val]) => ({
      categoryId: catId,
      categoryName: val.categoryName,
      itemCount: val.count,
      totalQuantity: val.totalQty.toFixed(3),
    }));

    // 6. Movements Per Day (last 14 days)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const recentDaysMovements = await prisma.stockMovement.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true, movementType: true },
    });

    const daysMap = new Map<string, { receipts: number; issues: number; adjustments: number }>();
    for (const mov of recentDaysMovements) {
      const day = mov.createdAt.toISOString().slice(0, 10);
      const stats = daysMap.get(day) || { receipts: 0, issues: 0, adjustments: 0 };
      if (mov.movementType === MovementType.RECEIPT) stats.receipts++;
      else if (mov.movementType === MovementType.ISSUE) stats.issues++;
      else stats.adjustments++;
      daysMap.set(day, stats);
    }

    const movementsPerDay = Array.from(daysMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      metrics: {
        activeProductsCount,
        totalStockQuantity: totalStockQty.toFixed(3),
        inventoryValuation: valuation !== null ? valuation.toFixed(2) : null,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
      },
      recentMovements,
      recentPurchases,
      lowStockItems,
      stockByCategory,
      movementsPerDay,
    };
  }

  public async getValuationReport(groupBy: 'category' | 'warehouse' = 'category') {
    const balances = await prisma.inventoryBalance.findMany({
      include: {
        product: {
          include: { category: true },
        },
        warehouse: true,
      },
    });

    if (groupBy === 'warehouse') {
      const whMap = new Map<string, { code: string; name: string; itemCount: number; totalQty: number; totalValue: number }>();

      for (const b of balances) {
        const whId = b.warehouseId;
        const entry = whMap.get(whId) || {
          code: b.warehouse.code,
          name: b.warehouse.name,
          itemCount: 0,
          totalQty: 0,
          totalValue: 0,
        };
        const qty = Number(b.quantityOnHand);
        const val = qty * Number(b.product.averageCost);
        entry.itemCount += 1;
        entry.totalQty += qty;
        entry.totalValue += val;
        whMap.set(whId, entry);
      }

      return Array.from(whMap.entries()).map(([warehouseId, data]) => ({
        warehouseId,
        warehouseCode: data.code,
        warehouseName: data.name,
        itemCount: data.itemCount,
        totalQuantity: data.totalQty.toFixed(3),
        totalValuation: data.totalValue.toFixed(2),
      }));
    }

    // Default: group by category
    const catMap = new Map<string, { name: string; slug: string; itemCount: number; totalQty: number; totalValue: number }>();

    for (const b of balances) {
      const catId = b.product.categoryId;
      const entry = catMap.get(catId) || {
        name: b.product.category.name,
        slug: b.product.category.slug,
        itemCount: 0,
        totalQty: 0,
        totalValue: 0,
      };
      const qty = Number(b.quantityOnHand);
      const val = qty * Number(b.product.averageCost);
      entry.itemCount += 1;
      entry.totalQty += qty;
      entry.totalValue += val;
      catMap.set(catId, entry);
    }

    return Array.from(catMap.entries()).map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      categorySlug: data.slug,
      itemCount: data.itemCount,
      totalQuantity: data.totalQty.toFixed(3),
      totalValuation: data.totalValue.toFixed(2),
    }));
  }

  public async getLowStockReport() {
    return await prisma.$queryRaw<
      Array<{
        id: string;
        sku: string;
        name: string;
        category_name: string;
        unit: string;
        reorder_level: string;
        quantity_on_hand: string;
      }>
    >`
      SELECT p.id, p.sku, p.name, c.name as category_name, p.unit, p.reorder_level, COALESCE(SUM(ib.quantity_on_hand), 0) as quantity_on_hand
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory_balances ib ON p.id = ib.product_id
      WHERE p.status = 'ACTIVE'
      GROUP BY p.id, p.sku, p.name, c.name, p.unit, p.reorder_level
      HAVING COALESCE(SUM(ib.quantity_on_hand), 0) <= p.reorder_level
         AND COALESCE(SUM(ib.quantity_on_hand), 0) > 0
      ORDER BY quantity_on_hand ASC;
    `;
  }

  public async getOutOfStockReport() {
    return await prisma.$queryRaw<
      Array<{
        id: string;
        sku: string;
        name: string;
        category_name: string;
        unit: string;
        reorder_level: string;
        quantity_on_hand: string;
      }>
    >`
      SELECT p.id, p.sku, p.name, c.name as category_name, p.unit, p.reorder_level, COALESCE(SUM(ib.quantity_on_hand), 0) as quantity_on_hand
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory_balances ib ON p.id = ib.product_id
      WHERE p.status = 'ACTIVE'
      GROUP BY p.id, p.sku, p.name, c.name, p.unit, p.reorder_level
      HAVING COALESCE(SUM(ib.quantity_on_hand), 0) <= 0
      ORDER BY p.name ASC;
    `;
  }
}

export const reportsService = new ReportsService();


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function reconcileBalances(): Promise<{ success: boolean; mismatches: string[] }> {
  console.log('🔍 Running StockWise inventory ledger reconciliation...');
  const balances = await prisma.inventoryBalance.findMany({
    include: {
      product: { select: { sku: true, name: true } },
      warehouse: { select: { code: true, name: true } },
    },
  });

  const mismatches: string[] = [];

  for (const bal of balances) {
    const movements = await prisma.stockMovement.findMany({
      where: {
        productId: bal.productId,
        warehouseId: bal.warehouseId,
      },
      orderBy: { seq: 'asc' },
    });

    let calculatedSum = 0;
    for (const mov of movements) {
      calculatedSum += Number(mov.quantityDelta);
    }

    const currentBalance = Number(bal.quantityOnHand);

    if (Math.abs(calculatedSum - currentBalance) > 0.0001) {
      mismatches.push(
        `Balance mismatch for SKU ${bal.product.sku} at ${bal.warehouse.code}: stored balance is ${currentBalance}, but SUM(quantityDelta) is ${calculatedSum}`
      );
    }

    if (movements.length > 0) {
      const latestMovement = movements[movements.length - 1];
      const latestAfter = Number(latestMovement.quantityAfter);
      if (Math.abs(latestAfter - currentBalance) > 0.0001) {
        mismatches.push(
          `Sequence mismatch for SKU ${bal.product.sku} at ${bal.warehouse.code}: stored balance is ${currentBalance}, but latest movement quantityAfter is ${latestAfter}`
        );
      }
    }
  }

  if (mismatches.length > 0) {
    console.error('❌ Reconciliation failed with mismatches:');
    for (const m of mismatches) {
      console.error('  - ' + m);
    }
    return { success: false, mismatches };
  }

  console.log(`✅ All ${balances.length} inventory balances reconciled perfectly with immutable stock movements.`);
  return { success: true, mismatches: [] };
}

if (process.argv[1]?.endsWith('reconcile.ts') || process.argv[1]?.endsWith('reconcile.js')) {
  reconcileBalances()
    .then((result) => {
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Reconciliation error:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}


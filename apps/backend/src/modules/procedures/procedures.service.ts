import { prisma } from '../../lib/prisma.js';
import { MovementType, ReasonCode, ReferenceType, RecordStatus } from '@prisma/client';
import { stockService } from '../inventory/stockService.js';
import { NotFoundError, ValidationError } from '../../http/errors.js';
import { writeAuditLog } from '../../lib/audit.js';

export interface DeductProcedureInput {
  operatoryCode?: string;
  operatoryId?: string;
  notes?: string;
  warehouseId?: string;
}

export class ProceduresService {
  public async listProcedures() {
    const list = await prisma.clinicalProcedure.findMany({
      where: { status: RecordStatus.ACTIVE },
      include: {
        materials: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                unit: true,
                costPrice: true,
                sellingPrice: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return list.map((p) => {
      let estimatedCost = 0;
      for (const m of p.materials) {
        const cost = Number(m.product.costPrice || 0);
        const qty = Number(m.defaultQuantity);
        estimatedCost += cost * qty;
      }
      return {
        ...p,
        materialsCount: p.materials.length,
        estimatedCost: Number(estimatedCost.toFixed(2)),
      };
    });
  }

  public async getProcedure(id: string) {
    const proc = await prisma.clinicalProcedure.findUnique({
      where: { id },
      include: {
        materials: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                unit: true,
                costPrice: true,
                sellingPrice: true,
                reorderLevel: true,
                inventoryBalances: true,
              },
            },
          },
        },
      },
    });

    if (!proc) {
      throw new NotFoundError('Clinical procedure not found');
    }

    let estimatedCost = 0;
    for (const m of proc.materials) {
      const cost = Number(m.product.costPrice || 0);
      const qty = Number(m.defaultQuantity);
      estimatedCost += cost * qty;
    }

    return {
      ...proc,
      estimatedCost: Number(estimatedCost.toFixed(2)),
    };
  }

  public async deductProcedureMaterials(
    procedureId: string,
    input: DeductProcedureInput,
    userId: string,
    ip?: string,
    userAgent?: string
  ) {
    const proc = await this.getProcedure(procedureId);

    if (proc.materials.length === 0) {
      throw new ValidationError('Procedure has no configured bill of materials.');
    }

    // Determine target warehouse
    let targetWhId = input.warehouseId;
    if (!targetWhId) {
      const defaultWh = await prisma.warehouse.findFirst({
        where: { isDefault: true, status: RecordStatus.ACTIVE },
      }) || await prisma.warehouse.findFirst({
        where: { status: RecordStatus.ACTIVE },
      });
      if (!defaultWh) {
        throw new ValidationError('No active warehouse available for stock deduction.');
      }
      targetWhId = defaultWh.id;
    }

    const deductedList: Array<{ sku: string; name: string; quantity: number; unit: string }> = [];

    // Atomically record stock movements for each material
    for (const mat of proc.materials) {
      const qtyToDeduct = Number(mat.defaultQuantity);
      if (qtyToDeduct <= 0) continue;

      await stockService.apply({
        productId: mat.productId,
        warehouseId: targetWhId!,
        movementType: MovementType.ISSUE,
        quantityDelta: -qtyToDeduct,
        reasonCode: ReasonCode.USAGE,
        reason: `Chair-side deduction for ${proc.name} [Room: ${input.operatoryCode || 'General'}]`,
        referenceType: ReferenceType.MANUAL,
        referenceId: proc.id,
        performedBy: userId,
        ip,
        userAgent,
      });

      deductedList.push({
        sku: mat.product.sku,
        name: mat.product.name,
        quantity: qtyToDeduct,
        unit: mat.product.unit,
      });
    }

    // Write audit log
    await writeAuditLog({
      actorUserId: userId,
      action: 'procedure:deduct_materials',
      entityType: 'clinical_procedure',
      entityId: proc.id,
      after: {
        procedureCode: proc.code,
        operatory: input.operatoryCode,
        materialsDeducted: deductedList,
      },
      ip,
      userAgent,
    });

    return {
      procedure: proc.name,
      operatory: input.operatoryCode || 'General Operatory',
      deductedMaterials: deductedList,
      timestamp: new Date().toISOString(),
    };
  }
}

export const proceduresService = new ProceduresService();

import { PrismaClient, RecordStatus, UnitOfMeasure } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding clinical operatories and procedures...');

  // 1. Operatory Rooms
  const rooms = [
    { code: 'OP-101', name: 'Operatory 101 — Restorative & Aesthetic', floorOrWing: 'Level 1 — West Wing' },
    { code: 'OP-102', name: 'Operatory 102 — Endodontics & Microsurgery', floorOrWing: 'Level 1 — West Wing' },
    { code: 'OP-103', name: 'Operatory 103 — Pediatric & Preventive', floorOrWing: 'Level 2 — East Wing' },
    { code: 'SURG-A', name: 'Surgical Suite A — Implantology & Maxillofacial', floorOrWing: 'Level 2 — Surgical Wing' },
  ];

  for (const r of rooms) {
    await prisma.operatoryRoom.upsert({
      where: { code: r.code },
      update: { name: r.name, floorOrWing: r.floorOrWing },
      create: {
        code: r.code,
        name: r.name,
        floorOrWing: r.floorOrWing,
        status: RecordStatus.ACTIVE,
      },
    });
  }

  // 2. Find or create essential clinical consumables
  const defaultCategory = await prisma.category.findFirst({ where: { status: RecordStatus.ACTIVE } });
  const categoryId = defaultCategory?.id || (await prisma.category.create({
    data: { name: 'Clinical Consumables', slug: 'clinical-consumables' },
  })).id;

  const defaultWarehouse = await prisma.warehouse.findFirst({ where: { isDefault: true } }) ||
    await prisma.warehouse.findFirst();

  const clinicalItems = [
    { sku: 'CLIN-COMP-A2', name: 'Filtek Supreme Ultra Composite Capsule A2 (0.2g)', unit: UnitOfMeasure.EACH, cost: 4.50, price: 12.00 },
    { sku: 'CLIN-BOND-UNI', name: 'Single Bond Universal Adhesive 5ml', unit: UnitOfMeasure.ML, cost: 18.00, price: 45.00 },
    { sku: 'CLIN-ETCH-37', name: 'Scotchbond Universal Etchant 37% 3ml', unit: UnitOfMeasure.ML, cost: 2.50, price: 8.00 },
    { sku: 'CLIN-MICROBRUSH', name: 'Dental Microbrush Applicators Regular (100/Tube)', unit: UnitOfMeasure.EACH, cost: 0.08, price: 0.25 },
    { sku: 'CLIN-ENDO-FILES', name: 'WaveOne Gold Rotary Endodontic Files (Pack of 3)', unit: UnitOfMeasure.PACK, cost: 32.00, price: 75.00 },
    { sku: 'CLIN-SUTURES-40', name: 'Ethicon Vicryl Sutures 4-0 FS-2 (Dozen)', unit: UnitOfMeasure.EACH, cost: 3.50, price: 9.00 },
  ];

  const productMap: Record<string, string> = {};

  for (const item of clinicalItems) {
    const prod = await prisma.product.upsert({
      where: { sku: item.sku },
      update: { name: item.name, costPrice: item.cost, sellingPrice: item.price },
      create: {
        sku: item.sku,
        name: item.name,
        slug: item.sku.toLowerCase(),
        unit: item.unit,
        costPrice: item.cost,
        sellingPrice: item.price,
        categoryId,
        reorderLevel: 20,
        isPublished: true,
      },
    });
    productMap[item.sku] = prod.id;

    // Ensure initial balance in default warehouse
    if (defaultWarehouse) {
      await prisma.inventoryBalance.upsert({
        where: {
          productId_warehouseId: {
            productId: prod.id,
            warehouseId: defaultWarehouse.id,
          },
        },
        update: {},
        create: {
          productId: prod.id,
          warehouseId: defaultWarehouse.id,
          quantityOnHand: 150,
        },
      });
    }
  }

  // 3. Clinical Procedures with BOM
  const procedures = [
    {
      code: 'PROC-COMP-A2',
      name: 'Class II Composite Restoration (Universal A2)',
      category: 'RESTORATIVE' as const,
      defaultDurationMin: 45,
      description: 'Anterior/Posterior resin restoration with total-etch adhesive protocol.',
      materials: [
        { sku: 'CLIN-COMP-A2', qty: 1 },
        { sku: 'CLIN-BOND-UNI', qty: 0.1 },
        { sku: 'CLIN-ETCH-37', qty: 0.05 },
        { sku: 'CLIN-MICROBRUSH', qty: 2 },
      ],
    },
    {
      code: 'PROC-ENDO-MOLAR',
      name: 'Molar Endodontic Therapy (Single-Visit)',
      category: 'ENDODONTICS' as const,
      defaultDurationMin: 90,
      description: 'Instrumentation, rotary glide path, and thermoplastic obturation.',
      materials: [
        { sku: 'CLIN-ENDO-FILES', qty: 1 },
        { sku: 'CLIN-MICROBRUSH', qty: 4 },
      ],
    },
    {
      code: 'PROC-SURG-EXTR',
      name: 'Surgical Extraction & Socket Preservation',
      category: 'ORAL_SURGERY' as const,
      defaultDurationMin: 60,
      description: 'Surgical tooth elevation, debridement, and primary closure.',
      materials: [
        { sku: 'CLIN-SUTURES-40', qty: 1 },
        { sku: 'CLIN-MICROBRUSH', qty: 2 },
      ],
    },
  ];

  for (const p of procedures) {
    const proc = await prisma.clinicalProcedure.upsert({
      where: { code: p.code },
      update: { name: p.name, category: p.category, defaultDurationMin: p.defaultDurationMin, description: p.description },
      create: {
        code: p.code,
        name: p.name,
        category: p.category,
        defaultDurationMin: p.defaultDurationMin,
        description: p.description,
      },
    });

    for (const m of p.materials) {
      const prodId = productMap[m.sku];
      if (prodId) {
        await prisma.procedureMaterial.upsert({
          where: {
            procedureId_productId: {
              procedureId: proc.id,
              productId: prodId,
            },
          },
          update: { defaultQuantity: m.qty },
          create: {
            procedureId: proc.id,
            productId: prodId,
            defaultQuantity: m.qty,
          },
        });
      }
    }
  }

  console.log('Clinical seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

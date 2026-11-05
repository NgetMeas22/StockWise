import { PrismaClient, RecordStatus, SupplierStatus, UnitOfMeasure, MovementType, ReasonCode, ReferenceType } from '@prisma/client';
import argon2 from 'argon2';
import {
  PERMISSION_REGISTRY,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_KEYS,
  PermissionKey,
  RoleKey,
} from '../../packages/shared/dist/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting StockWise database seeding...');

  // 1. Seed Permissions
  console.log('Inserting permissions...');
  for (const perm of Object.values(PERMISSION_REGISTRY)) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        groupName: perm.group,
        description: perm.description,
      },
      create: {
        key: perm.key,
        groupName: perm.group,
        description: perm.description,
      },
    });
  }

  // 2. Seed Roles
  console.log('Inserting roles...');
  const roleDescriptions: Record<RoleKey, string> = {
    ADMIN: 'Full system administrator with unrestricted access',
    MANAGER: 'Operations manager with inventory, purchasing, catalog, and reporting access',
    INVENTORY_STAFF: 'Warehouse staff managing inventory receipts, issues, and counts',
    VIEWER: 'Read-only access to products, categories, stock levels, and basic reports',
  };

  const roleRecords: Record<string, any> = {};

  for (const roleKey of ROLE_KEYS) {
    const role = await prisma.role.upsert({
      where: { key: roleKey },
      update: {
        name: roleKey.replace('_', ' '),
        description: roleDescriptions[roleKey],
        isSystem: true,
      },
      create: {
        key: roleKey,
        name: roleKey.replace('_', ' '),
        description: roleDescriptions[roleKey],
        isSystem: true,
      },
    });
    roleRecords[roleKey] = role;
  }

  // 3. Seed Role Permissions
  console.log('Linking role permissions...');
  for (const roleKey of ROLE_KEYS) {
    const role = roleRecords[roleKey];
    const allowedPermKeys = DEFAULT_ROLE_PERMISSIONS[roleKey];

    for (const permKey of allowedPermKeys) {
      const perm = await prisma.permission.findUnique({ where: { key: permKey } });
      if (perm) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: perm.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: perm.id,
          },
        });
      }
    }
  }

  // 4. Seed App Settings
  console.log('Inserting default settings...');
  const defaultSettings = [
    { key: 'currency_code', value: 'USD' },
    { key: 'public_show_prices', value: true },
    { key: 'public_show_availability', value: true },
    { key: 'over_receipt_tolerance_percent', value: 0 },
    { key: 'default_low_stock_threshold', value: 10 },
  ];

  for (const setting of defaultSettings) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value },
    });
  }

  // 5. Seed Warehouses
  console.log('Inserting warehouses...');
  const mainWarehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-MAIN' },
    update: {
      name: 'Main Distribution Center',
      address: '100 Logistics Blvd, Suite 400',
      isDefault: true,
      status: RecordStatus.ACTIVE,
    },
    create: {
      code: 'WH-MAIN',
      name: 'Main Distribution Center',
      address: '100 Logistics Blvd, Suite 400',
      isDefault: true,
      status: RecordStatus.ACTIVE,
    },
  });

  const secondaryWarehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-EAST' },
    update: {
      name: 'East Coast Warehouse',
      address: '450 Harbor Way, Dock 3',
      isDefault: false,
      status: RecordStatus.ACTIVE,
    },
    create: {
      code: 'WH-EAST',
      name: 'East Coast Warehouse',
      address: '450 Harbor Way, Dock 3',
      isDefault: false,
      status: RecordStatus.ACTIVE,
    },
  });

  // 6. Seed Users
  console.log('Inserting demo users...');
  const adminPasswordHash = await argon2.hash('AdminPassword123!');
  const managerPasswordHash = await argon2.hash('ManagerPassword123!');
  const staffPasswordHash = await argon2.hash('StaffPassword123!');
  const viewerPasswordHash = await argon2.hash('ViewerPassword123!');

  const usersToSeed = [
    {
      email: 'admin@stockwise.local',
      fullName: 'System Administrator',
      passwordHash: adminPasswordHash,
      roleKey: 'ADMIN' as RoleKey,
      mustChangePassword: false,
    },
    {
      email: 'manager@stockwise.local',
      fullName: 'Sarah Operations Manager',
      passwordHash: managerPasswordHash,
      roleKey: 'MANAGER' as RoleKey,
      mustChangePassword: false,
    },
    {
      email: 'staff@stockwise.local',
      fullName: 'David Warehouse Staff',
      passwordHash: staffPasswordHash,
      roleKey: 'INVENTORY_STAFF' as RoleKey,
      mustChangePassword: false,
    },
    {
      email: 'viewer@stockwise.local',
      fullName: 'Emily Auditor & Viewer',
      passwordHash: viewerPasswordHash,
      roleKey: 'VIEWER' as RoleKey,
      mustChangePassword: false,
    },
  ];

  const userRecords: Record<string, any> = {};

  for (const u of usersToSeed) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        fullName: u.fullName,
        passwordHash: u.passwordHash,
        isActive: true,
        mustChangePassword: u.mustChangePassword,
      },
      create: {
        email: u.email,
        fullName: u.fullName,
        passwordHash: u.passwordHash,
        isActive: true,
        mustChangePassword: u.mustChangePassword,
      },
    });

    userRecords[u.roleKey] = user;

    // Assign Role
    const role = roleRecords[u.roleKey];
    await prisma.userRole.upsert({
      where: { userId: user.id },
      update: { roleId: role.id },
      create: {
        userId: user.id,
        roleId: role.id,
      },
    });
  }

  // 7. Seed Categories
  console.log('Inserting categories...');
  const catInstruments = await prisma.category.upsert({
    where: { slug: 'surgical-instruments' },
    update: { name: 'Surgical Instruments', sortOrder: 1 },
    create: {
      name: 'Surgical Instruments',
      slug: 'surgical-instruments',
      description: 'Precision diagnostic and surgical instruments',
      sortOrder: 1,
    },
  });

  const catPPE = await prisma.category.upsert({
    where: { slug: 'infection-control-ppe' },
    update: { name: 'Infection Control & PPE', sortOrder: 2 },
    create: {
      name: 'Infection Control & PPE',
      slug: 'infection-control-ppe',
      description: 'Protective apparel, masks, gloves, and sanitizers',
      sortOrder: 2,
    },
  });

  const catDiagnostics = await prisma.category.upsert({
    where: { slug: 'diagnostic-equipment' },
    update: { name: 'Diagnostic Equipment', sortOrder: 3 },
    create: {
      name: 'Diagnostic Equipment',
      slug: 'diagnostic-equipment',
      description: 'Digital diagnostic sensors, meters, and scopes',
      sortOrder: 3,
    },
  });

  const catConsumables = await prisma.category.upsert({
    where: { slug: 'disposables-consumables' },
    update: { name: 'Disposables & Consumables', sortOrder: 4 },
    create: {
      name: 'Disposables & Consumables',
      slug: 'disposables-consumables',
      description: 'Single-use sterile consumable items',
      sortOrder: 4,
    },
  });

  // 8. Seed Suppliers
  console.log('Inserting suppliers...');
  const supplierApex = await prisma.supplier.upsert({
    where: { name: 'Apex Medical Supplies Ltd' },
    update: {
      contactPerson: 'Marcus Vance',
      email: 'orders@apexmed.com',
      phone: '+1-555-019-2831',
      address: '220 Innovation Parkway, Suite 10, Boston, MA',
      notes: 'Primary supplier for surgical steel and precision equipment',
      status: SupplierStatus.ACTIVE,
    },
    create: {
      name: 'Apex Medical Supplies Ltd',
      contactPerson: 'Marcus Vance',
      email: 'orders@apexmed.com',
      phone: '+1-555-019-2831',
      address: '220 Innovation Parkway, Suite 10, Boston, MA',
      notes: 'Primary supplier for surgical steel and precision equipment',
      status: SupplierStatus.ACTIVE,
    },
  });

  const supplierMediShield = await prisma.supplier.upsert({
    where: { name: 'MediShield Safety Solutions' },
    update: {
      contactPerson: 'Elena Rostova',
      email: 'supply@medishield.org',
      phone: '+1-555-082-9912',
      address: '890 Bioscience Drive, Chicago, IL',
      notes: 'Bulk supplier for sterile gloves, N95 masks, and gowns',
      status: SupplierStatus.ACTIVE,
    },
    create: {
      name: 'MediShield Safety Solutions',
      contactPerson: 'Elena Rostova',
      email: 'supply@medishield.org',
      phone: '+1-555-082-9912',
      address: '890 Bioscience Drive, Chicago, IL',
      notes: 'Bulk supplier for sterile gloves, N95 masks, and gowns',
      status: SupplierStatus.ACTIVE,
    },
  });

  // 9. Seed Products & Stock
  console.log('Inserting sample products...');
  const productsData = [
    {
      sku: 'SKU-SCALPEL-10',
      barcode: '890123456001',
      barcodeNormalized: '890123456001',
      name: 'Stainless Steel Surgical Scalpel Handle #3',
      slug: 'surgical-scalpel-handle-3',
      description: 'Premium surgical grade stainless steel scalpel handle compatible with #10 through #15 blades.',
      brand: 'ApexMed',
      unit: UnitOfMeasure.EACH,
      costPrice: 14.50,
      sellingPrice: 28.00,
      categoryId: catInstruments.id,
      reorderLevel: 25,
      isPublished: true,
      initialQty: 120,
    },
    {
      sku: 'SKU-FORCEPS-5',
      barcode: '890123456002',
      barcodeNormalized: '890123456002',
      name: 'Micro-Adson Tissue Forceps 12cm',
      slug: 'micro-adson-tissue-forceps-12cm',
      description: 'Delicate 1x2 teeth micro forceps for precision tissue handling.',
      brand: 'ApexMed',
      unit: UnitOfMeasure.EACH,
      costPrice: 22.00,
      sellingPrice: 45.00,
      categoryId: catInstruments.id,
      reorderLevel: 15,
      isPublished: true,
      initialQty: 45,
    },
    {
      sku: 'SKU-GLOVE-NIT-M',
      barcode: '890123456003',
      barcodeNormalized: '890123456003',
      name: 'Nitrile Examination Gloves Powder-Free (Medium, 100/Box)',
      slug: 'nitrile-exam-gloves-powder-free-m',
      description: 'Medical grade textured fingertips nitrile exam gloves with superior tactile sensitivity.',
      brand: 'MediShield',
      unit: UnitOfMeasure.BOX,
      costPrice: 8.25,
      sellingPrice: 16.50,
      categoryId: catPPE.id,
      reorderLevel: 50,
      isPublished: true,
      initialQty: 300,
    },
    {
      sku: 'SKU-MASK-N95-PRO',
      barcode: '890123456004',
      barcodeNormalized: '890123456004',
      name: 'N95 Particulate Respirator Mask (Pack of 20)',
      slug: 'n95-particulate-respirator-mask-20pk',
      description: 'NIOSH certified N95 respirator mask with comfortable elastic headband and adjustable nose clip.',
      brand: 'MediShield',
      unit: UnitOfMeasure.PACK,
      costPrice: 19.50,
      sellingPrice: 38.00,
      categoryId: catPPE.id,
      reorderLevel: 40,
      isPublished: true,
      initialQty: 18, // Low stock on purpose
    },
    {
      sku: 'SKU-OXIMETER-DIG',
      barcode: '890123456005',
      barcodeNormalized: '890123456005',
      name: 'OLED Digital Fingertip Pulse Oximeter',
      slug: 'oled-digital-fingertip-pulse-oximeter',
      description: 'Fast, non-invasive SpO2 arterial oxygen saturation and pulse rate monitor with multi-directional display.',
      brand: 'ApexMed',
      unit: UnitOfMeasure.EACH,
      costPrice: 32.00,
      sellingPrice: 65.00,
      categoryId: catDiagnostics.id,
      reorderLevel: 10,
      isPublished: true,
      initialQty: 0, // Out of stock on purpose
    },
    {
      sku: 'SKU-GAUZE-STER-4X4',
      barcode: '890123456006',
      barcodeNormalized: '890123456006',
      name: 'Sterile 12-Ply Cotton Gauze Sponges 4x4 (Pack of 50)',
      slug: 'sterile-cotton-gauze-sponges-4x4-50pk',
      description: '100% pure absorbent woven cotton sponges, sterile packaged 2 per pouch.',
      brand: 'MediShield',
      unit: UnitOfMeasure.PACK,
      costPrice: 6.00,
      sellingPrice: 12.50,
      categoryId: catConsumables.id,
      reorderLevel: 30,
      isPublished: true,
      initialQty: 150,
    },
  ];

  const adminUser = userRecords['ADMIN'];

  for (const item of productsData) {
    const product = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        brand: item.brand,
        unit: item.unit,
        costPrice: item.costPrice,
        averageCost: item.costPrice,
        sellingPrice: item.sellingPrice,
        categoryId: item.categoryId,
        reorderLevel: item.reorderLevel,
        isPublished: item.isPublished,
      },
      create: {
        sku: item.sku,
        barcode: item.barcode,
        barcodeNormalized: item.barcodeNormalized,
        name: item.name,
        slug: item.slug,
        description: item.description,
        brand: item.brand,
        unit: item.unit,
        costPrice: item.costPrice,
        averageCost: item.costPrice,
        sellingPrice: item.sellingPrice,
        categoryId: item.categoryId,
        reorderLevel: item.reorderLevel,
        isPublished: item.isPublished,
      },
    });

    // Create balance
    await prisma.inventoryBalance.upsert({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: mainWarehouse.id,
        },
      },
      update: {
        quantityOnHand: item.initialQty,
      },
      create: {
        productId: product.id,
        warehouseId: mainWarehouse.id,
        quantityOnHand: item.initialQty,
      },
    });

    if (item.initialQty > 0) {
      // Check if movement already exists
      const existingMovement = await prisma.stockMovement.findFirst({
        where: {
          productId: product.id,
          warehouseId: mainWarehouse.id,
          reasonCode: ReasonCode.DIRECT_PURCHASE,
        },
      });

      if (!existingMovement) {
        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            warehouseId: mainWarehouse.id,
            movementType: MovementType.RECEIPT,
            quantityDelta: item.initialQty,
            quantityAfter: item.initialQty,
            unitCost: item.costPrice,
            reasonCode: ReasonCode.DIRECT_PURCHASE,
            reason: 'Initial stock intake from vendor shipment',
            referenceType: ReferenceType.MANUAL,
            performedBy: adminUser.id,
          },
        });
      }
    }
  }

  // 10. Seed Document Counters
  const currentYear = new Date().getFullYear();
  await prisma.documentCounter.upsert({
    where: {
      scope_year: {
        scope: 'PURCHASE_ORDER',
        year: currentYear,
      },
    },
    update: {},
    create: {
      scope: 'PURCHASE_ORDER',
      year: currentYear,
      lastValue: 100,
    },
  });

  await prisma.documentCounter.upsert({
    where: {
      scope_year: {
        scope: 'GOODS_RECEIPT',
        year: currentYear,
      },
    },
    update: {},
    create: {
      scope: 'GOODS_RECEIPT',
      year: currentYear,
      lastValue: 100,
    },
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';

const app = createApp();

describe('Inventory, Products & Purchasing Workflows', () => {
  let adminCookie = '';
  let adminCsrf = '';
  let staffCookie = '';
  let staffCsrf = '';

  let testWarehouseId = '';
  let secondWarehouseId = '';
  let testCategoryId = '';
  let testSupplierId = '';
  let testProductId = '';

  beforeAll(async () => {
    // 1. Login as Admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@stockwise.local', password: 'AdminPassword123!' });
    const adminCookies = adminRes.headers['set-cookie'] || [];
    adminCookie = adminCookies[0].split(';')[0];
    adminCsrf = adminRes.body.data.csrfToken;

    // 2. Login as Staff
    const staffRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'staff@stockwise.local', password: 'StaffPassword123!' });
    const staffCookies = staffRes.headers['set-cookie'] || [];
    staffCookie = staffCookies[0].split(';')[0];
    staffCsrf = staffRes.body.data.csrfToken;

    // 3. Load reference warehouse, category, and supplier
    const whRes = await request(app)
      .get('/api/v1/warehouses')
      .set('Cookie', adminCookie);
    testWarehouseId = whRes.body.data[0].id;
    secondWarehouseId = whRes.body.data[1].id;

    const catRes = await request(app)
      .get('/api/v1/categories')
      .set('Cookie', adminCookie);
    testCategoryId = catRes.body.data[0].id;

    const supRes = await request(app)
      .get('/api/v1/suppliers')
      .set('Cookie', adminCookie);
    testSupplierId = supRes.body.data[0].id;
  });

  describe('Product CRUD & Cost Masking', () => {
    const testSku = `SKU-TEST-${Date.now()}`;
    const testSlug = `test-product-${Date.now()}`;

    it('creates product as Admin with cost details', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', adminCsrf)
        .send({
          sku: testSku,
          name: 'Precision Test Instrument',
          slug: testSlug,
          unit: 'EACH',
          costPrice: 25.50,
          sellingPrice: 50.00,
          categoryId: testCategoryId,
          reorderLevel: 10,
          isPublished: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.sku).toBe(testSku);
      testProductId = res.body.data.id;
    });

    it('rejects duplicate SKU with 409 DUPLICATE_SKU', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', adminCsrf)
        .send({
          sku: testSku,
          name: 'Duplicate SKU Instrument',
          slug: `dup-slug-${Date.now()}`,
          unit: 'EACH',
          sellingPrice: 50.00,
          categoryId: testCategoryId,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_SKU');
    });

    it('masks cost details from Staff on product read', async () => {
      const res = await request(app)
        .get(`/api/v1/products/${testProductId}`)
        .set('Cookie', staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.costPrice).toBeUndefined();
      expect(res.body.data.averageCost).toBeUndefined();
      expect(res.body.data.sellingPrice).toBe('50.00');
    });
  });

  describe('Stock Operations & Zero Negative Protection', () => {
    it('receives stock direct into warehouse', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/receipts')
        .set('Cookie', staffCookie)
        .set('X-CSRF-Token', staffCsrf)
        .send({
          productId: testProductId,
          warehouseId: testWarehouseId,
          quantity: 20,
          reasonCode: 'DIRECT_PURCHASE',
          reason: 'Initial direct purchase delivery',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.balanceAfter).toBe(20);
    });

    it('issues stock from warehouse reducing balance', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/issues')
        .set('Cookie', staffCookie)
        .set('X-CSRF-Token', staffCsrf)
        .send({
          productId: testProductId,
          warehouseId: testWarehouseId,
          quantity: 5,
          reasonCode: 'USAGE',
          reason: 'Internal clinic usage',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.balanceAfter).toBe(15);
    });

    it('rejects issue that would make stock negative with 409', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/issues')
        .set('Cookie', staffCookie)
        .set('X-CSRF-Token', staffCsrf)
        .send({
          productId: testProductId,
          warehouseId: testWarehouseId,
          quantity: 100, // Available is only 15!
          reasonCode: 'USAGE',
          reason: 'Excessive issue attempt',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toContain('Insufficient stock');
    });

    it('atomically transfers stock between warehouses', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/transfers')
        .set('Cookie', staffCookie)
        .set('X-CSRF-Token', staffCsrf)
        .send({
          productId: testProductId,
          fromWarehouseId: testWarehouseId,
          toWarehouseId: secondWarehouseId,
          quantity: 5,
          notes: 'Inter-warehouse stock redistribution',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.transferGroupId).toBeDefined();

      // Check balance at target warehouse
      const targetBal = await prisma.inventoryBalance.findUnique({
        where: {
          productId_warehouseId: {
            productId: testProductId,
            warehouseId: secondWarehouseId,
          },
        },
      });
      expect(Number(targetBal?.quantityOnHand)).toBe(5);
    });
  });

  describe('Purchasing & Goods Receipt Workflow', () => {
    let testPoId = '';
    let testPoItemId = '';

    it('creates draft PO and verifies stock is UNCHANGED', async () => {
      const balBefore = await prisma.inventoryBalance.findUnique({
        where: {
          productId_warehouseId: {
            productId: testProductId,
            warehouseId: testWarehouseId,
          },
        },
      });

      const res = await request(app)
        .post('/api/v1/purchase-orders')
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', adminCsrf)
        .send({
          supplierId: testSupplierId,
          warehouseId: testWarehouseId,
          items: [
            {
              productId: testProductId,
              quantityOrdered: 30,
              unitCost: 20.00,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('DRAFT');
      testPoId = res.body.data.id;
      testPoItemId = res.body.data.items[0].id;

      // BR-4 verification: PO creation NEVER changes stock
      const balAfter = await prisma.inventoryBalance.findUnique({
        where: {
          productId_warehouseId: {
            productId: testProductId,
            warehouseId: testWarehouseId,
          },
        },
      });
      expect(Number(balAfter?.quantityOnHand)).toBe(Number(balBefore?.quantityOnHand));
    });

    it('submits PO transitioning DRAFT to ORDERED', async () => {
      const res = await request(app)
        .post(`/api/v1/purchase-orders/${testPoId}/submit`)
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', adminCsrf);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ORDERED');
    });

    it('partially receives goods and verifies stock increases only by received quantity', async () => {
      const balBefore = await prisma.inventoryBalance.findUnique({
        where: {
          productId_warehouseId: {
            productId: testProductId,
            warehouseId: testWarehouseId,
          },
        },
      });

      const res = await request(app)
        .post(`/api/v1/purchase-orders/${testPoId}/receipts`)
        .set('Cookie', staffCookie)
        .set('X-CSRF-Token', staffCsrf)
        .send({
          deliveryNoteRef: 'DN-998811',
          lines: [
            {
              purchaseOrderItemId: testPoItemId,
              quantityReceived: 10, // 10 out of 30 ordered
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.purchaseOrderStatus).toBe('PARTIALLY_RECEIVED');

      const balAfter = await prisma.inventoryBalance.findUnique({
        where: {
          productId_warehouseId: {
            productId: testProductId,
            warehouseId: testWarehouseId,
          },
        },
      });
      expect(Number(balAfter?.quantityOnHand)).toBe(Number(balBefore?.quantityOnHand) + 10);
    });
  });
});


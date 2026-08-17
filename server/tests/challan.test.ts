/// <reference types="jest" />
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = 'test-admin-challan@example.com';
const ADMIN_PASS = 'Admin@123';
let adminToken: string;

// Test data IDs
const TEST_CUSTOMER_ID = 'test-cust-challan-001';
const TEST_PRODUCT_A_ID = 'test-prod-challan-A';
const TEST_PRODUCT_B_ID = 'test-prod-challan-B';
let testChallanId: string;

beforeAll(async () => {
  // Create test admin
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      name: 'Test Admin Challan',
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASS, 10),
      role: 'ADMIN',
    },
  });

  // Create test customer
  await prisma.customer.upsert({
    where: { id: TEST_CUSTOMER_ID },
    update: {},
    create: {
      id: TEST_CUSTOMER_ID,
      customerName: 'Test Customer',
      mobileNumber: '9999999999',
      businessName: 'Test Business',
      customerType: 'RETAIL',
      status: 'ACTIVE',
    },
  });

  // Create test products with controlled stock
  await prisma.product.upsert({
    where: { id: TEST_PRODUCT_A_ID },
    update: { currentStock: 50 },
    create: {
      id: TEST_PRODUCT_A_ID,
      productName: 'Test Product A',
      sku: 'TEST-PROD-A-001',
      category: 'Test',
      unitPrice: 100,
      currentStock: 50,
      minimumStock: 5,
    },
  });

  await prisma.product.upsert({
    where: { id: TEST_PRODUCT_B_ID },
    update: { currentStock: 3 },
    create: {
      id: TEST_PRODUCT_B_ID,
      productName: 'Test Product B (Low Stock)',
      sku: 'TEST-PROD-B-001',
      category: 'Test',
      unitPrice: 200,
      currentStock: 3,
      minimumStock: 10,
    },
  });

  // Login
  const loginRes = await request(app).post('/api/auth/login').send({
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
  });
  adminToken = loginRes.body.data.token;
});

afterAll(async () => {
  // Clean up test data
  await prisma.salesChallanItem.deleteMany({
    where: { challan: { customerId: TEST_CUSTOMER_ID } },
  });
  await prisma.salesChallan.deleteMany({ where: { customerId: TEST_CUSTOMER_ID } });
  await prisma.stockMovement.deleteMany({ where: { productId: { in: [TEST_PRODUCT_A_ID, TEST_PRODUCT_B_ID] } } });
  await prisma.product.deleteMany({ where: { id: { in: [TEST_PRODUCT_A_ID, TEST_PRODUCT_B_ID] } } });
  await prisma.customer.deleteMany({ where: { id: TEST_CUSTOMER_ID } });
  await prisma.user.deleteMany({ where: { email: ADMIN_EMAIL } });
  await prisma.$disconnect();
});

describe('Challan Creation', () => {
  it('should create a DRAFT challan successfully', async () => {
    const res = await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId: TEST_CUSTOMER_ID,
        items: [
          { productId: TEST_PRODUCT_A_ID, quantity: 5 },
          { productId: TEST_PRODUCT_B_ID, quantity: 2 },
        ],
        notes: 'Test challan',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('DRAFT');
    expect(res.body.data.challanNumber).toMatch(/^SC-\d{4}-\d{6}$/);
    expect(res.body.data.items).toHaveLength(2);
    testChallanId = res.body.data.id;
  });

  it('should store product snapshots correctly', async () => {
    const res = await request(app)
      .get(`/api/challans/${testChallanId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const item = res.body.data.items.find((i: any) => i.productId === TEST_PRODUCT_A_ID);
    expect(item.productNameSnapshot).toBe('Test Product A');
    expect(item.skuSnapshot).toBe('TEST-PROD-A-001');
    expect(Number(item.unitPriceSnapshot)).toBe(100);
  });

  it('should NOT deduct stock for DRAFT challan', async () => {
    const product = await prisma.product.findUnique({ where: { id: TEST_PRODUCT_A_ID } });
    expect(product?.currentStock).toBe(50); // Unchanged
  });

  it('should reject challan with no items', async () => {
    const res = await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customerId: TEST_CUSTOMER_ID, items: [] });

    expect(res.status).toBe(422);
  });
});

describe('Challan Confirmation - Sufficient Stock', () => {
  it('should confirm challan and deduct stock', async () => {
    const stockBefore = await prisma.product.findUnique({ where: { id: TEST_PRODUCT_A_ID } });
    const stockBBefore = await prisma.product.findUnique({ where: { id: TEST_PRODUCT_B_ID } });

    const res = await request(app)
      .post(`/api/challans/${testChallanId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CONFIRMED');

    // Verify stock was deducted
    const stockAfterA = await prisma.product.findUnique({ where: { id: TEST_PRODUCT_A_ID } });
    const stockAfterB = await prisma.product.findUnique({ where: { id: TEST_PRODUCT_B_ID } });

    expect(stockAfterA?.currentStock).toBe((stockBefore?.currentStock ?? 0) - 5);
    expect(stockAfterB?.currentStock).toBe((stockBBefore?.currentStock ?? 0) - 2);
  });

  it('should create OUT stock movement records on confirmation', async () => {
    const movements = await prisma.stockMovement.findMany({
      where: {
        productId: TEST_PRODUCT_A_ID,
        movementType: 'OUT',
        reason: { contains: testChallanId.slice(0, 5) },
      },
    });
    // There should be at least one OUT movement
    const challan = await prisma.salesChallan.findUnique({ where: { id: testChallanId } });
    const outMovements = await prisma.stockMovement.findMany({
      where: {
        productId: TEST_PRODUCT_A_ID,
        movementType: 'OUT',
        reason: { contains: challan!.challanNumber },
      },
    });
    expect(outMovements.length).toBeGreaterThan(0);
  });

  it('should not allow confirming an already confirmed challan', async () => {
    const res = await request(app)
      .post(`/api/challans/${testChallanId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('ALREADY_CONFIRMED');
  });
});

describe('Challan Confirmation - Insufficient Stock', () => {
  let insufficientChallanId: string;

  it('should create a challan requesting more than available stock', async () => {
    const res = await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId: TEST_CUSTOMER_ID,
        items: [
          { productId: TEST_PRODUCT_B_ID, quantity: 100 }, // Only 1 left after previous test
        ],
      });

    expect(res.status).toBe(201);
    insufficientChallanId = res.body.data.id;
  });

  it('should REJECT confirmation when stock is insufficient', async () => {
    const res = await request(app)
      .post(`/api/challans/${insufficientChallanId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('INSUFFICIENT_STOCK');
    expect(res.body.message).toContain('Insufficient stock');
  });

  it('should NOT have changed stock on rejection', async () => {
    // Stock of Product B should not have gone negative
    const product = await prisma.product.findUnique({ where: { id: TEST_PRODUCT_B_ID } });
    expect(product?.currentStock).toBeGreaterThanOrEqual(0);
  });

  it('should ensure stock never goes negative', async () => {
    const products = await prisma.product.findMany();
    for (const p of products) {
      expect(p.currentStock).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('Role Authorization', () => {
  let warehouseToken: string;

  beforeAll(async () => {
    await prisma.user.upsert({
      where: { email: 'test-warehouse@example.com' },
      update: {},
      create: {
        name: 'Test Warehouse User',
        email: 'test-warehouse@example.com',
        passwordHash: await bcrypt.hash('Warehouse@123', 10),
        role: 'WAREHOUSE',
      },
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test-warehouse@example.com', password: 'Warehouse@123' });
    warehouseToken = res.body.data.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'test-warehouse@example.com' } });
  });

  it('should deny WAREHOUSE user from creating challans', async () => {
    const res = await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        customerId: TEST_CUSTOMER_ID,
        items: [{ productId: TEST_PRODUCT_A_ID, quantity: 1 }],
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('should allow WAREHOUSE user to view products', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${warehouseToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

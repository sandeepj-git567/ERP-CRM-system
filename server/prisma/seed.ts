import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ─── Clean existing data in correct order ─────────────────────────────────
  await prisma.salesChallanItem.deleteMany();
  await prisma.salesChallan.deleteMany();
  await prisma.challanCounter.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.customerFollowUp.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleaned existing data');

  // ─── Users ────────────────────────────────────────────────────────────────
  const passwordSalt = 10;

  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: 'user-admin-001',
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash: await bcrypt.hash('Admin@123', passwordSalt),
        role: "ADMIN",
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-sales-001',
        name: 'Sarah Sales',
        email: 'sales@example.com',
        passwordHash: await bcrypt.hash('Sales@123', passwordSalt),
        role: "SALES",
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-warehouse-001',
        name: 'Waqas Warehouse',
        email: 'warehouse@example.com',
        passwordHash: await bcrypt.hash('Warehouse@123', passwordSalt),
        role: "WAREHOUSE",
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-accounts-001',
        name: 'Anita Accounts',
        email: 'accounts@example.com',
        passwordHash: await bcrypt.hash('Accounts@123', passwordSalt),
        role: "ACCOUNTS",
      },
    }),
  ]);

  const [admin, sales, warehouse, accounts] = users;
  console.log(`✅ Created ${users.length} users`);

  // ─── Products ─────────────────────────────────────────────────────────────
  const productData = [
    { productName: 'Basmati Rice 5kg', sku: 'RICE-BAS-5KG', category: 'Grains', unitPrice: 320.00, currentStock: 150, minimumStock: 20, warehouseLocation: 'A-01' },
    { productName: 'Sunflower Oil 1L', sku: 'OIL-SFW-1L', category: 'Oils', unitPrice: 145.00, currentStock: 200, minimumStock: 30, warehouseLocation: 'B-02' },
    { productName: 'Toor Dal 1kg', sku: 'DAL-TOOR-1KG', category: 'Pulses', unitPrice: 95.00, currentStock: 80, minimumStock: 25, warehouseLocation: 'A-03' },
    { productName: 'Sugar 1kg', sku: 'SUG-WHT-1KG', category: 'Sweeteners', unitPrice: 42.00, currentStock: 300, minimumStock: 50, warehouseLocation: 'C-01' },
    { productName: 'Wheat Flour 10kg', sku: 'FLR-WHT-10KG', category: 'Grains', unitPrice: 380.00, currentStock: 120, minimumStock: 20, warehouseLocation: 'A-02' },
    { productName: 'Salt Iodised 1kg', sku: 'SALT-IOD-1KG', category: 'Spices', unitPrice: 18.00, currentStock: 500, minimumStock: 100, warehouseLocation: 'D-01' },
    { productName: 'Chana Dal 1kg', sku: 'DAL-CHA-1KG', category: 'Pulses', unitPrice: 88.00, currentStock: 60, minimumStock: 20, warehouseLocation: 'A-04' },
    { productName: 'Turmeric Powder 500g', sku: 'SPC-TUR-500G', category: 'Spices', unitPrice: 65.00, currentStock: 90, minimumStock: 15, warehouseLocation: 'D-02' },
    { productName: 'Red Chilli Powder 500g', sku: 'SPC-RCP-500G', category: 'Spices', unitPrice: 72.00, currentStock: 75, minimumStock: 15, warehouseLocation: 'D-03' },
    { productName: 'Mustard Oil 1L', sku: 'OIL-MUS-1L', category: 'Oils', unitPrice: 165.00, currentStock: 110, minimumStock: 20, warehouseLocation: 'B-03' },
    { productName: 'Groundnut Oil 1L', sku: 'OIL-GRD-1L', category: 'Oils', unitPrice: 180.00, currentStock: 85, minimumStock: 20, warehouseLocation: 'B-04' },
    { productName: 'Moong Dal 1kg', sku: 'DAL-MOO-1KG', category: 'Pulses', unitPrice: 105.00, currentStock: 45, minimumStock: 20, warehouseLocation: 'A-05' },
    { productName: 'Coriander Powder 500g', sku: 'SPC-COR-500G', category: 'Spices', unitPrice: 55.00, currentStock: 8, minimumStock: 15, warehouseLocation: 'D-04' },
    { productName: 'Jeera 250g', sku: 'SPC-JEE-250G', category: 'Spices', unitPrice: 48.00, currentStock: 0, minimumStock: 10, warehouseLocation: 'D-05' },
    { productName: 'Soya Refined Oil 1L', sku: 'OIL-SOY-1L', category: 'Oils', unitPrice: 135.00, currentStock: 160, minimumStock: 30, warehouseLocation: 'B-05' },
    { productName: 'Basmati Rice 1kg', sku: 'RICE-BAS-1KG', category: 'Grains', unitPrice: 68.00, currentStock: 250, minimumStock: 40, warehouseLocation: 'A-06' },
    { productName: 'Masoor Dal 1kg', sku: 'DAL-MAS-1KG', category: 'Pulses', unitPrice: 82.00, currentStock: 55, minimumStock: 20, warehouseLocation: 'A-07' },
    { productName: 'Black Pepper 100g', sku: 'SPC-BPP-100G', category: 'Spices', unitPrice: 95.00, currentStock: 12, minimumStock: 15, warehouseLocation: 'D-06' },
    { productName: 'Cardamom 50g', sku: 'SPC-CAR-50G', category: 'Spices', unitPrice: 120.00, currentStock: 30, minimumStock: 10, warehouseLocation: 'D-07' },
    { productName: 'Sona Masoori Rice 5kg', sku: 'RICE-SOM-5KG', category: 'Grains', unitPrice: 295.00, currentStock: 180, minimumStock: 25, warehouseLocation: 'A-08' },
  ];

  const products = await Promise.all(
    productData.map((p) =>
      prisma.product.create({
        data: { ...p, unitPrice: p.unitPrice },
      })
    )
  );

  console.log(`✅ Created ${products.length} products`);

  // ─── Customers ────────────────────────────────────────────────────────────
  const customerData = [
    { customerName: 'Ramesh Kumar', mobileNumber: '9876543210', email: 'ramesh@kirana.com', businessName: 'Ramesh Kirana Store', gstNumber: '07ABCDE1234F1Z5', customerType: "RETAIL", status: "ACTIVE", address: '12, Main Bazaar, Delhi', followUpDate: new Date('2026-08-15'), notes: 'Bulk buyer during festivals' },
    { customerName: 'Priya Distributors', mobileNumber: '9812345678', email: 'priya@dist.com', businessName: 'Priya General Distributors', gstNumber: '29FGHIJ5678K2L6', customerType: "DISTRIBUTOR", status: "ACTIVE", address: 'Plot 5, Industrial Area, Bangalore', followUpDate: new Date('2026-08-20'), notes: 'Monthly order cycle' },
    { customerName: 'Suresh Wholesale', mobileNumber: '9898989898', email: 'suresh@wholesale.in', businessName: 'Suresh Wholesale Mart', gstNumber: null, customerType: "WHOLESALE", status: "ACTIVE", address: '22 Market Rd, Mumbai', followUpDate: null, notes: null },
    { customerName: 'Anil Traders', mobileNumber: '9123456789', email: null, businessName: 'Anil General Traders', gstNumber: '24KLMNO9012P3Q7', customerType: "WHOLESALE", status: "LEAD", address: '45 Sardar Patel Rd, Ahmedabad', followUpDate: new Date('2026-08-10'), notes: 'Interested in bulk oil orders' },
    { customerName: 'Meena Stores', mobileNumber: '9765432109', email: 'meena@store.com', businessName: 'Meena General Stores', gstNumber: null, customerType: "RETAIL", status: "ACTIVE", address: '7 Gandhi Nagar, Pune', followUpDate: null, notes: null },
    { customerName: 'VijayLakshmi Supermall', mobileNumber: '9654321098', email: 'vl@supermall.com', businessName: 'VijayLakshmi Supermarket', gstNumber: '33PQRST3456U4V8', customerType: "WHOLESALE", status: "ACTIVE", address: '100 Anna Salai, Chennai', followUpDate: new Date('2026-09-01'), notes: 'High volume, negotiate pricing' },
    { customerName: 'Deepak & Sons', mobileNumber: '9543210987', email: 'deepak@sons.co', businessName: 'Deepak & Sons Enterprises', gstNumber: '08UVWXY7890Z5A9', customerType: "DISTRIBUTOR", status: "ACTIVE", address: '33 Rajouri Garden, Delhi', followUpDate: null, notes: null },
    { customerName: 'Kalpana Trading Co.', mobileNumber: '9432109876', email: 'kalpana@trading.com', businessName: 'Kalpana Trading Company', gstNumber: null, customerType: "RETAIL", status: "LEAD", address: '56 MG Road, Jaipur', followUpDate: new Date('2026-08-18'), notes: 'New customer, send product catalogue' },
    { customerName: 'Harish Cold Storage', mobileNumber: '9321098765', email: 'harish@cold.com', businessName: 'Harish Cold Storage & Traders', gstNumber: '27ABCYZ1234B6C0', customerType: "WHOLESALE", status: "INACTIVE", address: '78 APMC, Navi Mumbai', followUpDate: null, notes: 'Had payment issues last quarter' },
    { customerName: 'Gopi Provisional Stores', mobileNumber: '9210987654', email: null, businessName: 'Gopi Provisional', gstNumber: null, customerType: "RETAIL", status: "ACTIVE", address: '14 T Nagar, Chennai', followUpDate: null, notes: null },
    { customerName: 'Lakshmi Rice Mill', mobileNumber: '9109876543', email: 'lakshmi@ricemill.in', businessName: 'Lakshmi Rice Mill & Traders', gstNumber: '32DEFAB5678C7D1', customerType: "DISTRIBUTOR", status: "ACTIVE", address: '22 NH-47, Coimbatore', followUpDate: new Date('2026-08-25'), notes: 'Prefers Basmati varieties' },
    { customerName: 'Vijay Kumar Retail', mobileNumber: '9098765432', email: 'vijay@retail.com', businessName: 'V.K. Retail Chain', gstNumber: '06GHIJK9012E8F2', customerType: "RETAIL", status: "LEAD", address: '90 Sector-14, Gurgaon', followUpDate: new Date('2026-08-12'), notes: 'Expanding to 3 outlets, good prospect' },
    { customerName: 'National Food Supplies', mobileNumber: '8987654321', email: 'info@nfs.com', businessName: 'National Food Supplies Ltd.', gstNumber: '21LMNOP3456F9G3', customerType: "DISTRIBUTOR", status: "ACTIVE", address: '5 Industrial Estate, Hyderabad', followUpDate: null, notes: 'Monthly contract, auto-renews' },
    { customerName: 'Shri Ram Grocers', mobileNumber: '8876543210', email: null, businessName: 'Shri Ram Grocers', gstNumber: null, customerType: "RETAIL", status: "ACTIVE", address: '120 Civil Lines, Kanpur', followUpDate: new Date('2026-09-10'), notes: null },
    { customerName: 'Future Foods Pvt Ltd', mobileNumber: '8765432109', email: 'contact@futurefoods.com', businessName: 'Future Foods Pvt Ltd', gstNumber: '36QRSTU7890G0H4', customerType: "WHOLESALE", status: "LEAD", address: '300 Banjara Hills, Hyderabad', followUpDate: new Date('2026-08-22'), notes: 'Presented demo, awaiting decision' },
  ];

  const customers = await Promise.all(
    customerData.map((c) => prisma.customer.create({ data: c }))
  );

  console.log(`✅ Created ${customers.length} customers`);

  // ─── Customer Follow-ups ──────────────────────────────────────────────────
  await Promise.all([
    prisma.customerFollowUp.create({
      data: {
        customerId: customers[0].id,
        note: 'Called Ramesh. Confirmed festival season order for 50 bags rice.',
        followUpDate: new Date('2026-08-05'),
        createdById: sales.id,
      },
    }),
    prisma.customerFollowUp.create({
      data: {
        customerId: customers[0].id,
        note: 'Discussed new Basmati variety. Will visit store next week.',
        followUpDate: new Date('2026-08-02'),
        createdById: sales.id,
      },
    }),
    prisma.customerFollowUp.create({
      data: {
        customerId: customers[1].id,
        note: 'Priya Distributors requesting 10% discount on bulk oil orders.',
        followUpDate: new Date('2026-08-01'),
        createdById: admin.id,
      },
    }),
    prisma.customerFollowUp.create({
      data: {
        customerId: customers[3].id,
        note: 'Anil Traders interested in 500L oil. Send quote by Friday.',
        followUpDate: new Date('2026-08-07'),
        createdById: sales.id,
      },
    }),
    prisma.customerFollowUp.create({
      data: {
        customerId: customers[7].id,
        note: 'Sent product catalogue. Follow up after review.',
        followUpDate: new Date('2026-08-06'),
        createdById: sales.id,
      },
    }),
    prisma.customerFollowUp.create({
      data: {
        customerId: customers[11].id,
        note: 'Vijay Kumar expanding to Gurgaon Sector-22. High potential.',
        followUpDate: new Date('2026-08-07'),
        createdById: sales.id,
      },
    }),
  ]);

  console.log('✅ Created follow-ups');

  // ─── Stock Movements (initial stock IN records) ───────────────────────────
  const movementReasons = ['Initial stock entry', 'Restock from supplier', 'Warehouse transfer IN'];

  await Promise.all(
    products.map((p, i) =>
      prisma.stockMovement.create({
        data: {
          productId: p.id,
          quantity: p.currentStock,
          movementType: "IN",
          reason: movementReasons[i % movementReasons.length],
          createdById: warehouse.id,
        },
      })
    )
  );

  // Additional manual movements
  await prisma.stockMovement.create({
    data: {
      productId: products[0].id,
      quantity: 30,
      movementType: "OUT",
      reason: 'Sample distribution',
      createdById: warehouse.id,
    },
  });

  await prisma.stockMovement.create({
    data: {
      productId: products[1].id,
      quantity: 50,
      movementType: "IN",
      reason: 'Emergency restock',
      createdById: warehouse.id,
    },
  });

  console.log('✅ Created stock movements');

  // ─── Challan Counter ──────────────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  await prisma.challanCounter.create({
    data: { year: currentYear, counter: 0 },
  });

  // ─── Sales Challans ───────────────────────────────────────────────────────
  const challanData = [
    // CONFIRMED challans
    {
      challanNumber: 'SC-2026-000001',
      customerId: customers[0].id,
      status: "CONFIRMED",
      createdById: sales.id,
      items: [
        { product: products[0], quantity: 5 },
        { product: products[4], quantity: 3 },
      ],
    },
    {
      challanNumber: 'SC-2026-000002',
      customerId: customers[1].id,
      status: "CONFIRMED",
      createdById: sales.id,
      items: [
        { product: products[1], quantity: 20 },
        { product: products[9], quantity: 10 },
      ],
    },
    {
      challanNumber: 'SC-2026-000003',
      customerId: customers[2].id,
      status: "CONFIRMED",
      createdById: admin.id,
      items: [
        { product: products[3], quantity: 50 },
        { product: products[5], quantity: 100 },
      ],
    },
    {
      challanNumber: 'SC-2026-000004',
      customerId: customers[4].id,
      status: "CONFIRMED",
      createdById: sales.id,
      items: [
        { product: products[6], quantity: 10 },
        { product: products[7], quantity: 8 },
      ],
    },
    {
      challanNumber: 'SC-2026-000005',
      customerId: customers[5].id,
      status: "CONFIRMED",
      createdById: sales.id,
      items: [
        { product: products[15], quantity: 30 },
        { product: products[19], quantity: 15 },
      ],
    },
    // DRAFT challans
    {
      challanNumber: 'SC-2026-000006',
      customerId: customers[3].id,
      status: "DRAFT",
      createdById: sales.id,
      items: [
        { product: products[1], quantity: 25 },
        { product: products[10], quantity: 10 },
      ],
    },
    {
      challanNumber: 'SC-2026-000007',
      customerId: customers[6].id,
      status: "DRAFT",
      createdById: sales.id,
      items: [
        { product: products[2], quantity: 15 },
        { product: products[11], quantity: 8 },
      ],
    },
    {
      challanNumber: 'SC-2026-000008',
      customerId: customers[12].id,
      status: "DRAFT",
      createdById: sales.id,
      items: [
        { product: products[0], quantity: 10 },
        { product: products[3], quantity: 20 },
      ],
    },
    // CANCELLED challan
    {
      challanNumber: 'SC-2026-000009',
      customerId: customers[8].id,
      status: "CANCELLED",
      createdById: sales.id,
      items: [
        { product: products[2], quantity: 5 },
      ],
    },
    {
      challanNumber: 'SC-2026-000010',
      customerId: customers[13].id,
      status: "CONFIRMED",
      createdById: admin.id,
      items: [
        { product: products[16], quantity: 20 },
        { product: products[5], quantity: 30 },
      ],
    },
  ];

  // Create challans and track stock deductions for CONFIRMED ones
  for (const cd of challanData) {
    const totalQuantity = cd.items.reduce((s, i) => s + i.quantity, 0);
    const totalAmount = cd.items.reduce(
      (s, i) => s + Number(i.product.unitPrice) * i.quantity,
      0
    );

    const challan = await prisma.salesChallan.create({
      data: {
        challanNumber: cd.challanNumber,
        customerId: cd.customerId,
        totalQuantity,
        totalAmount,
        status: cd.status,
        createdById: cd.createdById,
        items: {
          create: cd.items.map((item) => ({
            productId: item.product.id,
            productNameSnapshot: item.product.productName,
            skuSnapshot: item.product.sku,
            unitPriceSnapshot: item.product.unitPrice,
            quantity: item.quantity,
            subtotal: Number(item.product.unitPrice) * item.quantity,
          })),
        },
      },
    });

    // For confirmed challans, deduct stock and create OUT movements
    if (cd.status === "CONFIRMED") {
      for (const item of cd.items) {
        await prisma.product.update({
          where: { id: item.product.id },
          data: { currentStock: { decrement: item.quantity } },
        });
        await prisma.stockMovement.create({
          data: {
            productId: item.product.id,
            quantity: item.quantity,
            movementType: "OUT",
            reason: `Challan ${cd.challanNumber} confirmed`,
            createdById: cd.createdById,
          },
        });
      }
    }

    console.log(`   Created challan ${cd.challanNumber} [${cd.status}]`);
  }

  // Update challan counter to 10
  await prisma.challanCounter.update({
    where: { year: currentYear },
    data: { counter: 10 },
  });

  console.log('✅ Created challans');
  console.log('\n✨ Seed completed successfully!\n');
  console.log('Test credentials:');
  console.log('  admin@example.com     / Admin@123');
  console.log('  sales@example.com     / Sales@123');
  console.log('  warehouse@example.com / Warehouse@123');
  console.log('  accounts@example.com  / Accounts@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

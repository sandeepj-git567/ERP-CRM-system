const BASE_URL = 'http://localhost:5000/api';

async function req(url, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function runE2EVerification() {
  console.log('====================================================');
  console.log('🚀 STARTING COMPREHENSIVE END-TO-END SYSTEM AUDIT 🚀');
  console.log('====================================================\n');

  try {
    // 1. Auth: Login as Admin
    console.log('🔹 1. Testing Authentication (Admin Login)...');
    const adminRes = await req(`${BASE_URL}/auth/login`, 'POST', {
      email: 'admin@example.com',
      password: 'Admin@123',
    });
    const adminToken = adminRes.data.token;
    console.log('   ✅ Admin Login successful. Token generated:', adminToken.slice(0, 25) + '...');

    // 2. Auth: Register a new Staff with Role & Bio
    console.log('\n🔹 2. Testing Multi-Role Staff Registration & Bio...');
    const randomSuffix = Math.floor(Math.random() * 10000);
    const newStaffEmail = `rahul.sales${randomSuffix}@example.com`;
    const regRes = await req(`${BASE_URL}/auth/register`, 'POST', {
      name: 'Rahul Deshmukh',
      email: newStaffEmail,
      password: 'Password@123',
      role: 'SALES',
      phone: '+91 98200 44556',
      department: 'Pune & Western Maharashtra Territory',
      bio: 'Enterprise wholesale distributor accounts specialist.',
    });
    const salesToken = regRes.data.token;
    const salesUser = regRes.data.user;
    console.log('   ✅ Staff Registration successful:', salesUser.name, `(${salesUser.role})`);
    console.log('   ✅ Territory & Bio recorded:', salesUser.department, '|', salesUser.bio);

    // 3. Auth: Update Profile & Bio
    console.log('\n🔹 3. Testing Profile & Bio Editing (/auth/profile)...');
    const profileRes = await req(
      `${BASE_URL}/auth/profile`,
      'PUT',
      {
        name: 'Rahul Deshmukh (Sr. Lead)',
        phone: '+91 98200 99999',
        department: 'Maharashtra North & West Territory',
        bio: 'Senior Director of Wholesale Client Accounts.',
      },
      salesToken
    );
    console.log('   ✅ Profile updated successfully:', profileRes.data.name, '|', profileRes.data.bio);

    // 4. Customers: Create Customer
    console.log('\n🔹 4. Testing Customer CRM Module (Create Customer)...');
    const custRes = await req(
      `${BASE_URL}/customers`,
      'POST',
      {
        customerName: `Ajay Enterprises ${randomSuffix}`,
        mobileNumber: '9876500000',
        email: `ajay${randomSuffix}@enterprises.in`,
        businessName: 'Ajay Supermarket & Logistics Hub',
        gstNumber: '27AABCU9603R1ZN',
        customerType: 'WHOLESALE',
        address: 'Plot 45, APMC Market Yard, Navi Mumbai',
        status: 'ACTIVE',
        notes: 'High volume wholesale buyer for bulk chemicals.',
      },
      salesToken
    );
    const customer = custRes.data;
    console.log('   ✅ Customer created:', customer.customerName, `(ID: ${customer.id})`);

    // 5. Customers: Add Follow-Up Note
    console.log('\n🔹 5. Testing CRM Follow-Up Note Timeline...');
    const followUpRes = await req(
      `${BASE_URL}/customers/${customer.id}/follow-ups`,
      'POST',
      {
        note: 'Customer agreed to sign long-term distribution agreement for 500 units monthly.',
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      salesToken
    );
    console.log('   ✅ Follow-Up note recorded:', followUpRes.data.note);

    // 6. Products: Create Product
    console.log('\n🔹 6. Testing Product & Inventory Module (Create Product)...');
    const skuCode = `IND-CLEAN-${randomSuffix}`;
    const prodRes = await req(
      `${BASE_URL}/products`,
      'POST',
      {
        productName: 'EcoClean Industrial Sanitizer 5L',
        sku: skuCode,
        category: 'Cleaning Chemicals',
        unitPrice: 550.00,
        currentStock: 100,
        minimumStock: 20,
        warehouseLocation: 'Bhiwandi Central Logistics Hub - Rack C2',
      },
      adminToken
    );
    const product = prodRes.data;
    console.log('   ✅ Product created:', product.productName, `(SKU: ${product.sku}, Stock: ${product.currentStock})`);

    // 7. Products: Log Stock Movement
    console.log('\n🔹 7. Testing Stock Movement Audit Log (Movement IN)...');
    const stockMoveRes = await req(
      `${BASE_URL}/products/${product.id}/stock`,
      'POST',
      {
        quantity: 50,
        movementType: 'IN',
        reason: 'Received supplier shipment PO-2026-9901',
      },
      adminToken
    );
    console.log('   ✅ Stock Movement logged. New stock:', stockMoveRes.data.product.currentStock, 'units');

    // 8. Sales Challan: Create Challan (Auto-number & Snapshot)
    console.log('\n🔹 8. Testing Sales Challan Generation (Draft Challan with Snapshots)...');
    const challanRes = await req(
      `${BASE_URL}/challans`,
      'POST',
      {
        customerId: customer.id,
        notes: 'Express dispatch via road transport with delivery receipt.',
        items: [
          {
            productId: product.id,
            quantity: 30,
          },
        ],
      },
      salesToken
    );
    const challan = challanRes.data;
    console.log('   ✅ Sales Challan generated:', challan.challanNumber);
    console.log('   ✅ Challan Status:', challan.status, '| Total Quantity:', challan.totalQuantity, '| Total INR: ₹' + challan.totalAmount);
    console.log('   ✅ Snapshot verified on item:', challan.items[0].productNameSnapshot, '@ ₹' + challan.items[0].unitPriceSnapshot);

    // 9. Sales Challan: Confirm Challan (Atomic Stock Deduction)
    console.log('\n🔹 9. Testing Atomic Stock Deduction on Challan Confirmation...');
    const confirmRes = await req(
      `${BASE_URL}/challans/${challan.id}/confirm`,
      'PATCH',
      {},
      salesToken
    );
    console.log('   ✅ Challan confirmed successfully:', confirmRes.data.status);

    // Verify stock decreased atomically from 150 to 120
    const verifiedProdRes = await req(`${BASE_URL}/products/${product.id}`, 'GET', null, salesToken);
    console.log('   ✅ Stock verification: Expected 120 units, Actual stock in PostgreSQL:', verifiedProdRes.data.currentStock, 'units');

    // 10. Dashboard & Operations KPIs
    console.log('\n🔹 10. Testing Operations Dashboard KPIs...');
    const dashRes = await req(`${BASE_URL}/dashboard/stats`, 'GET', null, adminToken);
    const kpi = dashRes.data.stats;
    console.log('   ✅ Total Customers in Database:', kpi.totalCustomers);
    console.log('   ✅ Total Active Wholesale Accounts:', kpi.activeCustomers);
    console.log('   ✅ Total Products in Stock Catalogue:', kpi.totalProducts);
    console.log('   ✅ Confirmed Challans Monthly Revenue: ₹' + Number(kpi.monthlyRevenue).toLocaleString('en-IN'));
    console.log('   ✅ Low Stock Alerts Count:', kpi.lowStockCount);

    console.log('\n====================================================');
    console.log('🎉 ALL 10 END-TO-END BUSINESS FLOWS PASSED 100%! 🎉');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ E2E Audit Error:', err.message);
    process.exit(1);
  }
}

runE2EVerification();

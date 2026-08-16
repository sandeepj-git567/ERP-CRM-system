import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo login accounts only (no dummy products or customer data)...');

  const passwordSalt = 10;

  const demoUsers = [
    {
      id: 'user-admin-001',
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Admin@123',
      role: 'ADMIN',
      department: 'Headquarters & Executive Admin',
      phone: '+91 98765 00001',
      bio: 'System Administrator with full permissions across all modules.',
    },
    {
      id: 'user-sales-001',
      name: 'Sarah Sales',
      email: 'sales@example.com',
      password: 'Sales@123',
      role: 'SALES',
      department: 'Field CRM & Regional Sales',
      phone: '+91 98765 00002',
      bio: 'Lead Sales Executive for key client accounts and challans.',
    },
    {
      id: 'user-warehouse-001',
      name: 'Waqas Warehouse',
      email: 'warehouse@example.com',
      password: 'Warehouse@123',
      role: 'WAREHOUSE',
      department: 'Logistics Hub & Inventory Control',
      phone: '+91 98765 00003',
      bio: 'Warehouse & Logistics Manager supervising stock movements.',
    },
    {
      id: 'user-accounts-001',
      name: 'Anita Accounts',
      email: 'accounts@example.com',
      password: 'Accounts@123',
      role: 'ACCOUNTS',
      department: 'GST Compliance & Accounting Desk',
      phone: '+91 98765 00004',
      bio: 'Accounts Officer managing ledgers, GSTR-1, and invoicing.',
    },
  ];

  for (const user of demoUsers) {
    const passwordHash = await bcrypt.hash(user.password, passwordSalt);

    const upsertedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash,
        role: user.role,
        department: user.department,
        phone: user.phone,
        bio: user.bio,
        isActive: true,
      },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
        department: user.department,
        phone: user.phone,
        bio: user.bio,
        isActive: true,
      },
    });

    console.log(`✅ Ready: ${upsertedUser.role.padEnd(9)} | ${upsertedUser.email} / ${user.password}`);
  }

  // Ensure Challan counter exists for current year without adding mock challans
  const currentYear = new Date().getFullYear();
  await prisma.challanCounter.upsert({
    where: { year: currentYear },
    update: {},
    create: { year: currentYear, counter: 0 },
  });

  console.log('\n✨ Demo logins seeded successfully without any mock business data!\n');
}

main()
  .catch((e) => {
    console.error('❌ Failed to seed demo logins:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

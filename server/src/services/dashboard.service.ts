import { prisma } from '../lib/prisma';

export async function getDashboardService() {
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  const [
    totalCustomers,
    activeCustomers,
    leads,
    totalProducts,
    outOfStockCount,
    draftChallans,
    confirmedChallans,
    recentChallans,
    recentMovements,
    upcomingFollowUps,
    allProducts,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { status: 'ACTIVE' } }),
    prisma.customer.count({ where: { status: 'LEAD' } }),
    prisma.product.count(),
    prisma.product.count({ where: { currentStock: 0 } }),
    prisma.salesChallan.count({ where: { status: 'DRAFT' } }),
    prisma.salesChallan.count({ where: { status: 'CONFIRMED' } }),
    prisma.salesChallan.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        customer: { select: { customerName: true, businessName: true } },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        product: { select: { productName: true, sku: true } },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.customerFollowUp.findMany({
      where: {
        followUpDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      orderBy: { followUpDate: 'asc' },
      take: 5,
      include: {
        customer: { select: { id: true, customerName: true, businessName: true } },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.product.findMany({ select: { currentStock: true, minimumStock: true } }),
  ]);

  const lowStockCount = allProducts.filter(
    (p) => p.currentStock > 0 && p.currentStock <= p.minimumStock
  ).length;

  // Challan totals this month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyRevenue = await prisma.salesChallan.aggregate({
    where: { status: 'CONFIRMED', createdAt: { gte: startOfMonth } },
    _sum: { totalAmount: true },
  });

  return {
    stats: {
      totalCustomers,
      activeCustomers,
      leads,
      totalProducts,
      lowStockCount,
      outOfStockCount,
      draftChallans,
      confirmedChallans,
      monthlyRevenue: Number(monthlyRevenue._sum.totalAmount ?? 0),
    },
    recentChallans,
    recentMovements,
    upcomingFollowUps,
  };
}

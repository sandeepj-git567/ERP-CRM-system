import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { getPagination, buildPaginationResult } from '../utils/pagination';
import { z } from 'zod';
import { createChallanSchema, updateChallanSchema, challanQuerySchema } from '../validators/challan.validator';
import { emitRealtimeEvent } from '../lib/socket';

// ─── Challan Number Generator ─────────────────────────────────────────────────
async function generateChallanNumber(): Promise<string> {
  const year = new Date().getFullYear();

  const counter = await prisma.challanCounter.upsert({
    where: { year },
    update: { counter: { increment: 1 } },
    create: { year, counter: 1 },
  });

  const seq = counter.counter.toString().padStart(6, '0');
  return `SC-${year}-${seq}`;
}

// ─── Get Challans ─────────────────────────────────────────────────────────────
export async function getChallansService(query: z.infer<typeof challanQuerySchema>) {
  const { page, limit, skip } = getPagination(query.page, query.limit);
  const { search, status, customerId, dateFrom, dateTo } = query;

  const where: Prisma.SalesChallanWhereInput = {};

  if (search) {
    where.OR = [
      { challanNumber: { contains: search, mode: 'insensitive' } },
      { customer: { customerName: { contains: search, mode: 'insensitive' } } },
      { customer: { businessName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = endDate;
    }
  }

  const [challans, total] = await Promise.all([
    prisma.salesChallan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        customer: { select: { id: true, customerName: true, businessName: true, mobileNumber: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.salesChallan.count({ where }),
  ]);

  return { challans, pagination: buildPaginationResult(total, page, limit) };
}

// ─── Get Challan by ID ────────────────────────────────────────────────────────
export async function getChallanByIdService(id: string) {
  const challan = await prisma.salesChallan.findUnique({
    where: { id },
    include: {
      customer: true,
      createdBy: { select: { id: true, name: true, role: true } },
      items: {
        include: {
          product: { select: { id: true, currentStock: true, productName: true } },
        },
      },
    },
  });

  if (!challan) {
    throw new AppError('Challan not found.', 404, 'NOT_FOUND');
  }

  return challan;
}

// ─── Create Challan ───────────────────────────────────────────────────────────
export async function createChallanService(
  data: z.infer<typeof createChallanSchema>,
  createdById: string
) {
  // Verify customer exists
  const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
  if (!customer) {
    throw new AppError('Customer not found.', 404, 'NOT_FOUND');
  }

  // Fetch all products in one query
  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

  if (products.length !== productIds.length) {
    throw new AppError('One or more products not found.', 404, 'NOT_FOUND');
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Calculate totals using current prices
  let totalQuantity = 0;
  let totalAmount = 0;

  const itemsData = data.items.map((item) => {
    const product = productMap.get(item.productId)!;
    const subtotal = Number(product.unitPrice) * item.quantity;
    totalQuantity += item.quantity;
    totalAmount += subtotal;

    return {
      productId: product.id,
      productNameSnapshot: product.productName,
      skuSnapshot: product.sku,
      unitPriceSnapshot: product.unitPrice,
      quantity: item.quantity,
      subtotal,
    };
  });

  const challanNumber = await generateChallanNumber();

  const challan = await prisma.salesChallan.create({
    data: {
      challanNumber,
      customerId: data.customerId,
      totalQuantity,
      totalAmount,
      status: 'DRAFT',
      notes: data.notes,
      createdById,
      items: { create: itemsData },
    },
    include: {
      customer: { select: { id: true, customerName: true, businessName: true } },
      createdBy: { select: { id: true, name: true, role: true } },
      items: true,
    },
  });

  // Real-time broadcast: Challan Created
  emitRealtimeEvent({
    type: 'CHALLAN_CREATED',
    entity: 'challan',
    action: 'create',
    data: challan,
    meta: {
      actorId: createdById,
      actorName: challan.createdBy.name,
      actorRole: challan.createdBy.role,
      title: 'New Sales Challan Created',
      description: `${challan.createdBy.name} created Challan #${challan.challanNumber} for ${challan.customer.customerName} (${challan.totalQuantity} items, ₹${challan.totalAmount.toLocaleString('en-IN')}) [DRAFT].`,
      timestamp: new Date().toISOString(),
    },
  });

  return challan;
}

// ─── Update Challan (DRAFT only) ──────────────────────────────────────────────
export async function updateChallanService(
  id: string,
  data: z.infer<typeof updateChallanSchema>,
  createdById: string
) {
  const existing = await getChallanByIdService(id);

  if (existing.status !== 'DRAFT') {
    throw new AppError(
      'Only DRAFT challans can be edited.',
      400,
      'INVALID_STATE'
    );
  }

  let updatedChallan;

  // If updating items, recalculate totals
  if (data.items && data.items.length > 0) {
    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

    if (products.length !== productIds.length) {
      throw new AppError('One or more products not found.', 404, 'NOT_FOUND');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let totalQuantity = 0;
    let totalAmount = 0;

    const itemsData = data.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const subtotal = Number(product.unitPrice) * item.quantity;
      totalQuantity += item.quantity;
      totalAmount += subtotal;

      return {
        productId: product.id,
        productNameSnapshot: product.productName,
        skuSnapshot: product.sku,
        unitPriceSnapshot: product.unitPrice,
        quantity: item.quantity,
        subtotal,
      };
    });

    // Delete old items and create new ones
    await prisma.salesChallanItem.deleteMany({ where: { id } });

    updatedChallan = await prisma.salesChallan.update({
      where: { id },
      data: {
        customerId: data.customerId,
        totalQuantity,
        totalAmount,
        notes: data.notes,
        items: { create: itemsData },
      },
      include: {
        customer: { select: { id: true, customerName: true, businessName: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        items: true,
      },
    });
  } else {
    updatedChallan = await prisma.salesChallan.update({
      where: { id },
      data: {
        customerId: data.customerId,
        notes: data.notes,
      },
      include: {
        customer: { select: { id: true, customerName: true, businessName: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        items: true,
      },
    });
  }

  // Real-time broadcast
  emitRealtimeEvent({
    type: 'CHALLAN_UPDATED',
    entity: 'challan',
    action: 'update',
    data: updatedChallan,
    meta: {
      actorId: createdById,
      actorName: updatedChallan.createdBy.name,
      actorRole: updatedChallan.createdBy.role,
      title: 'Sales Challan Updated',
      description: `Challan #${updatedChallan.challanNumber} was modified by ${updatedChallan.createdBy.name}.`,
      timestamp: new Date().toISOString(),
    },
  });

  return updatedChallan;
}

// ─── Confirm Challan (CRITICAL ATOMIC TRANSACTION) ────────────────────────────
export async function confirmChallanService(id: string, confirmedById: string) {
  const challan = await getChallanByIdService(id);

  if (challan.status === 'CONFIRMED') {
    throw new AppError('Challan is already confirmed.', 400, 'ALREADY_CONFIRMED');
  }

  if (challan.status === 'CANCELLED') {
    throw new AppError('A cancelled challan cannot be confirmed.', 400, 'INVALID_STATE');
  }

  if (challan.items.length === 0) {
    throw new AppError('Cannot confirm a challan with no items.', 400, 'NO_ITEMS');
  }

  // ── Run everything inside an atomic transaction ──────────────────────────
  const result = await prisma.$transaction(async (tx) => {
    // 1. Lock and verify stock for every product
    for (const item of challan.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { id: true, productName: true, currentStock: true },
      });

      if (!product) {
        throw new AppError(`Product ${item.productId} not found.`, 404, 'NOT_FOUND');
      }

      if (product.currentStock < item.quantity) {
        throw new AppError(
          `Insufficient stock for "${product.productName}". Available: ${product.currentStock}, Required: ${item.quantity}`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }
    }

    // 2. Deduct stock and create OUT movements for every product
    for (const item of challan.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          movementType: 'OUT',
          reason: `Challan ${challan.challanNumber} confirmed`,
          createdById: confirmedById,
        },
      });
    }

    // 3. Update challan status to CONFIRMED
    const confirmed = await tx.salesChallan.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: {
        customer: { select: { id: true, customerName: true, businessName: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        items: true,
      },
    });

    return confirmed;
  });

  // Real-time broadcast to all connected roles!
  emitRealtimeEvent({
    type: 'CHALLAN_CONFIRMED',
    entity: 'challan',
    action: 'confirm',
    data: result,
    meta: {
      actorId: confirmedById,
      title: 'Sales Challan Confirmed & Stock Deducted',
      description: `Challan #${result.challanNumber} confirmed for ${result.customer.customerName}. Inventory stock was automatically deducted.`,
      timestamp: new Date().toISOString(),
    },
  });

  return result;
}

// ─── Cancel Challan ───────────────────────────────────────────────────────────
export async function cancelChallanService(id: string, cancelledById: string) {
  const challan = await getChallanByIdService(id);

  if (challan.status === 'CANCELLED') {
    throw new AppError('Challan is already cancelled.', 400, 'ALREADY_CANCELLED');
  }

  let result;

  if (challan.status === 'CONFIRMED') {
    // Restore stock in a transaction
    result = await prisma.$transaction(async (tx) => {
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'IN',
            reason: `Challan ${challan.challanNumber} cancelled - stock restored`,
            createdById: cancelledById,
          },
        });
      }

      return tx.salesChallan.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: {
          customer: { select: { id: true, customerName: true, businessName: true } },
          items: true,
        },
      });
    });
  } else {
    // DRAFT → CANCELLED (no stock change needed)
    result = await prisma.salesChallan.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        customer: { select: { id: true, customerName: true, businessName: true } },
        items: true,
      },
    });
  }

  // Real-time broadcast: Challan Cancelled
  emitRealtimeEvent({
    type: 'CHALLAN_CANCELLED',
    entity: 'challan',
    action: 'cancel',
    data: result,
    meta: {
      actorId: cancelledById,
      title: 'Sales Challan Cancelled',
      description: `Challan #${challan.challanNumber} was cancelled. ${challan.status === 'CONFIRMED' ? 'Stock was restored to inventory.' : ''}`,
      timestamp: new Date().toISOString(),
    },
  });

  return result;
}

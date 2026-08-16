import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { getPagination, buildPaginationResult } from '../utils/pagination';
import { z } from 'zod';
import {
  createProductSchema,
  updateProductSchema,
  addStockSchema,
  productQuerySchema,
} from '../validators/product.validator';
import { emitRealtimeEvent } from '../lib/socket';

export async function getProductsService(query: z.infer<typeof productQuerySchema>) {
  const { page, limit, skip } = getPagination(query.page, query.limit);
  const { search, category, stockStatus } = query;

  const where: Prisma.ProductWhereInput = {};

  if (search) {
    where.OR = [
      { productName: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (category) {
    where.category = { equals: category, mode: 'insensitive' };
  }

  if (stockStatus === 'out') {
    where.currentStock = { equals: 0 };
  } else if (stockStatus === 'low') {
    where.AND = [
      { currentStock: { gt: 0 } },
      { currentStock: { lte: prisma.product.fields.minimumStock as any } },
    ];
  } else if (stockStatus === 'healthy') {
    where.currentStock = { gt: 0 };
  }

  // stockStatus filtering done post-query for 'low' since it requires comparing two columns
  const [allProducts, total] = await Promise.all([
    prisma.product.findMany({
      where: stockStatus === 'low' ? (stockStatus === 'low' ? {} : where) : where,
      orderBy: { productName: 'asc' },
      skip: stockStatus === 'low' ? 0 : skip,
      take: stockStatus === 'low' ? 10000 : limit,
    }),
    prisma.product.count({ where: stockStatus === 'low' ? {} : where }),
  ]);

  // Apply low-stock filter in memory (requires comparing currentStock vs minimumStock)
  let products = allProducts;
  let filteredTotal = total;

  if (stockStatus === 'low') {
    // Low stock: currentStock > 0 AND currentStock <= minimumStock
    let filtered = allProducts.filter(
      (p) => p.currentStock > 0 && p.currentStock <= p.minimumStock
    );
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.productName.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (category) {
      filtered = filtered.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }
    filteredTotal = filtered.length;
    products = filtered.slice(skip, skip + limit);
  } else if (stockStatus === 'out') {
    products = allProducts;
    filteredTotal = total;
  } else if (stockStatus === 'healthy') {
    // Healthy: currentStock > minimumStock
    let filtered = allProducts.filter((p) => p.currentStock > p.minimumStock);
    if (search || category) {
      filtered = filtered; // already filtered by where clause
    }
    filteredTotal = filtered.length;
    products = filtered.slice(skip, skip + limit);
  }

  return { products, pagination: buildPaginationResult(filteredTotal, page, limit) };
}

export async function getProductByIdService(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    throw new AppError('Product not found.', 404, 'NOT_FOUND');
  }

  return product;
}

export async function createProductService(data: z.infer<typeof createProductSchema>) {
  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existing) {
    throw new AppError(`Product with SKU "${data.sku}" already exists.`, 409, 'DUPLICATE_SKU');
  }

  const product = await prisma.product.create({
    data: {
      productName: data.productName,
      sku: data.sku,
      category: data.category,
      unitPrice: data.unitPrice,
      currentStock: data.currentStock ?? 0,
      minimumStock: data.minimumStock ?? 0,
      warehouseLocation: data.warehouseLocation ?? null,
    },
  });

  // Real-time broadcast
  emitRealtimeEvent({
    type: 'PRODUCT_CREATED',
    entity: 'product',
    action: 'create',
    data: product,
    meta: {
      title: 'New Product Added',
      description: `${product.productName} (${product.sku}) was added to catalog.`,
      timestamp: new Date().toISOString(),
    },
  });

  return product;
}

export async function updateProductService(id: string, data: z.infer<typeof updateProductSchema>) {
  await getProductByIdService(id);

  if (data.sku) {
    const existing = await prisma.product.findFirst({
      where: { sku: data.sku, NOT: { id } },
    });
    if (existing) {
      throw new AppError(`Product with SKU "${data.sku}" already exists.`, 409, 'DUPLICATE_SKU');
    }
  }

  const product = await prisma.product.update({ where: { id }, data });

  // Real-time broadcast
  emitRealtimeEvent({
    type: 'PRODUCT_UPDATED',
    entity: 'product',
    action: 'update',
    data: product,
    meta: {
      title: 'Product Updated',
      description: `${product.productName} details and pricing were updated.`,
      timestamp: new Date().toISOString(),
    },
  });

  return product;
}

export async function addStockService(
  productId: string,
  data: z.infer<typeof addStockSchema>,
  createdById: string
) {
  const product = await getProductByIdService(productId);

  if (data.movementType === 'OUT' && product.currentStock < data.quantity) {
    throw new AppError(
      `Insufficient stock. Available: ${product.currentStock}, Requested: ${data.quantity}`,
      400,
      'INSUFFICIENT_STOCK'
    );
  }

  const [updatedProduct, movement] = await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: {
        currentStock:
          data.movementType === 'IN'
            ? { increment: data.quantity }
            : { decrement: data.quantity },
      },
    }),
    prisma.stockMovement.create({
      data: {
        productId,
        quantity: data.quantity,
        movementType: data.movementType,
        reason: data.reason,
        createdById,
      },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
      },
    }),
  ]);

  // Real-time broadcast to all roles (especially Sales and Warehouse)
  emitRealtimeEvent({
    type: 'STOCK_UPDATED',
    entity: 'stock',
    action: 'stock',
    data: { product: updatedProduct, movement },
    meta: {
      actorId: createdById,
      actorName: movement.createdBy.name,
      actorRole: movement.createdBy.role,
      title: `Stock ${data.movementType === 'IN' ? 'Restocked' : 'Deducted'}`,
      description: `${movement.createdBy.name} (${movement.createdBy.role}) moved ${data.quantity} units of ${updatedProduct.productName} (${data.movementType}). Current Stock: ${updatedProduct.currentStock}`,
      timestamp: new Date().toISOString(),
    },
  });

  return { product: updatedProduct, movement };
}

export async function getStockMovementsService(
  productId: string,
  query: { page?: string; limit?: string }
) {
  await getProductByIdService(productId);
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.stockMovement.count({ where: { productId } }),
  ]);

  return { movements, pagination: buildPaginationResult(total, page, limit) };
}

export async function getProductCategoriesService() {
  const categories = await prisma.product.findMany({
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });
  return categories.map((c) => c.category);
}

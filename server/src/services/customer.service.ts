import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { getPagination, buildPaginationResult } from '../utils/pagination';
import { z } from 'zod';
import { createCustomerSchema, updateCustomerSchema, createFollowUpSchema, customerQuerySchema } from '../validators/customer.validator';
import { emitRealtimeEvent } from '../lib/socket';

export async function getCustomersService(query: z.infer<typeof customerQuerySchema>) {
  const { page, limit, skip } = getPagination(query.page, query.limit);
  const { search, status, customerType, sortBy = 'createdAt', sortOrder = 'desc' } = query;

  const where: Prisma.CustomerWhereInput = {};

  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: 'insensitive' } },
      { businessName: { contains: search, mode: 'insensitive' } },
      { mobileNumber: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) where.status = status;
  if (customerType) where.customerType = customerType;

  const orderBy: Prisma.CustomerOrderByWithRelationInput = { [sortBy]: sortOrder };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        _count: { select: { followUps: true, challans: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return { customers, pagination: buildPaginationResult(total, page, limit) };
}

export async function getCustomerByIdService(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      _count: { select: { followUps: true, challans: true } },
    },
  });

  if (!customer) {
    throw new AppError('Customer not found.', 404, 'NOT_FOUND');
  }

  return customer;
}

export async function createCustomerService(data: z.infer<typeof createCustomerSchema>) {
  const customer = await prisma.customer.create({ data: data as Prisma.CustomerCreateInput });

  // Real-time broadcast
  emitRealtimeEvent({
    type: 'CUSTOMER_CREATED',
    entity: 'customer',
    action: 'create',
    data: customer,
    meta: {
      title: 'New Customer Added',
      description: `${customer.customerName} (${customer.businessName}) was registered.`,
      timestamp: new Date().toISOString(),
    },
  });

  return customer;
}

export async function updateCustomerService(id: string, data: z.infer<typeof updateCustomerSchema>) {
  await getCustomerByIdService(id); // Ensure exists
  const customer = await prisma.customer.update({
    where: { id },
    data: data as Prisma.CustomerUpdateInput,
  });

  // Real-time broadcast
  emitRealtimeEvent({
    type: 'CUSTOMER_UPDATED',
    entity: 'customer',
    action: 'update',
    data: customer,
    meta: {
      title: 'Customer Updated',
      description: `${customer.customerName} details were updated.`,
      timestamp: new Date().toISOString(),
    },
  });

  return customer;
}

export async function deleteCustomerService(id: string) {
  const customer = await getCustomerByIdService(id);
  const updated = await prisma.customer.update({
    where: { id },
    data: { status: 'INACTIVE' },
  });

  // Real-time broadcast
  emitRealtimeEvent({
    type: 'CUSTOMER_DELETED',
    entity: 'customer',
    action: 'delete',
    data: { id, customerName: customer.customerName },
    meta: {
      title: 'Customer Deactivated',
      description: `${customer.customerName} has been marked as inactive.`,
      timestamp: new Date().toISOString(),
    },
  });

  return updated;
}

// ─── Follow-ups ───────────────────────────────────────────────────────────────

export async function getFollowUpsService(customerId: string, query: { page?: string; limit?: string }) {
  await getCustomerByIdService(customerId);
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const [followUps, total] = await Promise.all([
    prisma.customerFollowUp.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.customerFollowUp.count({ where: { customerId } }),
  ]);

  return { followUps, pagination: buildPaginationResult(total, page, limit) };
}

export async function createFollowUpService(
  customerId: string,
  data: z.infer<typeof createFollowUpSchema>,
  createdById: string
) {
  const customer = await getCustomerByIdService(customerId);

  const followUp = await prisma.customerFollowUp.create({
    data: {
      customerId,
      note: data.note,
      followUpDate: new Date(data.followUpDate),
      createdById,
    },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
    },
  });

  // Update customer's followUpDate to the latest
  await prisma.customer.update({
    where: { id: customerId },
    data: { followUpDate: new Date(data.followUpDate) },
  });

  // Real-time broadcast
  emitRealtimeEvent({
    type: 'FOLLOW_UP_CREATED',
    entity: 'followUp',
    action: 'create',
    data: { followUp, customerName: customer.customerName },
    meta: {
      actorId: createdById,
      actorName: followUp.createdBy.name,
      actorRole: followUp.createdBy.role,
      title: 'New Follow-Up Logged',
      description: `${followUp.createdBy.name} scheduled a follow-up with ${customer.customerName}.`,
      timestamp: new Date().toISOString(),
    },
  });

  return followUp;
}

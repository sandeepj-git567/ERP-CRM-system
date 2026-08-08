import { z } from 'zod';

export const createCustomerSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  mobileNumber: z.string().min(10, 'Valid mobile number required').max(15),
  email: z.string().email('Invalid email').optional().or(z.literal('')).transform(v => v || undefined),
  businessName: z.string().min(2, 'Business name is required'),
  gstNumber: z.string().optional().or(z.literal('')).transform(v => v || undefined),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  address: z.string().optional(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('LEAD'),
  followUpDate: z.string().datetime({ offset: true }).optional().or(z.literal('')).transform(v => v ? new Date(v) : undefined),
  notes: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createFollowUpSchema = z.object({
  note: z.string().min(1, 'Note is required'),
  followUpDate: z.string().datetime({ offset: true }),
});

export const customerQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).optional(),
  sortBy: z.enum(['createdAt', 'customerName', 'followUpDate']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

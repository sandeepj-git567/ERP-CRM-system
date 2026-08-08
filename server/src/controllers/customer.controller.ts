import { Request, Response, NextFunction } from 'express';
import {
  createCustomerSchema,
  updateCustomerSchema,
  createFollowUpSchema,
  customerQuerySchema,
} from '../validators/customer.validator';
import {
  getCustomersService,
  getCustomerByIdService,
  createCustomerService,
  updateCustomerService,
  deleteCustomerService,
  getFollowUpsService,
  createFollowUpService,
} from '../services/customer.service';

export async function getCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = customerQuerySchema.parse(req.query);
    const result = await getCustomersService(query);
    res.json({
      success: true,
      data: result.customers,
      customers: result.customers,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

export async function getCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const customer = await getCustomerByIdService(req.params.id as string);
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
}

export async function createCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createCustomerSchema.parse(req.body);
    const customer = await createCustomerService(data);
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateCustomerSchema.parse(req.body);
    const customer = await updateCustomerService(req.params.id as string, data);
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
}

export async function deleteCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteCustomerService(req.params.id as string);
    res.json({ success: true, message: 'Customer deactivated successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function getFollowUps(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getFollowUpsService(req.params.id as string, req.query as any);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function createFollowUp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createFollowUpSchema.parse(req.body);
    const followUp = await createFollowUpService(req.params.id as string, data, req.user!.userId);
    res.status(201).json({ success: true, data: followUp });
  } catch (err) {
    next(err);
  }
}

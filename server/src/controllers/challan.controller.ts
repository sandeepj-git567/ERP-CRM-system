import { Request, Response, NextFunction } from 'express';
import {
  createChallanSchema,
  updateChallanSchema,
  challanQuerySchema,
} from '../validators/challan.validator';
import {
  getChallansService,
  getChallanByIdService,
  createChallanService,
  updateChallanService,
  confirmChallanService,
  cancelChallanService,
} from '../services/challan.service';

export async function getChallans(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = challanQuerySchema.parse(req.query);
    const result = await getChallansService(query);
    res.json({
      success: true,
      data: result.challans,
      challans: result.challans,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

export async function getChallan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const challan = await getChallanByIdService(req.params.id as string);
    res.json({ success: true, data: challan });
  } catch (err) {
    next(err);
  }
}

export async function createChallan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createChallanSchema.parse(req.body);
    const challan = await createChallanService(data, req.user!.userId);
    res.status(201).json({ success: true, data: challan });
  } catch (err) {
    next(err);
  }
}

export async function updateChallan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateChallanSchema.parse(req.body);
    const challan = await updateChallanService(req.params.id as string, data, req.user!.userId);
    res.json({ success: true, data: challan });
  } catch (err) {
    next(err);
  }
}

export async function confirmChallan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const challan = await confirmChallanService(req.params.id as string, req.user!.userId);
    res.json({ success: true, data: challan, message: 'Challan confirmed successfully. Stock has been deducted.' });
  } catch (err) {
    next(err);
  }
}

export async function cancelChallan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const challan = await cancelChallanService(req.params.id as string, req.user!.userId);
    res.json({ success: true, data: challan, message: 'Challan cancelled.' });
  } catch (err) {
    next(err);
  }
}

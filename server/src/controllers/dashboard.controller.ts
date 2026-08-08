import { Request, Response, NextFunction } from 'express';
import { getDashboardService } from '../services/dashboard.service';

export async function getDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await getDashboardService();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

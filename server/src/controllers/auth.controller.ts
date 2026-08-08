import { Request, Response, NextFunction } from 'express';
import { loginSchema, registerSchema, updateProfileSchema, createUserSchema } from '../validators/auth.validator';
import {
  loginService,
  registerService,
  updateProfileService,
  getMeService,
  getAllUsersService,
  createUserService,
} from '../services/auth.service';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);
    const result = await loginService(data.email, data.password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);
    const result = await registerService(data);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateProfileSchema.parse(req.body);
    const updated = await updateProfileService(req.user!.userId, data);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await getMeService(req.user!.userId);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function getUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await getAllUsersService();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createUserSchema.parse(req.body);
    const user = await createUserService(data);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

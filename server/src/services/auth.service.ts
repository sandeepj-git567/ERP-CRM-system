import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { JwtPayload, Role } from '../types';
import { registerSchema, updateProfileSchema } from '../validators/auth.validator';
import { z } from 'zod';
import { emitRealtimeEvent } from '../lib/socket';

export async function loginService(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role as any,
    name: user.name,
  };

  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn as any });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      phone: user.phone,
      department: user.department,
    },
  };
}

export async function registerService(data: z.infer<typeof registerSchema>) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('A user with this email address is already registered.', 409, 'DUPLICATE_ENTRY');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role as any,
      bio: data.bio || null,
      phone: data.phone || null,
      department: data.department || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      bio: true,
      phone: true,
      department: true,
      isActive: true,
      createdAt: true,
    },
  });

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role as any,
    name: user.name,
  };

  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn as any });

  // Real-time broadcast
  emitRealtimeEvent({
    type: 'USER_CREATED',
    entity: 'user',
    action: 'create',
    data: user,
    meta: {
      title: 'New User Registered',
      description: `${user.name} registered with ${user.role} role.`,
      timestamp: new Date().toISOString(),
    },
  });

  return {
    token,
    user,
  };
}

export async function updateProfileService(userId: string, data: z.infer<typeof updateProfileSchema>) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User account not found.', 404, 'NOT_FOUND');
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.department !== undefined) updateData.department = data.department;

  if (data.newPassword) {
    if (!data.currentPassword) {
      throw new AppError('Current password is required to set a new password.', 400, 'BAD_REQUEST');
    }
    const isMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect.', 400, 'INVALID_PASSWORD');
    }
    updateData.passwordHash = await bcrypt.hash(data.newPassword, 10);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      bio: true,
      phone: true,
      department: true,
      isActive: true,
      createdAt: true,
    },
  });

  return updatedUser;
}

export async function getMeService(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      bio: true,
      phone: true,
      department: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found.', 404, 'NOT_FOUND');
  }

  return user;
}

export async function getAllUsersService() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      bio: true,
      phone: true,
      department: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createUserService(data: z.infer<typeof registerSchema>) {
  const result = await registerService(data);
  return result.user;
}

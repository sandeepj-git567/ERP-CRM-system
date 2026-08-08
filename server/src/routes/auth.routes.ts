import { Router } from 'express';
import { login, register, updateProfile, getMe, getUsers, createUser } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public auth routes
router.post('/login', login);
router.post('/register', register);
router.post('/signup', register);

// Authenticated user profile routes
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/me', authenticate, updateProfile);

// Admin user management
router.get('/users', authenticate, authorize('ADMIN'), getUsers);
router.post('/users', authenticate, authorize('ADMIN'), createUser);

export default router;

import { Router } from 'express';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getFollowUps,
  createFollowUp,
} from '../controllers/customer.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

router.get('/', getCustomers);
router.post('/', authorize('ADMIN', 'SALES', 'ACCOUNTS'), createCustomer);
router.get('/:id', getCustomer);
router.put('/:id', authorize('ADMIN', 'SALES', 'ACCOUNTS'), updateCustomer);
router.delete('/:id', authorize('ADMIN', 'SALES'), deleteCustomer);

// Follow-ups
router.get('/:id/follow-ups', getFollowUps);
router.post('/:id/follow-ups', authorize('ADMIN', 'SALES'), createFollowUp);

export default router;

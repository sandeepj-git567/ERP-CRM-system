import { Router } from 'express';
import {
  getChallans,
  getChallan,
  createChallan,
  updateChallan,
  confirmChallan,
  cancelChallan,
} from '../controllers/challan.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getChallans);
router.post('/', authorize('ADMIN', 'SALES'), createChallan);
router.get('/:id', getChallan);
router.post('/:id/confirm', authorize('ADMIN', 'SALES'), confirmChallan);
router.patch('/:id/confirm', authorize('ADMIN', 'SALES'), confirmChallan);
router.post('/:id/cancel', authorize('ADMIN', 'SALES'), cancelChallan);
router.patch('/:id/cancel', authorize('ADMIN', 'SALES'), cancelChallan);

export default router;

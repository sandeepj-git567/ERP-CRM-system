import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  addStock,
  getStockMovements,
  getCategories,
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/categories', getCategories);
router.get('/', getProducts);
router.post('/', authorize('ADMIN', 'WAREHOUSE'), createProduct);
router.get('/:id', getProduct);
router.put('/:id', authorize('ADMIN', 'WAREHOUSE'), updateProduct);

// Stock management
router.get('/:id/movements', getStockMovements);
router.post('/:id/stock', authorize('ADMIN', 'WAREHOUSE'), addStock);

export default router;

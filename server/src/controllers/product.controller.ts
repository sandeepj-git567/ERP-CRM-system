import { Request, Response, NextFunction } from 'express';
import {
  createProductSchema,
  updateProductSchema,
  addStockSchema,
  productQuerySchema,
} from '../validators/product.validator';
import {
  getProductsService,
  getProductByIdService,
  createProductService,
  updateProductService,
  addStockService,
  getStockMovementsService,
  getProductCategoriesService,
} from '../services/product.service';

export async function getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = productQuerySchema.parse(req.query);
    const result = await getProductsService(query);
    res.json({
      success: true,
      data: result.products,
      products: result.products,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await getProductByIdService(req.params.id as string);
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createProductSchema.parse(req.body);
    const product = await createProductService(data);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateProductSchema.parse(req.body);
    const product = await updateProductService(req.params.id as string, data);
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

export async function addStock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = addStockSchema.parse(req.body);
    const result = await addStockService(req.params.id as string, data, req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getStockMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getStockMovementsService(req.params.id as string, req.query as any);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await getProductCategoriesService();
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

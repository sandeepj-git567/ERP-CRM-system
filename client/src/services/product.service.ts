import { api } from '../lib/api';
import { Product, StockMovement, ProductQuery, PaginatedResponse } from '../types';

export const productService = {
  getAll: async (query: ProductQuery = {}) => {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.search) params.set('search', query.search);
    if (query.category) params.set('category', query.category);
    if (query.stockStatus) params.set('stockStatus', query.stockStatus);

    const res = await api.get<any>(`/products?${params}`);
    const list = res.data.data || res.data.products || [];
    return {
      data: list,
      products: list,
      pagination: res.data.pagination,
    };
  },

  getById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Product }>(`/products/${id}`);
    return res.data.data;
  },

  create: async (data: Partial<Product>) => {
    const res = await api.post<{ success: boolean; data: Product }>('/products', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<Product>) => {
    const res = await api.put<{ success: boolean; data: Product }>(`/products/${id}`, data);
    return res.data.data;
  },

  addStock: async (id: string, data: { quantity: number; movementType: 'IN' | 'OUT'; reason: string }) => {
    const res = await api.post<{ success: boolean; data: { product: Product; movement: StockMovement } }>(
      `/products/${id}/stock`,
      data
    );
    return res.data.data;
  },

  getMovements: async (id: string, page = 1) => {
    const res = await api.get<PaginatedResponse<StockMovement>>(
      `/products/${id}/movements?page=${page}&limit=10`
    );
    return res.data;
  },

  getCategories: async () => {
    const res = await api.get<{ success: boolean; data: string[] }>('/products/categories');
    return res.data.data;
  },
};

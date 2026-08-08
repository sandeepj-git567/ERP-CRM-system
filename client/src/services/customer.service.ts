import { api } from '../lib/api';
import { Customer, CustomerFollowUp, CustomerQuery, PaginatedResponse } from '../types';

export const customerService = {
  getAll: async (query: CustomerQuery = {}) => {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    if (query.customerType) params.set('customerType', query.customerType);

    const res = await api.get<any>(`/customers?${params}`);
    const list = res.data.data || res.data.customers || [];
    return {
      data: list,
      customers: list,
      pagination: res.data.pagination,
    };
  },

  getById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Customer }>(`/customers/${id}`);
    return res.data.data;
  },

  create: async (data: Partial<Customer>) => {
    const res = await api.post<{ success: boolean; data: Customer }>('/customers', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<Customer>) => {
    const res = await api.put<{ success: boolean; data: Customer }>(`/customers/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/customers/${id}`);
    return res.data;
  },

  getFollowUps: async (customerId: string, page = 1) => {
    const res = await api.get<PaginatedResponse<CustomerFollowUp>>(
      `/customers/${customerId}/follow-ups?page=${page}&limit=10`
    );
    return res.data;
  },

  createFollowUp: async (customerId: string, data: { note: string; followUpDate: string }) => {
    const res = await api.post<{ success: boolean; data: CustomerFollowUp }>(
      `/customers/${customerId}/follow-ups`,
      data
    );
    return res.data.data;
  },
};

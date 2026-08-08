import { api } from '../lib/api';
import { SalesChallan, ChallanQuery, CreateChallanData } from '../types';

export const challanService = {
  getAll: async (query: ChallanQuery = {}) => {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    if (query.customerId) params.set('customerId', query.customerId);
    if (query.dateFrom) params.set('dateFrom', query.dateFrom);
    if (query.dateTo) params.set('dateTo', query.dateTo);

    const res = await api.get<any>(`/challans?${params}`);
    const list = res.data.data || res.data.challans || [];
    return {
      data: list,
      challans: list,
      pagination: res.data.pagination,
    };
  },

  getById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: SalesChallan }>(`/challans/${id}`);
    return res.data.data;
  },

  create: async (data: CreateChallanData) => {
    const res = await api.post<{ success: boolean; data: SalesChallan }>('/challans', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<CreateChallanData>) => {
    const res = await api.put<{ success: boolean; data: SalesChallan }>(`/challans/${id}`, data);
    return res.data.data;
  },

  confirm: async (id: string) => {
    const res = await api.post<{ success: boolean; data: SalesChallan; message: string }>(
      `/challans/${id}/confirm`
    );
    return res.data;
  },

  cancel: async (id: string) => {
    const res = await api.post<{ success: boolean; data: SalesChallan; message: string }>(
      `/challans/${id}/cancel`
    );
    return res.data;
  },
};

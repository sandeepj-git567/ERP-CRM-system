import { api } from '../lib/api';
import { AuthResponse, User, RegisterData, UpdateProfileData } from '../types';

export const authService = {
  login: async (email: string, password: string) => {
    const res = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', { email, password });
    return res.data.data;
  },

  register: async (data: RegisterData) => {
    const res = await api.post<{ success: boolean; data: AuthResponse }>('/auth/register', data);
    return res.data.data;
  },

  updateProfile: async (data: UpdateProfileData) => {
    const res = await api.put<{ success: boolean; data: User }>('/auth/profile', data);
    return res.data.data;
  },

  getMe: async () => {
    const res = await api.get<{ success: boolean; data: User }>('/auth/me');
    return res.data.data;
  },

  getUsers: async () => {
    const res = await api.get<{ success: boolean; data: User[] }>('/auth/users');
    return res.data.data;
  },

  createUser: async (data: { name: string; email: string; password: string; role: string }) => {
    const res = await api.post<{ success: boolean; data: User }>('/auth/users', data);
    return res.data.data;
  },
};

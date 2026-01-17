import axios from 'axios';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Category,
  CreateCategoryRequest,
  Transaction,
  CreateTransactionRequest,
  Budget,
  CreateBudgetRequest,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url;

    // 🔴 ログイン失敗時は何もしない
    if (status === 401 && requestUrl !== '/api/auth/login') {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/register', data);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get<Category[]>('/api/categories');
    return response.data;
  },

  create: async (data: CreateCategoryRequest): Promise<Category> => {
    const response = await api.post<Category>('/api/categories', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateCategoryRequest>): Promise<Category> => {
    const response = await api.put<Category>(`/api/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/categories/${id}`);
  },

  getUnregisteredRecurring: async (month?: string): Promise<Category[]> => {
    const params = month ? { month } : {};
    const response = await api.get<Category[]>('/api/categories/recurring/unregistered', { params });
    return response.data;
  },
};

export const transactionsApi = {
  getAll: async (params?: {
    start_date?: string;
    end_date?: string;
    category_id?: string;
    type?: string;
  }): Promise<Transaction[]> => {
    const response = await api.get<Transaction[]>('/api/transactions', { params });
    return response.data;
  },

  create: async (data: CreateTransactionRequest): Promise<Transaction> => {
    const response = await api.post<Transaction>('/api/transactions', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateTransactionRequest>): Promise<Transaction> => {
    const response = await api.put<Transaction>(`/api/transactions/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/transactions/${id}`);
  },
};

export const budgetsApi = {
  getAll: async (params?: { month?: string }): Promise<Budget[]> => {
    const response = await api.get<Budget[]>('/api/budgets', { params });
    return response.data;
  },

  create: async (data: CreateBudgetRequest): Promise<Budget> => {
    const response = await api.post<Budget>('/api/budgets', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateBudgetRequest>): Promise<Budget> => {
    const response = await api.put<Budget>(`/api/budgets/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/budgets/${id}`);
  },
};

export default api;

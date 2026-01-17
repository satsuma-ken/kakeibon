import axios from 'axios';
import { showAuthErrorToast, showConnectionErrorToast, isConnectionError } from '../utils/errorHandler';

// 認証エラー時に発火するカスタムイベント
export const AUTH_ERROR_EVENT = 'auth:error';

// 接続エラー時に発火するカスタムイベント（DB接続不可、サーバーダウンなど）
export const CONNECTION_ERROR_EVENT = 'connection:error';

export const dispatchAuthError = (status: number) => {
  window.dispatchEvent(new CustomEvent(AUTH_ERROR_EVENT, {
    detail: { status }
  }));
};

export const dispatchConnectionError = () => {
  window.dispatchEvent(new CustomEvent(CONNECTION_ERROR_EVENT));
};
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

    // ログインエンドポイントでのエラーはイベントを発火しない（ログイン試行の失敗）
    const isAuthEndpoint = requestUrl?.includes('/api/auth/');

    if ((status === 401 || status === 403) && !isAuthEndpoint) {
      localStorage.removeItem('access_token');
      showAuthErrorToast();
      dispatchAuthError(status);
    }

    // 接続エラー（ネットワークエラー、5xxサーバーエラー）の処理
    // 認証エンドポイントでもトーストは表示（システム障害はユーザーに通知すべき）
    if (isConnectionError(error)) {
      showConnectionErrorToast();
      // 認証エンドポイント以外の場合のみログアウト処理とリダイレクト
      if (!isAuthEndpoint) {
        localStorage.removeItem('access_token');
        dispatchConnectionError();
      }
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

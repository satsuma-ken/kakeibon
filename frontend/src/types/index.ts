export interface User {
  user_id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type TransactionType = 'income' | 'expense';

export type RecurringFrequency = 'monthly' | 'yearly';

export interface Category {
  category_id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  color?: string;
  created_at: string;
  is_recurring?: boolean;
  frequency?: RecurringFrequency;
  default_amount?: number;
}

export interface Transaction {
  transaction_id: string;
  user_id: string;
  category_id: string;
  amount: number;
  type: TransactionType;
  date: string;
  memo?: string;
  created_at: string;
  category?: Category;
}

export interface Budget {
  budget_id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: string;
  created_at: string;
  category?: Category;
}

export interface CreateCategoryRequest {
  name: string;
  type: TransactionType;
  color?: string;
  is_recurring?: boolean;
  frequency?: RecurringFrequency;
  default_amount?: number;
}

export interface CreateTransactionRequest {
  category_id: string;
  amount: number;
  type: TransactionType;
  date: string;
  memo?: string;
}

export interface CreateBudgetRequest {
  category_id: string;
  amount: number;
  month: string;
}

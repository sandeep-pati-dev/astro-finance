import axios from 'axios';
import { toast } from '@/hooks/use-toast';

const API_BASE_URL = 'https://astro-finance-1.onrender.com/api';

// const API_BASE_URL = 'http://localhost:3001/api';


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Return the full response for proper TypeScript typing
    return response;
  },
  (error) => {
    // Only handle 401 errors if we're not on the login page
    // and if it's not a network error (no response)
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Check if we have a token in localStorage
      const token = localStorage.getItem('authToken');
      if (token) {
        // Token exists but is invalid - this is a real auth error
        localStorage.removeItem('authToken');
        // Use a more gentle redirect to avoid interrupting user flow
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }

    // Handle specific error cases with better messages
    let errorMessage = error.response?.data?.error || error.message || 'Request failed';

    if (error.response?.status === 409) {
      // Conflict error - user already exists
      errorMessage = 'An account with this email already exists. Please try logging in instead.';
    } else if (error.response?.status === 400) {
      // Bad request - validation errors
      errorMessage = errorMessage || 'Please check your input and try again.';
    } else if (!error.response) {
      // Network error - no response from server
      errorMessage = 'Network error. Please check your connection and try again.';
    }

    console.error('API request failed:', errorMessage, error.response?.status);

    // Enhance error object with better message
    error.userFriendlyMessage = errorMessage;
    return Promise.reject(error);
  }
);

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Auth endpoints
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: any; token: string }>>('/auth/login', credentials),
  
  register: (userData: { name: string; email: string; password: string }) =>
    api.post<ApiResponse<{ user: any; token: string }>>('/auth/register', userData),
  
  getCurrentUser: () =>
    api.get<ApiResponse<{ user: any }>>('/auth/me'),
  
  logout: () =>
    api.post<ApiResponse<{ message: string }>>('/auth/logout'),
};

// Expense endpoints
export const expenseApi = {
  getExpenses: (filters?: {
    category?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    page?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    return api.get<ApiResponse<{ expenses: any[]; total: number }>>(
      `/expenses?${params.toString()}`
    );
  },
  
  getExpenseById: (id: string) =>
    api.get<ApiResponse<{ expense: any }>>(`/expenses/${id}`),
  
  createExpense: (expenseData: {
    amount: number;
    category: string;
    date?: string;
    notes?: string;
  }) =>
    api.post<ApiResponse<{ expense: any }>>('/expenses', expenseData),
  
  updateExpense: (id: string, expenseData: Partial<{
    amount: number;
    category: string;
    date: string;
    notes: string;
  }>) =>
    api.put<ApiResponse<{ expense: any }>>(`/expenses/${id}`, expenseData),
  
  deleteExpense: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/expenses/${id}`),
  
  getExpenseSummary: (period: 'day' | 'week' | 'month' | 'year' = 'month') =>
    api.get<ApiResponse<{ summary: any }>>(`/expenses/summary/${period}`),
  
  getExpenseSummaryAll: () =>
    api.get<ApiResponse<{ summary: { today: number; week: number; month: number } }>>('/expenses/summary-all'),

  getExpenseSummaryWithChanges: () =>
    api.get<ApiResponse<{ summary: {
      today: { current: number; previous: number; change: number };
      week: { current: number; previous: number; change: number };
      month: { current: number; previous: number; change: number };
    } }>>('/expenses/summary-with-changes'),
  
  getDailySpending: (period: 'week' | 'month' = 'week') =>
    api.get<ApiResponse<{ dailySpending: any }>>(`/expenses/daily-summary/${period}`),

  getExpenseSummaryForMonth: (year: number, month: number) =>
    api.get<ApiResponse<{ summary: any }>>(`/expenses/summary/month/${year}/${month}`),

  getDailySpendingForMonth: (year: number, month: number) =>
    api.get<ApiResponse<{ dailySpending: any }>>(`/expenses/daily-summary/month/${year}/${month}`),

  getMonthlySpendingTrends: (months: number = 6) =>
    api.get<ApiResponse<{ trends: any }>>(`/expenses/monthly-trends/${months}`),
};

// User endpoints
export const userApi = {
  getProfile: () =>
    api.get<ApiResponse<{ user: any }>>('/users/profile'),
  
  updateProfile: (profileData: {
    name?: string;
    email?: string;
  }) =>
    api.put<ApiResponse<{ user: any }>>('/users/profile', profileData),
  
  deleteUser: () =>
    api.delete<ApiResponse<{ message: string }>>('/users'),

  changePassword: (passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) =>
    api.post<ApiResponse<{ message: string }>>('/users/change-password', passwordData),

  exportData: (year: number, month: number) =>
    api.get<string>(`/users/export-data/${year}/${month}`, {
      responseType: 'blob'
    }),
};

// Budget endpoints
export const budgetApi = {
  getBudget: (year: number, month: number) =>
    api.get<ApiResponse<{ budget: any }>>(`/budgets/${year}/${month}`),
  
  getBudgetUsage: (year: number, month: number) =>
    api.get<ApiResponse<{
      budget: any;
      totalSpent: number;
      percentageUsed: number;
      categorySpending: { [category: string]: number };
      categoryUsage: { [category: string]: number };
    }>>(`/budgets/usage/${year}/${month}`),
  
  updateBudget: (year: number, month: number, data: {
    amount: number;
    categories?: { [category: string]: number };
  }) =>
    api.put<ApiResponse<{ budget: any }>>(`/budgets/${year}/${month}`, data),
  
  getBudgetTrend: () =>
    api.get<ApiResponse<{
      currentSpending: number;
      previousSpending: number;
      percentageChange: number;
      trend: 'increase' | 'decrease' | 'stable';
    }>>('/budgets/trend/current'),
};

export default api;

/**
 * App-wide constants
 */

// Month names
export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// Chart colors for pie slices and category indicators
export const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
  '#14b8a6', // teal
  '#6366f1', // indigo
]

// Payment methods
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mobile_payment', label: 'Mobile Payment' },
  { value: 'other', label: 'Other' },
]

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },
  EXPENSES: {
    LIST: '/expenses',
    CREATE: '/expenses',
    GET: (id: number) => `/expenses/${id}`,
    UPDATE: (id: number) => `/expenses/${id}`,
    DELETE: (id: number) => `/expenses/${id}`,
  },
  INCOMES: {
    LIST: '/incomes',
    CREATE: '/incomes',
    GET: (id: number) => `/incomes/${id}`,
    UPDATE: (id: number) => `/incomes/${id}`,
    DELETE: (id: number) => `/incomes/${id}`,
  },
  CATEGORIES: {
    LIST: '/categories',
    CREATE: '/categories',
    UPDATE: (id: number) => `/categories/${id}`,
    DELETE: (id: number) => `/categories/${id}`,
  },
  REPORTS: {
    DASHBOARD: '/reports/dashboard',
    MONTHLY: '/reports/monthly',
    CATEGORY_SUMMARY: '/reports/category-summary',
  },
  BUDGETS: {
    LIST: '/budgets',
    CREATE: '/budgets',
    UPDATE: (id: number) => `/budgets/${id}`,
    DELETE: (id: number) => `/budgets/${id}`,
  },
  SETTINGS: {
    UPDATE_PROFILE: '/auth/update-profile',
    CHANGE_PASSWORD: '/auth/change-password',
  },
}

// Default pagination
export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

// Sort options for expenses
export const EXPENSE_SORT_OPTIONS = [
  { value: 'expense_date', label: 'Date (Newest)' },
  { value: 'amount', label: 'Amount (High to Low)' },
  { value: 'created_at', label: 'Created (Newest)' },
]

// Sort options for income
export const INCOME_SORT_OPTIONS = [
  { value: 'income_date', label: 'Date (Newest)' },
  { value: 'amount', label: 'Amount (High to Low)' },
  { value: 'source', label: 'Source (A-Z)' },
  { value: 'created_at', label: 'Created (Newest)' },
]

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number
  email: string
  full_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  full_name: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

// ── Categories ────────────────────────────────────────────────────────────────
export interface Category {
  id: number
  name: string
  user_id: number
}

// ── Expenses ──────────────────────────────────────────────────────────────────
export type PaymentMethod =
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'mobile_payment'
  | 'other'

export interface Expense {
  id: number
  title: string
  description?: string
  amount: string
  currency: string
  expense_date: string
  payment_method?: PaymentMethod
  notes?: string
  category_id?: number
  category_name?: string
  user_id: number
  created_at: string
  updated_at: string
}

export interface ExpenseCreate {
  title: string
  description?: string
  amount: string
  currency?: string
  expense_date: string
  payment_method?: PaymentMethod
  notes?: string
  category_id?: number
}

export interface ExpenseFilters {
  category_id?: number
  date_from?: string
  date_to?: string
  min_amount?: number
  max_amount?: number
  payment_method?: PaymentMethod
  sort_by?: 'expense_date' | 'amount' | 'created_at'
  sort_order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

export interface PaginatedExpenses {
  items: Expense[]
  total: number
  page: number
  page_size: number
  pages: number
}

// ── Incomes ───────────────────────────────────────────────────────────────────
export interface Income {
  id: number
  source: string
  amount: string
  currency: string
  income_date: string
  description?: string
  user_id: number
  created_at: string
  updated_at: string
}

export interface IncomeCreate {
  source: string
  amount: string
  currency?: string
  income_date: string
  description?: string
}

export interface PaginatedIncomes {
  items: Income[]
  total: number
  page: number
  page_size: number
  pages: number
}

// ── Reports ───────────────────────────────────────────────────────────────────
export interface Dashboard {
  total_expenses: string
  total_income: string
  balance: string
  largest_expense: string | null
  average_expense: string
  expense_count: number
  income_count: number
}

export interface CategorySummaryItem {
  category_id: number | null
  category_name: string
  total: string
  count: number
  percentage: number
}

export interface MonthlyReport {
  year: number
  month: number
  total_income: string
  total_expenses: string
  balance: string
  by_category: CategorySummaryItem[]
}

import { useCallback, useEffect, useState } from 'react'
import { Pencil, Trash2, Download, TrendingUp, TrendingDown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import api from '../lib/api'
import { formatCurrency, formatDate, getErrorMessage } from '../lib/utils'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import ExportDialog, { type ExportFormat } from '../components/ExportDialog'
import type { Category, Expense, ExpenseCreate, Income, IncomeCreate, PaginatedExpenses, PaginatedIncomes, PaymentMethod } from '../types'

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash',           label: 'Cash' },
  { value: 'credit_card',    label: 'Credit Card' },
  { value: 'debit_card',     label: 'Debit Card' },
  { value: 'bank_transfer',  label: 'Bank Transfer' },
  { value: 'mobile_payment', label: 'Mobile Payment' },
  { value: 'other',          label: 'Other' },
]

type Transaction = (Expense & { type: 'expense' }) | (Income & { type: 'income' })

interface TransactionFilters {
  type?: 'all' | 'income' | 'expense'
  date_from?: string
  date_to?: string
  min_amount?: number
  max_amount?: number
  payment_method?: PaymentMethod
  sort_by?: 'date' | 'amount'
  sort_order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

// ── Expense Form ──────────────────────────────────────────────────────────────
function ExpenseForm({
  defaultValues,
  categories,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  defaultValues?: Partial<ExpenseCreate>
  categories: Category[]
  onSubmit: (data: ExpenseCreate) => void
  onCancel: () => void
  loading: boolean
  error: string
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<ExpenseCreate>({
    defaultValues: {
      currency: 'USD',
      expense_date: new Date().toISOString().slice(0, 10),
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <div>
        <label className="label">Title *</label>
        <input className="input" placeholder="e.g. Groceries"
          {...register('title', { required: 'Title is required' })} />
        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount *</label>
          <input type="number" step="0.01" min="0" className="input" placeholder="0.00"
            {...register('amount', { required: 'Amount is required', min: { value: 0.01, message: 'Must be > 0' } })} />
          {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="label">Currency</label>
          <input className="input" placeholder="USD" maxLength={3}
            {...register('currency')} />
        </div>
      </div>
      <div>
        <label className="label">Date *</label>
        <input type="date" className="input"
          {...register('expense_date', { required: 'Date is required' })} />
        {errors.expense_date && <p className="mt-1 text-xs text-red-600">{errors.expense_date.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <select className="input bg-white" {...register('category_id', { setValueAs: v => v === '' ? undefined : Number(v) })}>
            <option value="">No category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Payment method</label>
          <select className="input bg-white" {...register('payment_method', { setValueAs: v => v === '' ? undefined : v })}>
            <option value="">Select…</option>
            {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving…' : 'Save expense'}
        </button>
      </div>
    </form>
  )
}

// ── Income Form ───────────────────────────────────────────────────────────────
function IncomeForm({
  defaultValues,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  defaultValues?: Partial<IncomeCreate>
  onSubmit: (data: IncomeCreate) => void
  onCancel: () => void
  loading: boolean
  error: string
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<IncomeCreate>({
    defaultValues: {
      currency: 'USD',
      income_date: new Date().toISOString().slice(0, 10),
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <div>
        <label className="label">Source *</label>
        <input className="input" placeholder="e.g. Salary"
          {...register('source', { required: 'Source is required' })} />
        {errors.source && <p className="mt-1 text-xs text-red-600">{errors.source.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount *</label>
          <input type="number" step="0.01" min="0" className="input" placeholder="0.00"
            {...register('amount', { required: 'Amount is required', min: { value: 0.01, message: 'Must be > 0' } })} />
          {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="label">Currency</label>
          <input className="input" placeholder="USD" maxLength={3}
            {...register('currency')} />
        </div>
      </div>
      <div>
        <label className="label">Date *</label>
        <input type="date" className="input"
          {...register('income_date', { required: 'Date is required' })} />
        {errors.income_date && <p className="mt-1 text-xs text-red-600">{errors.income_date.message}</p>}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving…' : 'Save income'}
        </button>
      </div>
    </form>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const [expenses, setExpenses] = useState<PaginatedExpenses | null>(null)
  const [incomes, setIncomes] = useState<PaginatedIncomes | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState<TransactionFilters>({ type: 'all', page: 1, page_size: 10, sort_by: 'date', sort_order: 'desc' })
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState<'expense' | 'income' | null>(null)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  const loadData = useCallback(() => {
    setLoading(true)
    const promises = []

    if (filters.type === 'all' || filters.type === 'expense') {
      const expenseParams = new URLSearchParams()
      if (filters.date_from) expenseParams.set('date_from', filters.date_from)
      if (filters.date_to) expenseParams.set('date_to', filters.date_to)
      if (filters.min_amount) expenseParams.set('min_amount', String(filters.min_amount))
      if (filters.max_amount) expenseParams.set('max_amount', String(filters.max_amount))
      if (filters.payment_method) expenseParams.set('payment_method', filters.payment_method)
      expenseParams.set('page', String(filters.page || 1))
      expenseParams.set('page_size', String(filters.page_size || 10))
      expenseParams.set('sort_by', filters.sort_by === 'date' ? 'expense_date' : 'amount')
      expenseParams.set('sort_order', filters.sort_order || 'desc')

      promises.push(
        api.get<PaginatedExpenses>(`/expenses?${expenseParams.toString()}`)
          .then(r => setExpenses(r.data))
          .catch(() => setExpenses(null))
      )
    }

    if (filters.type === 'all' || filters.type === 'income') {
      const incomeParams = new URLSearchParams()
      if (filters.date_from) incomeParams.set('date_from', filters.date_from)
      if (filters.date_to) incomeParams.set('date_to', filters.date_to)
      if (filters.min_amount) incomeParams.set('min_amount', String(filters.min_amount))
      if (filters.max_amount) incomeParams.set('max_amount', String(filters.max_amount))
      incomeParams.set('page', String(filters.page || 1))
      incomeParams.set('page_size', String(filters.page_size || 10))
      incomeParams.set('sort_by', filters.sort_by === 'date' ? 'income_date' : 'amount')
      incomeParams.set('sort_order', filters.sort_order || 'desc')

      promises.push(
        api.get<PaginatedIncomes>(`/incomes?${incomeParams.toString()}`)
          .then(r => setIncomes(r.data))
          .catch(() => setIncomes(null))
      )
    }

    Promise.all(promises).finally(() => setLoading(false))
  }, [filters])

  useEffect(() => {
    api.get<Category[]>('/categories').then(r => setCategories(r.data))
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleCreateExpense = async (form: ExpenseCreate) => {
    setFormLoading(true); setFormError('')
    try {
      await api.post('/expenses', form)
      setFormOpen(null)
      // Ensure expense type is visible after creation
      setFilters(prev => ({ ...prev, type: prev.type === 'income' ? 'all' : prev.type, page: 1 }))
    } catch (e) { setFormError(getErrorMessage(e)) }
    finally { setFormLoading(false) }
  }

  const handleCreateIncome = async (form: IncomeCreate) => {
    setFormLoading(true); setFormError('')
    try {
      await api.post('/incomes', form)
      setFormOpen(null)
      // Always show income after creation — switch to 'all' if currently on expense-only filter
      setFilters(prev => ({ ...prev, type: prev.type === 'expense' ? 'all' : prev.type, page: 1 }))
    } catch (e) { setFormError(getErrorMessage(e)) }
    finally { setFormLoading(false) }
  }

  const handleEdit = async (form: ExpenseCreate | IncomeCreate) => {
    if (!editing) return
    setFormLoading(true); setFormError('')
    try {
      if (editing.type === 'expense') {
        await api.patch(`/expenses/${editing.id}`, form)
      } else {
        await api.patch(`/incomes/${editing.id}`, form)
      }
      setEditing(null)
      loadData()
    } catch (e) { setFormError(getErrorMessage(e)) }
    finally { setFormLoading(false) }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      if (deleting.type === 'expense') {
        await api.delete(`/expenses/${deleting.id}`)
      } else {
        await api.delete(`/incomes/${deleting.id}`)
      }
      setDeleting(null)
      loadData()
    } catch (e) { console.error(e) }
    finally { setDeleteLoading(false) }
  }

  const handleExport = async (format: ExportFormat) => {
    setExportLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('format', format)
      if (filters.type && filters.type !== 'all') params.set('type', filters.type)
      if (filters.date_from) params.set('date_from', filters.date_from)
      if (filters.date_to) params.set('date_to', filters.date_to)
      if (filters.min_amount) params.set('min_amount', String(filters.min_amount))
      if (filters.max_amount) params.set('max_amount', String(filters.max_amount))

      const token = localStorage.getItem('access_token')
      const url = `/api/v1/transactions/export?${params.toString()}`

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      const date = new Date().toISOString().slice(0, 10)
      const ext = format === 'csv' ? 'csv' : format === 'json' ? 'json' : 'pdf'
      a.download = `transactions_${date}.${ext}`
      a.click()
      URL.revokeObjectURL(a.href)
      setExportOpen(false)
    } catch (e) {
      console.error('Export error:', e)
    } finally {
      setExportLoading(false)
    }
  }

  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))
  
  // Combine expenses and incomes into single transaction list
  const allTransactions: Transaction[] = []
  if (filters.type === 'all' || filters.type === 'expense') {
    expenses?.items?.forEach(e => allTransactions.push({ ...e, type: 'expense' }))
  }
  if (filters.type === 'all' || filters.type === 'income') {
    incomes?.items?.forEach(i => allTransactions.push({ ...i, type: 'income' }))
  }

  // Sort by date
  allTransactions.sort((a, b) => {
    const dateA = new Date(a.type === 'expense' ? (a as any).expense_date : (a as any).income_date).getTime()
    const dateB = new Date(b.type === 'expense' ? (b as any).expense_date : (b as any).income_date).getTime()
    return filters.sort_order === 'desc' ? dateB - dateA : dateA - dateB
  })

  return (
    <div className="p-8 h-full bg-dark-bg dark:bg-dark-bg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-300">Transactions</h1>
          <p className="text-gray-400 mt-0.5 text-sm">
            {allTransactions.length > 0 ? `${allTransactions.length} transactions` : 'No transactions'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={() => setExportOpen(true)} title="Export transactions">
            <Download size={16} /> Export
          </button>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => { setFormError(''); setFormOpen('income') }}>
              <TrendingUp size={16} /> Add income
            </button>
            <button className="btn-primary" onClick={() => { setFormError(''); setFormOpen('expense') }}>
              <TrendingDown size={16} /> Add expense
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        <select
          className="input w-auto text-sm py-2"
          value={filters.type || 'all'}
          onChange={e => setFilters(prev => ({ ...prev, type: e.target.value as any, page: 1 }))}
        >
          <option value="all">All transactions</option>
          <option value="income">Income only</option>
          <option value="expense">Expenses only</option>
        </select>

        <input
          type="date"
          className="input w-auto text-sm py-2"
          value={filters.date_from || ''}
          onChange={e => setFilters(prev => ({ ...prev, date_from: e.target.value || undefined, page: 1 }))}
          placeholder="From"
        />

        <input
          type="date"
          className="input w-auto text-sm py-2"
          value={filters.date_to || ''}
          onChange={e => setFilters(prev => ({ ...prev, date_to: e.target.value || undefined, page: 1 }))}
          placeholder="To"
        />

        <select
          className="input w-auto text-sm py-2"
          value={filters.sort_by || 'date'}
          onChange={e => setFilters(prev => ({ ...prev, sort_by: e.target.value as any }))}
        >
          <option value="date">Sort by date</option>
          <option value="amount">Sort by amount</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden bg-dark-card dark:bg-dark-card border border-primary-800">
        {loading ? (
          <div className="divide-y divide-gray-700">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                <div className="h-4 bg-gray-600 rounded w-1/4" />
                <div className="h-4 bg-gray-600 rounded w-1/6 ml-auto" />
              </div>
            ))}
          </div>
        ) : allTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <p className="text-lg font-medium">No transactions found</p>
            <p className="text-sm mt-1">Start by adding income or expenses.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-dark-inner dark:bg-dark-inner border-b border-primary-800">
                <th className="text-left px-6 py-3 font-medium text-primary-300">Type</th>
                <th className="text-left px-4 py-3 font-medium text-primary-300">Description</th>
                <th className="text-left px-4 py-3 font-medium text-primary-300">Date</th>
                <th className="text-right px-6 py-3 font-medium text-primary-300">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {allTransactions.map((tx, i) => {
                const isExpense = tx.type === 'expense'
                const exp = isExpense ? (tx as any) : null
                const inc = !isExpense ? (tx as any) : null
                const date = isExpense ? exp.expense_date : inc.income_date
                const amount = isExpense ? exp.amount : inc.amount
                const desc = isExpense ? exp.title : inc.source

                return (
                  <tr key={`${tx.type}-${tx.id}-${i}`} className="hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        isExpense
                          ? 'bg-red-900/40 text-red-300'
                          : 'bg-green-900/40 text-green-300'
                      }`}>
                        {isExpense ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                        {isExpense ? 'Expense' : 'Income'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-primary-100">{desc}</p>
                      {isExpense && exp.category_id && (
                        <p className="text-xs text-gray-500 mt-0.5">{catMap[exp.category_id] ?? '—'}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-300">{formatDate(date)}</td>
                    <td className={`px-6 py-4 text-right font-semibold ${
                      isExpense ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {isExpense ? '-' : '+'}{formatCurrency(amount)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          className="btn-ghost p-1.5 text-gray-400 hover:text-primary-600"
                          onClick={() => { setFormError(''); setEditing(tx) }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="btn-ghost p-1.5 text-gray-400 hover:text-red-600"
                          onClick={() => setDeleting(tx)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create expense modal */}
      <Modal open={formOpen === 'expense'} onClose={() => setFormOpen(null)} title="Add expense">
        <ExpenseForm
          categories={categories}
          onSubmit={handleCreateExpense}
          onCancel={() => setFormOpen(null)}
          loading={formLoading}
          error={formError}
        />
      </Modal>

      {/* Create income modal */}
      <Modal open={formOpen === 'income'} onClose={() => setFormOpen(null)} title="Add income">
        <IncomeForm
          onSubmit={handleCreateIncome}
          onCancel={() => setFormOpen(null)}
          loading={formLoading}
          error={formError}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit ${editing?.type === 'expense' ? 'expense' : 'income'}`}>
        {editing && editing.type === 'expense' && (
          <ExpenseForm
            categories={categories}
            defaultValues={{
              title: (editing as any).title,
              amount: (editing as any).amount,
              currency: (editing as any).currency,
              expense_date: (editing as any).expense_date,
              payment_method: (editing as any).payment_method,
              category_id: (editing as any).category_id,
            }}
            onSubmit={(form) => handleEdit(form)}
            onCancel={() => setEditing(null)}
            loading={formLoading}
            error={formError}
          />
        )}
        {editing && editing.type === 'income' && (
          <IncomeForm
            defaultValues={{
              source: (editing as any).source,
              amount: (editing as any).amount,
              currency: (editing as any).currency,
              income_date: (editing as any).income_date,
            }}
            onSubmit={(form) => handleEdit(form)}
            onCancel={() => setEditing(null)}
            loading={formLoading}
            error={formError}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete transaction"
        message={`Delete this ${deleting?.type}? This cannot be undone.`}
        loading={deleteLoading}
      />

      {/* Export dialog */}
      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={handleExport}
        loading={exportLoading}
      />
    </div>
  )
}

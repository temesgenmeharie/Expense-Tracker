import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, SlidersHorizontal, X, Download } from 'lucide-react'
import { useForm } from 'react-hook-form'
import api from '../lib/api'
import { formatCurrency, formatDate, getErrorMessage } from '../lib/utils'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import type {
  Category, Expense, ExpenseCreate, ExpenseFilters, PaginatedExpenses, PaymentMethod,
} from '../types'

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash',           label: 'Cash' },
  { value: 'credit_card',    label: 'Credit Card' },
  { value: 'debit_card',     label: 'Debit Card' },
  { value: 'bank_transfer',  label: 'Bank Transfer' },
  { value: 'mobile_payment', label: 'Mobile Payment' },
  { value: 'other',          label: 'Other' },
]

const PM_COLORS: Record<string, string> = {
  cash:           'bg-green-100 text-green-700',
  credit_card:    'bg-purple-100 text-purple-700',
  debit_card:     'bg-blue-100 text-blue-700',
  bank_transfer:  'bg-orange-100 text-orange-700',
  mobile_payment: 'bg-pink-100 text-pink-700',
  other:          'bg-gray-100 text-gray-600',
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

      {/* Title */}
      <div>
        <label className="label">Title *</label>
        <input className="input" placeholder="e.g. Monthly Rent"
          {...register('title', { required: 'Title is required' })} />
        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
      </div>

      {/* Amount + Currency */}
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

      {/* Date */}
      <div>
        <label className="label">Date *</label>
        <input type="date" className="input"
          {...register('expense_date', { required: 'Date is required' })} />
        {errors.expense_date && <p className="mt-1 text-xs text-red-600">{errors.expense_date.message}</p>}
      </div>

      {/* Category + Payment */}
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

      {/* Description */}
      <div>
        <label className="label">Description</label>
        <input className="input" placeholder="Short description" {...register('description')} />
      </div>

      {/* Notes */}
      <div>
        <label className="label">Notes</label>
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="Additional details, receipts info…"
          {...register('notes')}
        />
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

// ── Filters Bar ───────────────────────────────────────────────────────────────
function FiltersBar({
  categories,
  filters,
  onChange,
  onReset,
}: {
  categories: Category[]
  filters: ExpenseFilters
  onChange: (f: Partial<ExpenseFilters>) => void
  onReset: () => void
}) {
  const [open, setOpen] = useState(false)
  const active = Object.values(filters).some(v => v !== undefined && v !== '' && v !== 1 && v !== 10)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        className={`btn-secondary gap-1.5 ${active ? 'border-primary-500 text-primary-600' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <SlidersHorizontal size={15} />
        Filters
        {active && <span className="w-2 h-2 rounded-full bg-primary-500 inline-block" />}
      </button>

      {/* Sort */}
      <select
        className="input w-auto text-sm py-2"
        value={`${filters.sort_by ?? 'expense_date'}:${filters.sort_order ?? 'desc'}`}
        onChange={e => {
          const [sort_by, sort_order] = e.target.value.split(':') as [ExpenseFilters['sort_by'], ExpenseFilters['sort_order']]
          onChange({ sort_by, sort_order, page: 1 })
        }}
      >
        <option value="expense_date:desc">Date (newest)</option>
        <option value="expense_date:asc">Date (oldest)</option>
        <option value="amount:desc">Amount (high–low)</option>
        <option value="amount:asc">Amount (low–high)</option>
        <option value="created_at:desc">Added (newest)</option>
      </select>

      {active && (
        <button className="btn-ghost text-xs text-red-500 hover:text-red-700" onClick={onReset}>
          <X size={13} /> Clear filters
        </button>
      )}

      {/* Collapsible filter panel */}
      {open && (
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-white border border-gray-200 rounded-xl mt-1">
          <div>
            <label className="label text-xs">Category</label>
            <select className="input bg-white text-sm py-1.5" value={filters.category_id ?? ''}
              onChange={e => onChange({ category_id: e.target.value ? Number(e.target.value) : undefined, page: 1 })}>
              <option value="">All</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">From</label>
            <input type="date" className="input text-sm py-1.5" value={filters.date_from ?? ''}
              onChange={e => onChange({ date_from: e.target.value || undefined, page: 1 })} />
          </div>
          <div>
            <label className="label text-xs">To</label>
            <input type="date" className="input text-sm py-1.5" value={filters.date_to ?? ''}
              onChange={e => onChange({ date_to: e.target.value || undefined, page: 1 })} />
          </div>
          <div>
            <label className="label text-xs">Payment</label>
            <select className="input bg-white text-sm py-1.5" value={filters.payment_method ?? ''}
              onChange={e => onChange({ payment_method: (e.target.value as PaymentMethod) || undefined, page: 1 })}>
              <option value="">All</option>
              {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Min amount</label>
            <input type="number" min="0" step="0.01" className="input text-sm py-1.5" value={filters.min_amount ?? ''}
              onChange={e => onChange({ min_amount: e.target.value ? Number(e.target.value) : undefined, page: 1 })} />
          </div>
          <div>
            <label className="label text-xs">Max amount</label>
            <input type="number" min="0" step="0.01" className="input text-sm py-1.5" value={filters.max_amount ?? ''}
              onChange={e => onChange({ max_amount: e.target.value ? Number(e.target.value) : undefined, page: 1 })} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const DEFAULT_FILTERS: ExpenseFilters = { page: 1, page_size: 10, sort_by: 'expense_date', sort_order: 'desc' }

export default function ExpensesPage() {
  const [data, setData] = useState<PaginatedExpenses | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState<ExpenseFilters>(DEFAULT_FILTERS)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState<Expense | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const loadExpenses = useCallback(() => {
    setLoading(true)
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
    )
    api.get<PaginatedExpenses>('/expenses', { params })
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => {
    api.get<Category[]>('/categories').then(r => setCategories(r.data))
  }, [])

  useEffect(() => { loadExpenses() }, [loadExpenses])

  const updateFilters = (partial: Partial<ExpenseFilters>) =>
    setFilters(prev => ({ ...prev, ...partial }))

  const handleCreate = async (form: ExpenseCreate) => {
    setFormLoading(true); setFormError('')
    try {
      await api.post('/expenses', form)
      setFormOpen(false)
      loadExpenses()
    } catch (e) { setFormError(getErrorMessage(e)) }
    finally { setFormLoading(false) }
  }

  const handleEdit = async (form: ExpenseCreate) => {
    if (!editing) return
    setFormLoading(true); setFormError('')
    try {
      await api.patch(`/expenses/${editing.id}`, form)
      setEditing(null)
      loadExpenses()
    } catch (e) { setFormError(getErrorMessage(e)) }
    finally { setFormLoading(false) }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await api.delete(`/expenses/${deleting.id}`)
      setDeleting(null)
      loadExpenses()
    } catch (e) { console.error(e) }
    finally { setDeleteLoading(false) }
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    const f = filters
    if (f.category_id)     params.set('category_id',    String(f.category_id))
    if (f.date_from)       params.set('date_from',       f.date_from)
    if (f.date_to)         params.set('date_to',         f.date_to)
    if (f.min_amount)      params.set('min_amount',      String(f.min_amount))
    if (f.max_amount)      params.set('max_amount',      String(f.max_amount))
    if (f.payment_method)  params.set('payment_method',  f.payment_method)
    if (f.sort_by)         params.set('sort_by',         f.sort_by)
    if (f.sort_order)      params.set('sort_order',      f.sort_order)
    const token = localStorage.getItem('access_token')
    const url = `/api/v1/expenses/export?${params.toString()}`
    // Use fetch so we can attach auth header, then trigger download
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `expenses_${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(a.href)
      })
  }

  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

  return (
    <div className="p-8 h-full bg-gray-50 dark:bg-[#25272e]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Expenses</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
            {data ? `${data.total} total expense${data.total !== 1 ? 's' : ''}` : '…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={handleExport} title="Export current view as CSV">
            <Download size={16} /> Export CSV
          </button>
          <button className="btn-primary" onClick={() => { setFormError(''); setFormOpen(true) }}>
            <Plus size={16} /> Add expense
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <FiltersBar
          categories={categories}
          filters={filters}
          onChange={updateFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/6 ml-auto" />
              </div>
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <p className="text-lg font-medium">No expenses found</p>
            <p className="text-sm mt-1">Try adjusting your filters or add a new expense.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full text-sm hidden md:table">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#2b2e33] border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Payment</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data?.items.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{exp.title}</p>
                      {exp.description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-xs">{exp.description}</p>}
                      {exp.notes && (
                        <p className="text-xs text-blue-400 mt-0.5 truncate max-w-xs" title={exp.notes}>
                          📝 {exp.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-300">
                      {exp.category_id ? catMap[exp.category_id] ?? '—' : '—'}
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-300">{formatDate(exp.expense_date)}</td>
                    <td className="px-4 py-4">
                      {exp.payment_method ? (
                        <span className={`badge ${PM_COLORS[exp.payment_method] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
                          {exp.payment_method.replace('_', ' ')}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(exp.amount, exp.currency)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          className="btn-ghost p-1.5 text-gray-400 hover:text-primary-600"
                          onClick={() => { setFormError(''); setEditing(exp) }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="btn-ghost p-1.5 text-gray-400 hover:text-red-600"
                          onClick={() => setDeleting(exp)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
              {data?.items.map(exp => (
                <div key={exp.id} className="px-4 py-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{exp.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(exp.expense_date)}</p>
                    {exp.category_id && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{catMap[exp.category_id]}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(exp.amount, exp.currency)}</span>
                    <div className="flex gap-1">
                      <button className="btn-ghost p-1 text-gray-400 hover:text-primary-600"
                        onClick={() => { setFormError(''); setEditing(exp) }}><Pencil size={14} /></button>
                      <button className="btn-ghost p-1 text-gray-400 hover:text-red-600"
                        onClick={() => setDeleting(exp)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Page {data.page} of {data.pages} &middot; {data.total} results
          </p>
          <div className="flex gap-2">
            <button
              className="btn-secondary py-1.5 px-3"
              disabled={data.page <= 1}
              onClick={() => updateFilters({ page: data.page - 1 })}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="btn-secondary py-1.5 px-3"
              disabled={data.page >= data.pages}
              onClick={() => updateFilters({ page: data.page + 1 })}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Create modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Add expense">
        <ExpenseForm
          categories={categories}
          onSubmit={handleCreate}
          onCancel={() => setFormOpen(false)}
          loading={formLoading}
          error={formError}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit expense">
        {editing && (
          <ExpenseForm
            categories={categories}
            defaultValues={{
              title: editing.title,
              description: editing.description,
              notes: editing.notes,
              amount: editing.amount,
              currency: editing.currency,
              expense_date: editing.expense_date,
              payment_method: editing.payment_method,
              category_id: editing.category_id,
            }}
            onSubmit={handleEdit}
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
        title="Delete expense"
        message={`Delete "${deleting?.title}"? This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  )
}

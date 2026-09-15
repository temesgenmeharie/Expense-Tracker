import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import api from '../lib/api'
import { formatCurrency, getErrorMessage } from '../lib/utils'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import type { BudgetCreate, BudgetUpdate, BudgetWithSpend, Category } from '../types'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

// ── Progress bar ──────────────────────────────────────────────────────────────
function BudgetBar({ pct, isOver }: { pct: number; isOver: boolean }) {
  const capped = Math.min(pct, 100)
  const color  = isOver
    ? 'bg-red-500'
    : pct >= 80
    ? 'bg-orange-400'
    : 'bg-primary-500'

  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{pct.toFixed(1)}% used</span>
        {isOver && (
          <span className="flex items-center gap-1 text-red-500 font-medium">
            <AlertTriangle size={11} /> Over budget
          </span>
        )}
        {!isOver && pct < 80 && (
          <span className="flex items-center gap-1 text-green-600 font-medium">
            <CheckCircle size={11} /> On track
          </span>
        )}
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${capped}%` }}
        />
      </div>
    </div>
  )
}

// ── Budget card ───────────────────────────────────────────────────────────────
function BudgetCard({
  b,
  onEdit,
  onDelete,
}: {
  b: BudgetWithSpend
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className={`card p-5 ${b.is_over ? 'border-red-200 bg-red-50/30' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{b.category_name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {MONTH_NAMES[b.month - 1]} {b.year}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button className="btn-ghost p-1.5 text-gray-400 hover:text-primary-600" onClick={onEdit}>
            <Pencil size={14} />
          </button>
          <button className="btn-ghost p-1.5 text-gray-400 hover:text-red-600" onClick={onDelete}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-gray-500">Spent</p>
          <p className={`font-bold text-sm mt-0.5 ${b.is_over ? 'text-red-600' : 'text-gray-900'}`}>
            {formatCurrency(b.spent)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Limit</p>
          <p className="font-bold text-sm text-gray-900 mt-0.5">{formatCurrency(b.limit_amount)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Remaining</p>
          <p className={`font-bold text-sm mt-0.5 ${Number(b.remaining) < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(b.remaining)}
          </p>
        </div>
      </div>

      <BudgetBar pct={b.percentage} isOver={b.is_over} />
    </div>
  )
}

// ── Create / Edit Form ────────────────────────────────────────────────────────
function BudgetForm({
  categories,
  defaultValues,
  isEdit,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  categories: Category[]
  defaultValues?: Partial<BudgetCreate>
  isEdit?: boolean
  onSubmit: (d: BudgetCreate) => void
  onCancel: () => void
  loading: boolean
  error: string
}) {
  const now = new Date()
  const { register, handleSubmit, formState: { errors } } = useForm<BudgetCreate>({
    defaultValues: {
      year:  now.getFullYear(),
      month: now.getMonth() + 1,
      category_id: null,
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!isEdit && (
        <>
          <div>
            <label className="label">Category</label>
            <select className="input bg-white"
              {...register('category_id', { setValueAs: v => (v === '' || v === 'null') ? null : Number(v) })}>
              <option value="null">Overall (all categories)</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Year *</label>
              <input type="number" className="input"
                {...register('year', { required: true, valueAsNumber: true, min: 2000, max: 2100 })} />
            </div>
            <div>
              <label className="label">Month *</label>
              <select className="input bg-white" {...register('month', { valueAsNumber: true })}>
                {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>
        </>
      )}

      <div>
        <label className="label">Budget limit *</label>
        <input type="number" step="0.01" min="0.01" className="input" placeholder="0.00"
          {...register('limit_amount', {
            required: 'Limit is required',
            min: { value: 0.01, message: 'Must be > 0' },
          })} />
        {errors.limit_amount && <p className="mt-1 text-xs text-red-600">{errors.limit_amount.message}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving…' : isEdit ? 'Update limit' : 'Create budget'}
        </button>
      </div>
    </form>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BudgetsPage() {
  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const [budgets, setBudgets]         = useState<BudgetWithSpend[]>([])
  const [categories, setCategories]   = useState<Category[]>([])
  const [loading, setLoading]         = useState(true)
  const [formOpen, setFormOpen]       = useState(false)
  const [editing, setEditing]         = useState<BudgetWithSpend | null>(null)
  const [deleting, setDeleting]       = useState<BudgetWithSpend | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formError, setFormError]     = useState('')

  const load = () => {
    setLoading(true)
    api.get<BudgetWithSpend[]>('/budgets', { params: { year, month } })
      .then(r => setBudgets(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { api.get<Category[]>('/categories').then(r => setCategories(r.data)) }, [])
  useEffect(() => { load() }, [year, month]) // eslint-disable-line react-hooks/exhaustive-deps

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 12) { setMonth(1);  setYear(y => y + 1) } else setMonth(m => m + 1) }

  const handleCreate = async (form: BudgetCreate) => {
    setFormLoading(true); setFormError('')
    try {
      await api.post('/budgets', { ...form, limit_amount: String(form.limit_amount) })
      setFormOpen(false); load()
    } catch (e) { setFormError(getErrorMessage(e)) }
    finally { setFormLoading(false) }
  }

  const handleEdit = async (form: BudgetCreate) => {
    if (!editing) return
    setFormLoading(true); setFormError('')
    const update: BudgetUpdate = { limit_amount: String(form.limit_amount) }
    try {
      await api.patch(`/budgets/${editing.id}`, update)
      setEditing(null); load()
    } catch (e) { setFormError(getErrorMessage(e)) }
    finally { setFormLoading(false) }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try { await api.delete(`/budgets/${deleting.id}`); setDeleting(null); load() }
    catch (e) { console.error(e) }
    finally { setDeleteLoading(false) }
  }

  const overCount  = budgets.filter(b => b.is_over).length
  const warnCount  = budgets.filter(b => !b.is_over && b.percentage >= 80).length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            {budgets.length} budget{budgets.length !== 1 ? 's' : ''}
            {overCount > 0 && <span className="ml-2 text-red-500 font-medium">· {overCount} over limit</span>}
            {warnCount > 0 && <span className="ml-2 text-orange-500 font-medium">· {warnCount} near limit</span>}
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setFormError(''); setFormOpen(true) }}>
          <Plus size={16} /> New budget
        </button>
      </div>

      {/* Month nav */}
      <div className="flex items-center gap-3 mb-6">
        <button className="btn-secondary py-1.5 px-3" onClick={prevMonth}><ChevronLeft size={16} /></button>
        <span className="text-sm font-semibold text-gray-700 w-36 text-center">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button className="btn-secondary py-1.5 px-3" onClick={nextMonth}><ChevronRight size={16} /></button>
      </div>

      {/* Budgets grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 h-40 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-lg font-medium">No budgets for this month</p>
          <p className="text-sm mt-1">Create a budget to track your spending.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map(b => (
            <BudgetCard
              key={b.id}
              b={b}
              onEdit={() => { setFormError(''); setEditing(b) }}
              onDelete={() => setDeleting(b)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="New budget">
        <BudgetForm
          categories={categories}
          defaultValues={{ year, month }}
          onSubmit={handleCreate}
          onCancel={() => setFormOpen(false)}
          loading={formLoading}
          error={formError}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit budget limit">
        {editing && (
          <BudgetForm
            categories={categories}
            isEdit
            defaultValues={{ limit_amount: editing.limit_amount }}
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
        title="Delete budget"
        message={`Remove budget for "${deleting?.category_name}"? This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  )
}

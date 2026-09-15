import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import api from '../lib/api'
import { formatCurrency, formatDate, getErrorMessage } from '../lib/utils'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import type { Income, IncomeCreate, IncomeFilters, PaginatedIncomes } from '../types'

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
        <input className="input" placeholder="e.g. Salary, Freelance, Rental…"
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
          <input className="input" placeholder="USD" maxLength={3} {...register('currency')} />
        </div>
      </div>
      <div>
        <label className="label">Date *</label>
        <input type="date" className="input"
          {...register('income_date', { required: 'Date is required' })} />
        {errors.income_date && <p className="mt-1 text-xs text-red-600">{errors.income_date.message}</p>}
      </div>
      <div>
        <label className="label">Description</label>
        <input className="input" placeholder="Optional note" {...register('description')} />
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

// ── Filters Bar ───────────────────────────────────────────────────────────────
function FiltersBar({
  filters,
  onChange,
  onReset,
}: {
  filters: IncomeFilters
  onChange: (f: Partial<IncomeFilters>) => void
  onReset: () => void
}) {
  const [open, setOpen] = useState(false)
  const active = !!(filters.date_from || filters.date_to || filters.source_search || filters.min_amount || filters.max_amount)

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
        value={`${filters.sort_by ?? 'income_date'}:${filters.sort_order ?? 'desc'}`}
        onChange={e => {
          const [sort_by, sort_order] = e.target.value.split(':') as [IncomeFilters['sort_by'], IncomeFilters['sort_order']]
          onChange({ sort_by, sort_order, page: 1 })
        }}
      >
        <option value="income_date:desc">Date (newest)</option>
        <option value="income_date:asc">Date (oldest)</option>
        <option value="amount:desc">Amount (high–low)</option>
        <option value="amount:asc">Amount (low–high)</option>
        <option value="source:asc">Source (A–Z)</option>
        <option value="source:desc">Source (Z–A)</option>
      </select>

      {active && (
        <button className="btn-ghost text-xs text-red-500 hover:text-red-700" onClick={onReset}>
          <X size={13} /> Clear filters
        </button>
      )}

      {open && (
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-white border border-gray-200 rounded-xl mt-1">
          <div>
            <label className="label text-xs">Source search</label>
            <input className="input text-sm py-1.5" placeholder="e.g. Salary"
              value={filters.source_search ?? ''}
              onChange={e => onChange({ source_search: e.target.value || undefined, page: 1 })} />
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
            <label className="label text-xs">Min amount</label>
            <input type="number" min="0" step="0.01" className="input text-sm py-1.5"
              value={filters.min_amount ?? ''}
              onChange={e => onChange({ min_amount: e.target.value ? Number(e.target.value) : undefined, page: 1 })} />
          </div>
          <div>
            <label className="label text-xs">Max amount</label>
            <input type="number" min="0" step="0.01" className="input text-sm py-1.5"
              value={filters.max_amount ?? ''}
              onChange={e => onChange({ max_amount: e.target.value ? Number(e.target.value) : undefined, page: 1 })} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const DEFAULT_FILTERS: IncomeFilters = {
  page: 1, page_size: 10, sort_by: 'income_date', sort_order: 'desc',
}

export default function IncomesPage() {
  const [data, setData]               = useState<PaginatedIncomes | null>(null)
  const [filters, setFilters]         = useState<IncomeFilters>(DEFAULT_FILTERS)
  const [loading, setLoading]         = useState(true)
  const [formOpen, setFormOpen]       = useState(false)
  const [editing, setEditing]         = useState<Income | null>(null)
  const [deleting, setDeleting]       = useState<Income | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formError, setFormError]     = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
    )
    api.get<PaginatedIncomes>('/incomes', { params })
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => { load() }, [load])

  const updateFilters = (partial: Partial<IncomeFilters>) =>
    setFilters(prev => ({ ...prev, ...partial }))

  const handleCreate = async (form: IncomeCreate) => {
    setFormLoading(true); setFormError('')
    try {
      await api.post('/incomes', form)
      setFormOpen(false)
      updateFilters({ page: 1 })
    } catch (e) { setFormError(getErrorMessage(e)) }
    finally { setFormLoading(false) }
  }

  const handleEdit = async (form: IncomeCreate) => {
    if (!editing) return
    setFormLoading(true); setFormError('')
    try {
      await api.patch(`/incomes/${editing.id}`, form)
      setEditing(null)
      load()
    } catch (e) { setFormError(getErrorMessage(e)) }
    finally { setFormLoading(false) }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await api.delete(`/incomes/${deleting.id}`)
      setDeleting(null)
      load()
    } catch (e) { console.error(e) }
    finally { setDeleteLoading(false) }
  }

  const pageTotal = data?.items.reduce((s, i) => s + Number(i.amount), 0) ?? 0

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Income</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            {data ? `${data.total} record${data.total !== 1 ? 's' : ''}` : '…'}
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setFormError(''); setFormOpen(true) }}>
          <Plus size={16} /> Add income
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <FiltersBar
          filters={filters}
          onChange={updateFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />
      </div>

      {/* Summary strip */}
      {data && data.items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Page total</p>
            <p className="mt-1 text-xl font-bold text-green-600">{formatCurrency(pageTotal)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Matching records</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{data.total}</p>
          </div>
          <div className="card p-4 hidden sm:block">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Page</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{data.page} / {data.total_pages}</p>
          </div>
        </div>
      )}

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
            <p className="text-lg font-medium">No income records found</p>
            <p className="text-sm mt-1">Try adjusting your filters or add a new entry.</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <table className="w-full text-sm hidden md:table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Description</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Amount</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.items.map(inc => (
                  <tr key={inc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{inc.source}</td>
                    <td className="px-4 py-4 text-gray-600">{formatDate(inc.income_date)}</td>
                    <td className="px-4 py-4 text-gray-500 max-w-xs truncate">{inc.description || '—'}</td>
                    <td className="px-6 py-4 text-right font-semibold text-green-600">
                      {formatCurrency(inc.amount, inc.currency)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button className="btn-ghost p-1.5 text-gray-400 hover:text-primary-600"
                          onClick={() => { setFormError(''); setEditing(inc) }}>
                          <Pencil size={15} />
                        </button>
                        <button className="btn-ghost p-1.5 text-gray-400 hover:text-red-600"
                          onClick={() => setDeleting(inc)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-gray-100">
              {data?.items.map(inc => (
                <div key={inc.id} className="px-4 py-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{inc.source}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(inc.income_date)}</p>
                    {inc.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{inc.description}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="font-semibold text-green-600">{formatCurrency(inc.amount, inc.currency)}</span>
                    <div className="flex gap-1">
                      <button className="btn-ghost p-1 text-gray-400 hover:text-primary-600"
                        onClick={() => { setFormError(''); setEditing(inc) }}><Pencil size={14} /></button>
                      <button className="btn-ghost p-1 text-gray-400 hover:text-red-600"
                        onClick={() => setDeleting(inc)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Page {data.page} of {data.total_pages} &middot; {data.total} records
          </p>
          <div className="flex gap-2">
            <button className="btn-secondary py-1.5 px-3" disabled={(filters.page ?? 1) <= 1}
              onClick={() => updateFilters({ page: (filters.page ?? 1) - 1 })}>
              <ChevronLeft size={16} />
            </button>
            <button className="btn-secondary py-1.5 px-3" disabled={(filters.page ?? 1) >= data.total_pages}
              onClick={() => updateFilters({ page: (filters.page ?? 1) + 1 })}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Create modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Add income">
        <IncomeForm onSubmit={handleCreate} onCancel={() => setFormOpen(false)}
          loading={formLoading} error={formError} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit income">
        {editing && (
          <IncomeForm
            defaultValues={{
              source: editing.source, amount: editing.amount,
              currency: editing.currency, income_date: editing.income_date,
              description: editing.description,
            }}
            onSubmit={handleEdit} onCancel={() => setEditing(null)}
            loading={formLoading} error={formError}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete income"
        message={`Delete income from "${deleting?.source}"? This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  )
}

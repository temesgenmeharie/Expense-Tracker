import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import api from '../lib/api'
import { formatCurrency, formatDate, getErrorMessage } from '../lib/utils'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import type { Income, IncomeCreate, PaginatedIncomes } from '../types'

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
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Source */}
      <div>
        <label className="label">Source *</label>
        <input
          className="input"
          placeholder="e.g. Salary, Freelance, Rental…"
          {...register('source', { required: 'Source is required' })}
        />
        {errors.source && <p className="mt-1 text-xs text-red-600">{errors.source.message}</p>}
      </div>

      {/* Amount + Currency */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount *</label>
          <input
            type="number" step="0.01" min="0"
            className="input" placeholder="0.00"
            {...register('amount', {
              required: 'Amount is required',
              min: { value: 0.01, message: 'Must be > 0' },
            })}
          />
          {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="label">Currency</label>
          <input className="input" placeholder="USD" maxLength={3} {...register('currency')} />
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="label">Date *</label>
        <input
          type="date" className="input"
          {...register('income_date', { required: 'Date is required' })}
        />
        {errors.income_date && (
          <p className="mt-1 text-xs text-red-600">{errors.income_date.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="label">Description</label>
        <input className="input" placeholder="Optional note" {...register('description')} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving…' : 'Save income'}
        </button>
      </div>
    </form>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10

export default function IncomesPage() {
  const [data, setData]           = useState<PaginatedIncomes | null>(null)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [formOpen, setFormOpen]   = useState(false)
  const [editing, setEditing]     = useState<Income | null>(null)
  const [deleting, setDeleting]   = useState<Income | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api.get<PaginatedIncomes>('/incomes', { params: { page, page_size: PAGE_SIZE } })
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  const handleCreate = async (form: IncomeCreate) => {
    setFormLoading(true); setFormError('')
    try {
      await api.post('/incomes', form)
      setFormOpen(false)
      if (page !== 1) setPage(1); else load()
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

  // Running total of current page
  const pageTotal = data?.items.reduce((sum, i) => sum + Number(i.amount), 0) ?? 0

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
        <button
          className="btn-primary"
          onClick={() => { setFormError(''); setFormOpen(true) }}
        >
          <Plus size={16} /> Add income
        </button>
      </div>

      {/* Summary strip */}
      {data && data.items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">This page total</p>
            <p className="mt-1 text-xl font-bold text-green-600">{formatCurrency(pageTotal)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Records</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{data.total}</p>
          </div>
          <div className="card p-4 hidden sm:block">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Page</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{data.page} / {data.pages}</p>
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
            <p className="text-lg font-medium">No income records yet</p>
            <p className="text-sm mt-1">Add your first income entry to get started.</p>
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
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{inc.source}</span>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{formatDate(inc.income_date)}</td>
                    <td className="px-4 py-4 text-gray-500 max-w-xs truncate">
                      {inc.description || '—'}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-green-600">
                      {formatCurrency(inc.amount, inc.currency)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          className="btn-ghost p-1.5 text-gray-400 hover:text-primary-600"
                          onClick={() => { setFormError(''); setEditing(inc) }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="btn-ghost p-1.5 text-gray-400 hover:text-red-600"
                          onClick={() => setDeleting(inc)}
                        >
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
                    {inc.description && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{inc.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="font-semibold text-green-600">
                      {formatCurrency(inc.amount, inc.currency)}
                    </span>
                    <div className="flex gap-1">
                      <button
                        className="btn-ghost p-1 text-gray-400 hover:text-primary-600"
                        onClick={() => { setFormError(''); setEditing(inc) }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="btn-ghost p-1 text-gray-400 hover:text-red-600"
                        onClick={() => setDeleting(inc)}
                      >
                        <Trash2 size={14} />
                      </button>
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
            Page {data.page} of {data.pages} &middot; {data.total} records
          </p>
          <div className="flex gap-2">
            <button
              className="btn-secondary py-1.5 px-3"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="btn-secondary py-1.5 px-3"
              disabled={page >= data.pages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Create modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Add income">
        <IncomeForm
          onSubmit={handleCreate}
          onCancel={() => setFormOpen(false)}
          loading={formLoading}
          error={formError}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit income">
        {editing && (
          <IncomeForm
            defaultValues={{
              source:      editing.source,
              amount:      editing.amount,
              currency:    editing.currency,
              income_date: editing.income_date,
              description: editing.description,
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
        title="Delete income"
        message={`Delete income from "${deleting?.source}"? This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  )
}

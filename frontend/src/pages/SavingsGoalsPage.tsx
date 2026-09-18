import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, TrendingUp, PiggyBank } from 'lucide-react'
import { useForm } from 'react-hook-form'
import api from '../lib/api'
import { formatCurrency, formatDate, getErrorMessage } from '../lib/utils'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import type { SavingsGoal, SavingsGoalCreate, SavingsGoalUpdate, SavingsGoalContribute } from '../types'

// ── Goal Form ─────────────────────────────────────────────────────────────────
function GoalForm({
  defaultValues,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  defaultValues?: Partial<SavingsGoalCreate>
  onSubmit: (data: SavingsGoalCreate) => void
  onCancel: () => void
  loading: boolean
  error: string
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<SavingsGoalCreate>({
    defaultValues: {
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label className="label">Goal Name *</label>
        <input className="input" placeholder="e.g. New Car, Emergency Fund"
          {...register('name', { required: 'Name is required' })} />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Target Amount *</label>
          <input type="number" step="0.01" min="0.01" className="input" placeholder="0.00"
            {...register('target_amount', { required: 'Target amount is required', min: { value: 0.01, message: 'Must be > 0' } })} />
          {errors.target_amount && <p className="mt-1 text-xs text-red-600">{errors.target_amount.message}</p>}
        </div>
        <div>
          <label className="label">Current Amount</label>
          <input type="number" step="0.01" min="0" className="input" placeholder="0.00"
            {...register('current_amount')} />
        </div>
      </div>

      <div>
        <label className="label">Target Date</label>
        <input type="date" className="input" {...register('target_date')} />
      </div>

      <div>
        <label className="label">Description</label>
        <input className="input" placeholder="Optional details..." {...register('description')} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving…' : 'Save Goal'}
        </button>
      </div>
    </form>
  )
}

// ── Contribute Form ───────────────────────────────────────────────────────────
function ContributeForm({
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  onSubmit: (data: SavingsGoalContribute) => void
  onCancel: () => void
  loading: boolean
  error: string
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<SavingsGoalContribute>()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label className="label">Amount to Add / Withdraw *</label>
        <input type="number" step="0.01" className="input" placeholder="e.g. 100 or -50"
          {...register('amount', { required: 'Amount is required' })} />
        {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
        <p className="text-xs text-gray-500 mt-1">Use a negative number to withdraw funds.</p>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
        <button type="submit" className="btn-primary bg-green-500 hover:bg-green-600" disabled={loading}>
          {loading ? 'Processing…' : 'Update Goal'}
        </button>
      </div>
    </form>
  )
}

export default function SavingsGoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<SavingsGoal | null>(null)
  const [contributing, setContributing] = useState<SavingsGoal | null>(null)
  const [deleting, setDeleting] = useState<SavingsGoal | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const loadGoals = useCallback(() => {
    setLoading(true)
    api.get<SavingsGoal[]>('/savings-goals')
      .then(r => setGoals(r.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadGoals() }, [loadGoals])

  const handleCreate = async (form: SavingsGoalCreate) => {
    setFormLoading(true); setFormError('')
    try {
      await api.post('/savings-goals', form)
      setFormOpen(false)
      loadGoals()
    } catch (e) { setFormError(getErrorMessage(e)) }
    finally { setFormLoading(false) }
  }

  const handleEdit = async (form: SavingsGoalCreate) => {
    if (!editing) return
    setFormLoading(true); setFormError('')
    try {
      await api.patch(`/savings-goals/${editing.id}`, form as SavingsGoalUpdate)
      setEditing(null)
      loadGoals()
    } catch (e) { setFormError(getErrorMessage(e)) }
    finally { setFormLoading(false) }
  }

  const handleContribute = async (form: SavingsGoalContribute) => {
    if (!contributing) return
    setFormLoading(true); setFormError('')
    try {
      await api.post(`/savings-goals/${contributing.id}/contribute`, form)
      setContributing(null)
      loadGoals()
    } catch (e) { setFormError(getErrorMessage(e)) }
    finally { setFormLoading(false) }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await api.delete(`/savings-goals/${deleting.id}`)
      setDeleting(null)
      loadGoals()
    } catch (e) { console.error(e) }
    finally { setDeleteLoading(false) }
  }

  return (
    <div className="p-8 h-full bg-gray-50 dark:bg-[#25272e]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Savings Goals</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">Track your savings targets</p>
        </div>
        <button className="btn-primary py-2 px-4" onClick={() => { setFormError(''); setFormOpen(true) }}>
          <Plus size={16} /> Add Goal
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 h-40 animate-pulse bg-gray-200 dark:bg-gray-800 border-none" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <PiggyBank size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No savings goals yet</p>
          <p className="text-sm mt-1">Set a goal to start tracking your savings!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map(goal => {
            const target = Number(goal.target_amount)
            const current = Number(goal.current_amount)
            const percentage = Math.min((current / target) * 100, 100)
            
            let daysLeftText = ''
            if (goal.target_date) {
              const targetDate = new Date(goal.target_date)
              const today = new Date()
              const diffTime = targetDate.getTime() - today.getTime()
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
              if (diffDays > 0) {
                daysLeftText = `${diffDays} days left`
              } else if (diffDays === 0) {
                daysLeftText = 'Due today'
              } else {
                daysLeftText = 'Overdue'
              }
            }

            return (
              <div key={goal.id} className="card p-5 bg-white dark:bg-[#2b2e33] border-none rounded-xl relative group">
                <div className="flex justify-between items-start mb-4">
                  <div className="pr-12">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{goal.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Target: {formatCurrency(target)}</p>
                  </div>
                  {daysLeftText && (
                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full whitespace-nowrap">
                      {daysLeftText}
                    </span>
                  )}
                </div>

                <div className="mt-6">
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-primary-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-2 font-medium">
                    <span>Saved: {formatCurrency(current)} ({percentage.toFixed(1)}%)</span>
                    {goal.target_date && <span>{formatDate(goal.target_date)}</span>}
                  </div>
                </div>

                <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="btn-ghost p-1 text-gray-400 hover:text-green-500 bg-white/80 dark:bg-gray-900/80 rounded backdrop-blur mr-1"
                     title="Add Funds"
                     onClick={() => { setFormError(''); setContributing(goal) }}>
                    <TrendingUp size={14} />
                  </button>
                  <button className="btn-ghost p-1 text-gray-400 hover:text-primary-500 bg-white/80 dark:bg-gray-900/80 rounded backdrop-blur mr-1"
                    title="Edit Goal"
                    onClick={() => { setFormError(''); setEditing(goal) }}>
                    <Pencil size={14} />
                  </button>
                  <button className="btn-ghost p-1 text-gray-400 hover:text-red-500 bg-white/80 dark:bg-gray-900/80 rounded backdrop-blur"
                    title="Delete Goal"
                    onClick={() => setDeleting(goal)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Add Savings Goal">
        <GoalForm onSubmit={handleCreate} onCancel={() => setFormOpen(false)}
          loading={formLoading} error={formError} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Savings Goal">
        {editing && (
          <GoalForm
            defaultValues={{
              name: editing.name,
              description: editing.description,
              target_amount: editing.target_amount,
              current_amount: editing.current_amount,
              target_date: editing.target_date,
            }}
            onSubmit={handleEdit} onCancel={() => setEditing(null)}
            loading={formLoading} error={formError}
          />
        )}
      </Modal>

      <Modal open={!!contributing} onClose={() => setContributing(null)} title={`Update Funds: ${contributing?.name}`}>
        {contributing && (
          <ContributeForm
            onSubmit={handleContribute} onCancel={() => setContributing(null)}
            loading={formLoading} error={formError}
          />
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Savings Goal"
        message={`Delete "${deleting?.name}"? All related data will be lost.`}
        loading={deleteLoading}
      />
    </div>
  )
}

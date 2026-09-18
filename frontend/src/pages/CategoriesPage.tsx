import { useEffect, useState } from 'react'
import { Plus, Pencil, Check, X, Trash2, Tag } from 'lucide-react'
import { useForm } from 'react-hook-form'
import api from '../lib/api'
import { getErrorMessage } from '../lib/utils'
import ConfirmDialog from '../components/ConfirmDialog'
import type { Category } from '../types'

// ── Inline rename row ─────────────────────────────────────────────────────────
function RenameRow({
  category,
  onSave,
  onCancel,
}: {
  category: Category
  onSave: (name: string) => Promise<void>
  onCancel: () => void
}) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ name: string }>({
    defaultValues: { name: category.name },
  })

  return (
    <form
      onSubmit={handleSubmit(d => onSave(d.name))}
      className="flex items-center gap-2 w-full"
    >
      <input
        autoFocus
        className="input py-1.5 text-sm flex-1"
        {...register('name', { required: true })}
      />
      <button type="submit" disabled={isSubmitting}
        className="btn-primary py-1.5 px-3 text-xs">
        <Check size={14} />
      </button>
      <button type="button" onClick={onCancel}
        className="btn-secondary py-1.5 px-3 text-xs">
        <X size={14} />
      </button>
    </form>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const [categories, setCategories]   = useState<Category[]>([])
  const [loading, setLoading]         = useState(true)
  const [renamingId, setRenamingId]   = useState<number | null>(null)
  const [deleting, setDeleting]       = useState<Category | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [createOpen, setCreateOpen]   = useState(false)
  const [createError, setCreateError] = useState('')

  const {
    register: regCreate,
    handleSubmit: handleCreate,
    reset: resetCreate,
    formState: { isSubmitting: creating },
  } = useForm<{ name: string }>()

  const load = () => {
    setLoading(true)
    api.get<Category[]>('/categories')
      .then(r => setCategories(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleRename = async (cat: Category, name: string) => {
    await api.patch(`/categories/${cat.id}`, { name })
    setRenamingId(null)
    load()
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await api.delete(`/categories/${deleting.id}`)
      setDeleting(null)
      load()
    } catch (e) {
      setDeleteError(getErrorMessage(e))
    } finally {
      setDeleteLoading(false)
    }
  }

  const onCreateSubmit = async (data: { name: string }) => {
    setCreateError('')
    try {
      await api.post('/categories', data)
      resetCreate()
      setCreateOpen(false)
      load()
    } catch (e) {
      setCreateError(getErrorMessage(e))
    }
  }

  // Colour palette cycling for category chips
  const CHIP_COLORS = [
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
    'bg-teal-100 text-teal-700',
    'bg-yellow-100 text-yellow-700',
    'bg-red-100 text-red-700',
    'bg-indigo-100 text-indigo-700',
    'bg-cyan-100 text-cyan-700',
  ]

  return (
    <div className="p-8 h-full bg-gray-50 dark:bg-[#25272e]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Categories</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
            {loading ? '…' : `${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'}`}
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setCreateError(''); setCreateOpen(true) }}>
          <Plus size={16} /> New category
        </button>
      </div>

      {/* Inline create form */}
      {createOpen && (
        <form
          onSubmit={handleCreate(onCreateSubmit)}
          className="card p-4 mb-5 flex flex-col sm:flex-row gap-3"
        >
          <div className="flex-1">
            <input
              autoFocus
              className="input"
              placeholder="Category name"
              {...regCreate('name', { required: 'Name is required' })}
            />
            {createError && (
              <p className="mt-1 text-xs text-red-600">{createError}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Adding…' : 'Add'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { resetCreate(); setCreateOpen(false) }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Categories grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="card p-4 h-16 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Tag size={40} className="mb-3 opacity-30" />
          <p className="text-lg font-medium">No categories yet</p>
          <p className="text-sm mt-1">Create your first category above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <div key={cat.id} className="card p-4 flex items-center gap-3 group">
              {/* Colour dot */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${CHIP_COLORS[i % CHIP_COLORS.length]}`}>
                <Tag size={14} />
              </div>

              {/* Name or rename form */}
              <div className="flex-1 min-w-0">
                {renamingId === cat.id ? (
                  <RenameRow
                    category={cat}
                    onSave={name => handleRename(cat, name)}
                    onCancel={() => setRenamingId(null)}
                  />
                ) : (
                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate block">{cat.name}</span>
                )}
              </div>

              {/* Actions — visible on hover */}
              {renamingId !== cat.id && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    className="btn-ghost p-1.5 text-gray-400 hover:text-primary-600"
                    title="Rename"
                    onClick={() => setRenamingId(cat.id)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="btn-ghost p-1.5 text-gray-400 hover:text-red-600"
                    title="Delete"
                    onClick={() => { setDeleteError(''); setDeleting(cat) }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete category"
        message={
          deleteError
            ? deleteError
            : `Delete "${deleting?.name}"? Expenses linked to this category will become uncategorised.`
        }
        loading={deleteLoading}
      />
    </div>
  )
}

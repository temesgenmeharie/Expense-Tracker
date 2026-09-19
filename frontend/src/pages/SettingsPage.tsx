import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { User, KeyRound, CheckCircle } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../lib/utils'
import type { PasswordChange, ProfileUpdate, TokenResponse } from '../types'

// ── Section card wrapper ──────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="card p-6 bg-dark-card border border-primary-800">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-primary-800">
        <div className="w-9 h-9 rounded-lg bg-primary-900 flex items-center justify-center">
          <Icon size={18} className="text-primary-300" />
        </div>
        <h2 className="font-semibold text-primary-300">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ── Profile section ───────────────────────────────────────────────────────────
function ProfileSection() {
  const { user, login } = useAuth()
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileUpdate>({
    defaultValues: { full_name: user?.full_name ?? '' },
  })

  const onSubmit = async (data: ProfileUpdate) => {
    setError(''); setSuccess(false)
    try {
      await api.patch('/auth/me', data)
      // Refresh the stored user without re-logging in — re-fetch /auth/me via login helper
      // Since login expects tokens, just update user directly via a token-preserving trick:
      const token = localStorage.getItem('access_token')!
      const refresh = localStorage.getItem('refresh_token')!
      await login({ access_token: token, refresh_token: refresh, token_type: 'bearer' } as TokenResponse)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  return (
    <Section title="Profile" icon={User}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
        {error && (
          <div className="rounded-lg bg-red-900/30 border border-red-700 px-4 py-3 text-sm text-red-300">{error}</div>
        )}
        {success && (
          <div className="rounded-lg bg-green-900/30 border border-green-700 px-4 py-3 text-sm text-green-300 flex items-center gap-2">
            <CheckCircle size={15} /> Profile updated successfully.
          </div>
        )}

        <div>
          <label className="label text-primary-200">Email</label>
          <input className="input bg-dark-inner cursor-not-allowed border-primary-800 text-gray-200" value={user?.email ?? ''} disabled />
          <p className="mt-1 text-xs text-gray-400">Email cannot be changed.</p>
        </div>

        <div>
          <label className="label text-primary-200">Full name</label>
          <input
            className="input text-gray-100"
            placeholder="Your name"
            {...register('full_name', { required: 'Full name is required', minLength: { value: 1, message: 'Cannot be empty' } })}
          />
          {errors.full_name && <p className="mt-1 text-xs text-red-400">{errors.full_name.message}</p>}
        </div>

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </Section>
  )
}

// ── Password section ──────────────────────────────────────────────────────────
function PasswordSection() {
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  const {
    register, handleSubmit, reset, watch,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChange & { confirm_password: string }>()

  const onSubmit = async ({ confirm_password: _cp, ...data }: PasswordChange & { confirm_password: string }) => {
    setError(''); setSuccess(false)
    try {
      await api.post('/auth/change-password', data)
      reset()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  return (
    <Section title="Change password" icon={KeyRound}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
        {error && (
          <div className="rounded-lg bg-red-900/30 border border-red-700 px-4 py-3 text-sm text-red-300">{error}</div>
        )}
        {success && (
          <div className="rounded-lg bg-green-900/30 border border-green-700 px-4 py-3 text-sm text-green-300 flex items-center gap-2">
            <CheckCircle size={15} /> Password changed successfully.
          </div>
        )}

        <div>
          <label className="label text-primary-200">Current password</label>
          <input
            type="password" className="input text-gray-100" placeholder="••••••••"
            {...register('current_password', { required: 'Current password is required' })}
          />
          {errors.current_password && <p className="mt-1 text-xs text-red-400">{errors.current_password.message}</p>}
        </div>

        <div>
          <label className="label text-primary-200">New password</label>
          <input
            type="password" className="input text-gray-100" placeholder="••••••••"
            {...register('new_password', {
              required: 'New password is required',
              minLength: { value: 8, message: 'At least 8 characters' },
              validate: v => /\d/.test(v) || 'Must contain at least one digit',
            })}
          />
          {errors.new_password && <p className="mt-1 text-xs text-red-400">{errors.new_password.message}</p>}
        </div>

        <div>
          <label className="label text-primary-200">Confirm new password</label>
          <input
            type="password" className="input text-gray-100" placeholder="••••••••"
            {...register('confirm_password', {
              required: 'Please confirm your password',
              validate: v => v === watch('new_password') || 'Passwords do not match',
            })}
          />
          {errors.confirm_password && <p className="mt-1 text-xs text-red-400">{errors.confirm_password.message}</p>}
        </div>

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </Section>
  )
}

// ── Account info section ──────────────────────────────────────────────────────
function AccountInfoSection() {
  const { user } = useAuth()
  if (!user) return null

  const joined = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="card p-6 bg-dark-card border border-primary-800">
      <h2 className="font-semibold text-primary-300 mb-4 pb-3 border-b border-primary-800">Account info</h2>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-400">Account ID</dt>
          <dd className="font-medium text-primary-200">#{user.id}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-400">Member since</dt>
          <dd className="font-medium text-primary-200">{joined}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-400">Status</dt>
          <dd>
            <span className={`badge ${user.is_active ? 'bg-green-900/40 text-green-300' : 'bg-gray-700 text-gray-300'}`}>
              {user.is_active ? 'Active' : 'Inactive'}
            </span>
          </dd>
        </div>
      </dl>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  return (
    <div className="p-8 max-w-2xl h-full bg-dark-bg dark:bg-dark-bg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-300">Settings</h1>
        <p className="text-gray-400 mt-0.5 text-sm">Manage your account details and security</p>
      </div>

      <div className="space-y-6">
        <AccountInfoSection />
        <ProfileSection />
        <PasswordSection />
      </div>
    </div>
  )
}

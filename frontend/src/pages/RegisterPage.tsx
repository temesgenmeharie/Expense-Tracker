import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Wallet } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../lib/utils'
import type { RegisterRequest, TokenResponse } from '../types'

type FormData = RegisterRequest & { confirmPassword: string }

export default function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>()
  const [serverError, setServerError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const onSubmit = async ({ confirmPassword: _cp, ...data }: FormData) => {
    setServerError('')
    try {
      await api.post('/auth/register', data)
      const res = await api.post<TokenResponse>('/auth/login', {
        email: data.email,
        password: data.password,
      })
      await login(res.data)
      navigate('/dashboard')
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 mb-4 shadow-lg">
            <Wallet size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-primary-300">Create account</h1>
          <p className="text-gray-400 mt-1">Start tracking your finances</p>
        </div>

        <div className="card p-8 bg-dark-card border border-primary-800">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {serverError && (
              <div className="rounded-lg bg-red-900/30 border border-red-700 px-4 py-3 text-sm text-red-300">
                {serverError}
              </div>
            )}

            <div>
              <label className="label">Full name</label>
              <input
                type="text"
                className="input"
                placeholder="Alice Smith"
                {...register('full_name', { required: 'Full name is required' })}
              />
              {errors.full_name && <p className="mt-1 text-xs text-red-400">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'At least 8 characters' },
                })}
              />
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Confirm password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (v) => v === watch('password') || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-300 hover:text-primary-200">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

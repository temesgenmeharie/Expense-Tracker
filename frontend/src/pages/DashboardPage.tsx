import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, Activity, Receipt } from 'lucide-react'
import api from '../lib/api'
import { formatCurrency } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import type { Dashboard } from '../types'

interface StatCardProps {
  title: string
  value: string
  icon: React.ElementType
  color: string
  bg: string
  sub?: string
}

function StatCard({ title, value, icon: Icon, color, bg, sub }: StatCardProps) {
  return (
    <div className="card p-6 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
      </div>
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${bg}`}>
        <Icon size={22} className={color} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Dashboard>('/reports/dashboard')
      .then((r) => setData(r.data))
      .finally(() => setLoading(false))
  }, [])

  const balance = data ? Number(data.balance) : 0

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Good day, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's your financial overview</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6 h-28 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            <StatCard
              title="Net Balance"
              value={formatCurrency(data?.balance ?? 0)}
              icon={Wallet}
              color={balance >= 0 ? 'text-primary-600' : 'text-red-600'}
              bg={balance >= 0 ? 'bg-primary-50' : 'bg-red-50'}
              sub={balance >= 0 ? "You're on track" : 'Expenses exceed income'}
            />
            <StatCard
              title="Total Income"
              value={formatCurrency(data?.total_income ?? 0)}
              icon={TrendingUp}
              color="text-green-600"
              bg="bg-green-50"
              sub={`${data?.income_count ?? 0} transactions`}
            />
            <StatCard
              title="Total Expenses"
              value={formatCurrency(data?.total_expenses ?? 0)}
              icon={TrendingDown}
              color="text-red-600"
              bg="bg-red-50"
              sub={`${data?.expense_count ?? 0} transactions`}
            />
            <StatCard
              title="Average Expense"
              value={formatCurrency(data?.average_expense ?? 0)}
              icon={Activity}
              color="text-violet-600"
              bg="bg-violet-50"
              sub="Per transaction"
            />
            <StatCard
              title="Largest Expense"
              value={data?.largest_expense ? formatCurrency(data.largest_expense) : '—'}
              icon={ArrowUpRight}
              color="text-orange-600"
              bg="bg-orange-50"
              sub="All-time high"
            />
            <StatCard
              title="Transactions"
              value={String((data?.expense_count ?? 0) + (data?.income_count ?? 0))}
              icon={Receipt}
              color="text-blue-600"
              bg="bg-blue-50"
              sub="Expenses + Income"
            />
          </div>

          {/* Balance bar */}
          {data && Number(data.total_income) > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-800">Income vs Expenses</h2>
                <span className="text-sm text-gray-500">
                  {((Number(data.total_expenses) / Number(data.total_income)) * 100).toFixed(1)}% spent
                </span>
              </div>
              <div className="h-4 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 to-red-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (Number(data.total_expenses) / Number(data.total_income)) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary-500 inline-block" />
                  Income {formatCurrency(data.total_income)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  Spent {formatCurrency(data.total_expenses)}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

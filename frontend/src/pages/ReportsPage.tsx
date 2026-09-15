import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Scale } from 'lucide-react'
import api from '../lib/api'
import { formatCurrency } from '../lib/utils'
import type { MonthlyReport, CategorySummaryItem } from '../types'

// ── Colour palette for pie slices ─────────────────────────────────────────────
const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
  '#14b8a6', '#6366f1',
]

// ── Small stat card ───────────────────────────────────────────────────────────
function Stat({ label, value, icon: Icon, color }: {
  label: string; value: string; icon: React.ElementType; color: string
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

// ── Custom Tooltip for Bar chart ──────────────────────────────────────────────
function BarTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill }} className="font-medium">
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

// ── Custom Tooltip for Pie chart ──────────────────────────────────────────────
function PieTooltip({ active, payload }: {
  active?: boolean; payload?: { name: string; value: number; payload: CategorySummaryItem }[]
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700">{item.name}</p>
      <p className="text-gray-600">{formatCurrency(item.value)}</p>
      <p className="text-gray-400">{item.payload.percentage.toFixed(1)}% of total</p>
    </div>
  )
}

// ── Monthly Report section ────────────────────────────────────────────────────
function MonthlySection() {
  const now   = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data,  setData]  = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get<MonthlyReport>('/reports/monthly', { params: { year, month } })
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [year, month])

  const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ]

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Bar chart data from by_category
  const barData = (data?.by_category ?? []).map(c => ({
    name: c.category_name.length > 12 ? c.category_name.slice(0, 12) + '…' : c.category_name,
    Expenses: Number(c.total),
  }))

  return (
    <section>
      {/* Nav */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-900">Monthly breakdown</h2>
        <div className="flex items-center gap-2">
          <button className="btn-secondary py-1.5 px-3" onClick={prevMonth}>
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-gray-700 w-36 text-center">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button className="btn-secondary py-1.5 px-3" onClick={nextMonth}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Stat label="Income"   value={formatCurrency(data.total_income)}   icon={TrendingUp}   color="bg-green-500" />
            <Stat label="Expenses" value={formatCurrency(data.total_expenses)} icon={TrendingDown} color="bg-red-500" />
            <Stat
              label="Balance"
              value={formatCurrency(data.balance)}
              icon={Scale}
              color={Number(data.balance) >= 0 ? 'bg-primary-500' : 'bg-orange-500'}
            />
          </div>

          {/* Bar chart — expenses by category */}
          {barData.length > 0 ? (
            <div className="card p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Expenses by category</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey="Expenses" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="card p-8 text-center text-gray-400 mb-6">
              No expenses recorded for this month.
            </div>
          )}

          {/* Category breakdown table */}
          {data.by_category.length > 0 && (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Category</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Transactions</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.by_category.map((c, i) => (
                    <tr key={c.category_id ?? i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ background: COLORS[i % COLORS.length] }}
                        />
                        {c.category_name}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{c.count}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(c.total)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-gray-600">{c.percentage.toFixed(1)}%</span>
                          <span className="h-1.5 rounded-full bg-primary-200 overflow-hidden w-16 inline-block align-middle">
                            <span
                              className="h-full rounded-full bg-primary-500 block"
                              style={{ width: `${c.percentage}%` }}
                            />
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="card p-8 text-center text-gray-400">
          No data available for this period.
        </div>
      )}
    </section>
  )
}

// ── All-time category summary ─────────────────────────────────────────────────
function CategorySummarySection() {
  const [items, setItems]     = useState<CategorySummaryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<CategorySummaryItem[]>('/reports/category-summary')
      .then(r => setItems(r.data))
      .finally(() => setLoading(false))
  }, [])

  const pieData = items.map(c => ({
    name:  c.category_name,
    value: Number(c.total),
  }))

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-5">All-time by category</h2>

      {loading ? (
        <div className="card h-72 animate-pulse bg-gray-100" />
      ) : items.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">No expense data yet.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Spending distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-gray-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="card overflow-hidden self-start">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Category</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Count</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((c, i) => (
                  <tr key={c.category_id ?? i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <span className="font-medium text-gray-900">{c.category_name}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{c.count}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(c.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  return (
    <div className="p-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 mt-0.5 text-sm">Financial insights and breakdowns</p>
      </div>
      <MonthlySection />
      <CategorySummarySection />
    </div>
  )
}

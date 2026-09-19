import { formatCurrency } from '../lib/utils'
import { useDashboard } from '../hooks'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts'

interface StatCardProps {
  title: string
  value: string | React.ReactNode
  sub?: string
  valueColor?: string
}

function StatCard({ title, value, sub, valueColor = 'text-gray-900 dark:text-white' }: StatCardProps) {
  return (
    <div className="card p-6 bg-white dark:bg-dark-inner border-none shadow-none rounded-xl">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">{title}</p>
      <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { data, loading } = useDashboard()

  const balance = data ? Number(data.balance) : 0
  const income = data ? Number(data.total_income) : 0
  const expenses = data ? Number(data.total_expenses) : 0
  const savingsRate = income > 0 ? (((income - expenses) / income) * 100).toFixed(1) : '0.0'

  // Mock data for charts to match screenshot if real data is missing
  const pieData = [
    { name: 'Food', value: 400, color: '#f87171' },
    { name: 'Transportation', value: 300, color: '#38bdf8' },
    { name: 'Housing', value: 800, color: '#fbbf24' },
    { name: 'Entertainment', value: 200, color: '#2dd4bf' },
    { name: 'Shopping', value: 150, color: '#a78bfa' },
  ]

  const barData = [
    { name: 'June 25', Income: income || 12000, Expenses: expenses || 850 }
  ]

  return (
    <div className="p-8 h-full bg-dark-bg dark:bg-dark-bg">
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 h-32 animate-pulse bg-gray-100 dark:bg-gray-800 border-none" />
          ))}
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Balance"
              value={formatCurrency(balance)}
              sub="↑ 0% from last month"
            />
            <StatCard
              title="Monthly Income"
              value={formatCurrency(income)}
              valueColor="text-cyan-400"
              sub="🗓 This month"
            />
            <StatCard
              title="Monthly Expenses"
              value={formatCurrency(expenses)}
              valueColor="text-red-500"
              sub="🗓 This month"
            />
            <StatCard
              title="Savings Rate"
              value={`${savingsRate}%`}
              sub="% Of income"
            />
          </div>

          {/* Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pie Chart */}
            <div>
              <h2 className="text-lg font-semibold text-primary-300 mb-6">Spending by Category</h2>
              <div className="flex items-center">
                <div className="w-64 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="ml-8 space-y-3">
                  {pieData.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-500 dark:text-gray-400">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div>
              <h2 className="text-lg font-semibold text-primary-300 mb-6">Monthly Overview</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#2b2e33', borderColor: '#374151', color: '#fff'}} />
                    <Bar dataKey="Income" fill="#38bdf8" barSize={120} />
                    <Bar dataKey="Expenses" fill="#f87171" barSize={120} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

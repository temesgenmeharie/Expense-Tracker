import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  TrendingUp,
  Tag,
  BarChart2,
  LogOut,
  PiggyBank,
  Settings,
  Moon,
  Sun,
  Target,
  DownloadCloud
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import ExportDialog, { type ExportFormat } from './ExportDialog'

const nav = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions',  icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/expenses',      icon: CreditCard,      label: 'Expenses' },
  { to: '/incomes',       icon: TrendingUp,      label: 'Income' },
  { to: '/categories',    icon: Tag,             label: 'Categories' },
  { to: '/budgets',       icon: PiggyBank,       label: 'Budgets' },
  { to: '/reports',       icon: BarChart2,       label: 'Reports' },
  { to: '/savings',       icon: Target,          label: 'Savings Goals' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [exportOpen, setExportOpen] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleExport = async (format: ExportFormat) => {
    setExportLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const url = `/api/v1/transactions/export?format=${format}`
      
      const response = await fetch(url, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      
      const date = new Date().toISOString().slice(0, 10)
      const ext = format === 'csv' ? 'csv' : format === 'json' ? 'json' : 'pdf'
      a.download = `transactions_${date}.${ext}`
      
      a.click()
      URL.revokeObjectURL(a.href)
      setExportOpen(false)
    } catch (e) {
      console.error('Export error:', e)
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-dark-bg text-gray-100 p-4 gap-4">
      {/* Top Header floating on main bg */}
      <header className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-primary-600">
            <span className="text-white font-bold text-lg">$</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary-300">Expense Tracker</h1>
            <p className="text-xs text-gray-400">Financial management</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="text-gray-400 hover:text-primary-300 transition-colors">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => navigate('/settings')} className="text-gray-400 hover:text-primary-300 transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden gap-4">
        {/* Sidebar */}
        <aside className="w-64 flex flex-col shrink-0 bg-dark-card rounded-xl border border-primary-800 shadow-lg overflow-hidden">
          
          {/* User Profile */}
          <div className="flex flex-col items-center justify-center py-8 bg-gradient-to-b from-primary-900/40 to-dark-card border-b border-primary-800">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center mb-4 shadow-lg">
              <span className="text-xl font-bold uppercase">
                {user?.full_name?.[0] ?? '?'}
              </span>
            </div>
            <h2 className="font-bold text-lg text-gray-100">Welcome!</h2>
            <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-2">
            {nav.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={label}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-primary-900/30 hover:text-primary-300'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
            
            <div className="pt-6 border-t border-primary-800">
              <button onClick={() => setExportOpen(true)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-primary-900/30 hover:text-primary-300 w-full text-left transition-all">
                <DownloadCloud size={18} />
                Export Data
              </button>
            </div>
          </nav>
          
          <div className="p-4 border-t border-primary-800">
            <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-accent-danger hover:bg-accent-danger/20 rounded-lg transition-all">
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-dark-card rounded-xl border border-primary-800 shadow-lg">
          <Outlet />
        </main>
      </div>

      {/* Export dialog */}
      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={handleExport}
        loading={exportLoading}
      />
    </div>
  )
}

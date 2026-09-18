import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CreditCard,
  TrendingUp,
  Tag,
  BarChart2,
  LogOut,
  Wallet,
  PiggyBank,
  Settings,
  Moon,
  Sun,
  Target,
  DownloadCloud
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const nav = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/expenses',   icon: CreditCard,       label: 'Transactions' },
  { to: '/incomes',    icon: TrendingUp,        label: 'Income' },
  { to: '/categories', icon: Tag,               label: 'Categories' },
  { to: '/budgets',    icon: PiggyBank,         label: 'Budgets' },
  { to: '/reports',    icon: BarChart2,         label: 'Reports' },
  { to: '/savings',    icon: Target,            label: 'Savings Goals' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-gray-100 p-6 gap-4">
      {/* Top Header floating on main bg */}
      <header className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="text-primary-500 bg-white dark:bg-transparent rounded-full p-1 dark:p-0">
            <Wallet size={24} className="fill-primary-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-primary-400">Income and Expense Tracker</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Take control of your finances</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => navigate('/settings')} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden gap-6">
        {/* Sidebar */}
        <aside className="w-64 flex flex-col shrink-0 bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          
          {/* User Profile */}
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-primary-500 text-white flex items-center justify-center mb-4">
              <span className="text-xl font-bold uppercase">
                {user?.full_name?.[0] ?? '?'}
              </span>
            </div>
            <h2 className="font-bold text-lg">Welcome!</h2>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-4 space-y-2">
            {nav.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={label}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
            
            <div className="pt-8">
              <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left">
                <DownloadCloud size={18} />
                Export Data
              </button>
            </div>
          </nav>
          
          <div className="p-4">
            <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

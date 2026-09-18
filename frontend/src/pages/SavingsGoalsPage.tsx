import { Plus } from 'lucide-react'

export default function SavingsGoalsPage() {
  return (
    <div className="p-8 h-full bg-gray-50 dark:bg-[#25272e]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">Savings Goals</h1>
        <button className="btn-primary py-1.5 px-3 text-xs bg-[#38bdf8] hover:bg-[#0284c7] text-white border-none">
          <Plus size={14} /> Add Goal
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="card p-5 bg-white dark:bg-[#2b2e33] border-none shadow-none rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">New Car Savings</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Target: $12000.00</p>
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-200">289 days left</span>
          </div>

          <div className="mt-6">
            <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-[#38bdf8]"
                style={{ width: '8.3%' }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-2 font-medium">
              <span>Saved: $1000.00 (8.3%)</span>
              <span>Mar 28, 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

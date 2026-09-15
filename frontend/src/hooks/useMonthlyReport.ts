import { useEffect, useState } from 'react'
import api from '../lib/api'
import type { MonthlyReport } from '../types'

/**
 * Fetch monthly financial report for a given year and month
 */
export function useMonthlyReport(year: number, month: number) {
  const [data, setData] = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api
      .get<MonthlyReport>('/reports/monthly', { params: { year, month } })
      .then((r) => setData(r.data))
      .catch((err) => {
        console.error('Monthly report error:', err)
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [year, month])

  return { data, loading }
}

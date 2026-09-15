import { useEffect, useState } from 'react'
import api from '../lib/api'
import type { Dashboard } from '../types'

/**
 * Fetch dashboard summary (all-time totals)
 */
export function useDashboard() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<Dashboard>('/reports/dashboard')
      .then((r) => setData(r.data))
      .catch((err) => {
        console.error('Dashboard fetch error:', err)
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}

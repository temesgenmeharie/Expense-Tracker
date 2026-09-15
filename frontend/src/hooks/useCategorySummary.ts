import { useEffect, useState } from 'react'
import api from '../lib/api'
import type { CategorySummaryItem } from '../types'

/**
 * Fetch all-time category summary with totals and percentages
 */
export function useCategorySummary() {
  const [items, setItems] = useState<CategorySummaryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<{ categories: CategorySummaryItem[]; total_expenses: string }>(
        '/reports/category-summary'
      )
      .then((r) => setItems(r.data.categories))
      .catch((err) => {
        console.error('Category summary error:', err)
        setItems([])
      })
      .finally(() => setLoading(false))
  }, [])

  return { items, loading }
}

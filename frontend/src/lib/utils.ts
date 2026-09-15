import { type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ')
}

export function formatCurrency(amount: number | string, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount))
}

export function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function getErrorMessage(err: unknown): string {
  if (axios_isAxiosError(err)) {
    const data = (err as { response?: { data?: { error?: { message?: string }; detail?: string } } }).response?.data
    return data?.error?.message ?? data?.detail ?? 'Something went wrong.'
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong.'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function axios_isAxiosError(err: any): boolean {
  return err && typeof err === 'object' && 'isAxiosError' in err
}

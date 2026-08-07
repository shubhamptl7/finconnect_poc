import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount, currency = 'OMR') {
  return new Intl.NumberFormat('en-OM', {
    style: 'currency',
    currency,
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount / 1000) // amount in baisa
}

export function formatNumber(n, opts = {}) {
  return new Intl.NumberFormat('en-US', opts).format(n)
}

export function formatDate(date, opts = {}) {
  return new Intl.DateTimeFormat('en-OM', {
    dateStyle: 'medium',
    ...opts,
  }).format(new Date(date))
}

export function formatRelative(date) {
  const now = Date.now()
  const diff = now - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

export function truncate(str, n = 30) {
  return str.length > n ? str.slice(0, n) + '…' : str
}

export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

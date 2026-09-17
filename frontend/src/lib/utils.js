import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

import { formatPence, formatPounds, formatMinor, formatMajor, poundsToPence, penceToPounds } from './currencyFormatters.js'

export { formatPence, formatPounds, formatMinor, formatMajor, poundsToPence, penceToPounds }

export function formatCurrency(amount, currency = 'GBP', opts = {}) {
  // If opts.isMinor is true, or if called with minor units
  if (opts.isMinor) {
    return formatPence(amount);
  }
  const num = typeof amount === 'number' ? amount : parseFloat(amount || 0)
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency || 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(isNaN(num) ? 0 : num)
}

export function formatNumber(n, opts = {}) {
  return new Intl.NumberFormat('en-GB', opts).format(n)
}

export function formatDate(date, opts = {}) {
  return new Intl.DateTimeFormat('en-GB', {
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

export function sanitizeLoanApp(app) {
  if (!app) return null
  return {
    ...app,
    requested_currency: app.requested_currency || 'GBP',
    purpose: app.purpose || 'Personal Expenses',
    status: app.status || 'DRAFT',
  }
}


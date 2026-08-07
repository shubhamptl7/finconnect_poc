import { forwardRef, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, ChevronDown, Search, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════
// BUTTON
// ═══════════════════════════════════════════════════════════
export const Button = forwardRef(({
  children, variant = 'primary', size = 'md',
  className, loading, icon, iconRight, ...props
}, ref) => {
  const base = [
    'inline-flex items-center justify-center gap-2',
    'font-semibold rounded-xl transition-all duration-200 cursor-pointer',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'select-none',
  ].join(' ')

  const variants = {
    primary:   'bg-brand-600 hover:bg-brand-700 active:bg-brand-700 text-white focus-visible:ring-brand-500 hover:-translate-y-px active:translate-y-0 shadow-[0_1px_2px_rgba(27,85,226,0.20),0_4px_12px_rgba(27,85,226,0.15)] hover:shadow-[0_2px_4px_rgba(27,85,226,0.25),0_6px_20px_rgba(27,85,226,0.20)]',
    secondary: 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 focus-visible:ring-slate-300 shadow-e1',
    ghost:     'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300',
    danger:    'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white focus-visible:ring-red-500 shadow-[0_1px_2px_rgba(217,48,37,0.20),0_4px_12px_rgba(217,48,37,0.12)]',
    success:   'bg-emerald-600 hover:bg-emerald-700 text-white focus-visible:ring-emerald-500',
    outline:   'border border-brand-200 text-brand-600 hover:bg-brand-50 focus-visible:ring-brand-300',
    link:      'text-brand-600 hover:text-brand-700 underline-offset-4 hover:underline focus-visible:ring-brand-300 px-0!',
  }

  const sizes = {
    xs:   'px-2.5 py-1.5 text-xs',
    sm:   'px-3.5 py-2 text-xs',
    md:   'px-5 py-2.5 text-sm',
    lg:   'px-6 py-3 text-sm',
    xl:   'px-7 py-3.5 text-base',
    icon: 'w-9 h-9 p-0 flex-shrink-0',
  }

  return (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {loading ? (
        <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin flex-shrink-0" />
      ) : icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
      {!loading && iconRight && <span className="flex-shrink-0">{iconRight}</span>}
    </button>
  )
})
Button.displayName = 'Button'

// ═══════════════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════════════
export const Input = forwardRef(({
  label, error, hint, icon, iconRight, className, required,
  type, ...props
}, ref) => {
  const [showPw, setShowPw] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
          {label}
          {required && <span className="text-red-500 text-xs">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex-shrink-0">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          type={isPassword ? (showPw ? 'text' : 'password') : type}
          className={cn(
            'w-full py-3 bg-white border rounded-xl text-sm text-slate-900 placeholder:text-slate-400',
            'transition-all duration-150',
            'focus:outline-none focus:border-brand-500',
            'shadow-[0_1px_2px_rgba(11,18,32,0.05)]',
            'focus:shadow-[0_0_0_3px_rgba(27,85,226,0.18),0_1px_2px_rgba(11,18,32,0.05)]',
            error ? 'border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(217,48,37,0.15),0_1px_2px_rgba(11,18,32,0.05)]' : 'border-slate-200',
            icon ? 'pl-10' : 'pl-4',
            (iconRight || isPassword) ? 'pr-10' : 'pr-4',
            className,
          )}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label={showPw ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        ) : iconRight && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {iconRight}
          </span>
        )}
      </div>
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs text-red-500 flex items-center gap-1"
          >
            <AlertCircle size={11} />
            {error}
          </motion.p>
        )}
        {hint && !error && (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-slate-500"
          >
            {hint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
})
Input.displayName = 'Input'

// ═══════════════════════════════════════════════════════════
// TEXTAREA
// ═══════════════════════════════════════════════════════════
export const Textarea = forwardRef(({ label, error, hint, className, required, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500 text-xs">*</span>}
      </label>
    )}
    <textarea
      ref={ref}
      className={cn(
        'w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400',
        'transition-all duration-150 resize-none',
        'focus:outline-none focus:border-brand-500 focus:shadow-[0_0_0_3px_rgba(27,85,226,0.18)]',
        error && 'border-red-400',
        className,
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
    {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
  </div>
))
Textarea.displayName = 'Textarea'

// ═══════════════════════════════════════════════════════════
// SELECT
// ═══════════════════════════════════════════════════════════
export const Select = forwardRef(({ label, error, className, children, required, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500 text-xs">*</span>}
      </label>
    )}
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl',
          'text-sm text-slate-900 appearance-none cursor-pointer',
          'transition-all duration-150',
          'focus:outline-none focus:border-brand-500 focus:shadow-[0_0_0_3px_rgba(27,85,226,0.18)]',
          'shadow-[0_1px_2px_rgba(11,18,32,0.05)]',
          error && 'border-red-400',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
))
Select.displayName = 'Select'

// ═══════════════════════════════════════════════════════════
// SEARCH INPUT
// ═══════════════════════════════════════════════════════════
export function SearchInput({ placeholder = 'Search…', value, onChange, onClear, className, shortcut }) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          'w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl',
          'text-sm text-slate-900 placeholder:text-slate-400',
          'focus:outline-none focus:border-brand-500 focus:shadow-[0_0_0_3px_rgba(27,85,226,0.18)]',
          'transition-all duration-150',
          shortcut && 'pr-16',
        )}
      />
      {shortcut && !value && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          <kbd className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-200">⌘K</kbd>
        </span>
      )}
      {value && onClear && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// BADGE
// ═══════════════════════════════════════════════════════════
export function Badge({ children, variant = 'neutral', size = 'md', dot, className }) {
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border border-amber-100',
    danger:  'bg-red-50 text-red-700 border border-red-100',
    info:    'bg-brand-50 text-brand-600 border border-brand-100',
    neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
    purple:  'bg-violet-50 text-violet-700 border border-violet-100',
    primary: 'bg-brand-600 text-white border border-brand-700',
  }
  const dotColors = {
    success: 'bg-emerald-500', warning: 'bg-amber-500', danger: 'bg-red-500',
    info: 'bg-brand-500', neutral: 'bg-slate-400', purple: 'bg-violet-500', primary: 'bg-white',
  }
  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-xs',
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 font-semibold rounded-full', variants[variant], sizes[size], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])} />}
      {children}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════
// CARD
// ═══════════════════════════════════════════════════════════
export function Card({ children, className, hover, onClick, padding = true, flat, accent, accentColor }) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'bg-white rounded-2xl border border-slate-100',
        flat ? '' : 'shadow-[0_1px_3px_rgba(11,18,32,0.06),0_4px_16px_rgba(11,18,32,0.04)]',
        padding && 'p-6',
        hover && 'transition-all duration-200 hover:shadow-[0_4px_8px_rgba(11,18,32,0.06),0_12px_32px_rgba(11,18,32,0.08)] hover:-translate-y-0.5',
        onClick && 'cursor-pointer',
        accent && `border-l-[3px]`,
        className,
      )}
      style={accent && accentColor ? { borderLeftColor: accentColor } : undefined}
    >
      {children}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════════════
export function Modal({ open, onClose, title, children, size = 'md', footer, description }) {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  // Trap focus and close on Escape
  useEffect(() => {
    if (!open) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              'relative bg-white rounded-2xl shadow-[0_8px_24px_rgba(11,18,32,0.10),0_24px_64px_rgba(11,18,32,0.12)] w-full',
              sizes[size],
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-900" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>{title}</h3>
                {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ml-4 flex-shrink-0"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
            {/* Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {children}
            </div>
            {/* Footer */}
            {footer && (
              <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ═══════════════════════════════════════════════════════════
// DRAWER (right-slide panel)
// ═══════════════════════════════════════════════════════════
export function Drawer({ open, onClose, title, children, width = 'md' }) {
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }

  useEffect(() => {
    if (!open) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              'relative bg-white h-full flex flex-col shadow-[-8px_0_32px_rgba(11,18,32,0.10)] w-full',
              widths[width],
            )}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-base font-semibold text-slate-900" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>{title}</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ═══════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════
const toastConfig = {
  success: { icon: <CheckCircle2 size={15} />, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', iconColor: 'text-emerald-600' },
  error:   { icon: <AlertCircle size={15} />,  bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     iconColor: 'text-red-600'     },
  warning: { icon: <AlertTriangle size={15} />,bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   iconColor: 'text-amber-600'   },
  info:    { icon: <Info size={15} />,         bg: 'bg-brand-50',   text: 'text-brand-700',   border: 'border-brand-200',   iconColor: 'text-brand-600'   },
}

export function Toast({ id, type = 'info', title, message, onClose }) {
  const config = toastConfig[type] || toastConfig.info

  // Auto-dismiss after 5s
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 5000)
    return () => clearTimeout(timer)
  }, [id, onClose])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: 8 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 min-w-72 max-w-sm',
        'shadow-[0_4px_8px_rgba(11,18,32,0.06),0_12px_32px_rgba(11,18,32,0.08)]',
        config.bg, config.border,
      )}
    >
      <span className={cn('mt-0.5 flex-shrink-0', config.iconColor)}>{config.icon}</span>
      <div className="flex-1 min-w-0">
        {title && <p className={cn('text-sm font-semibold', config.text)}>{title}</p>}
        {message && <p className={cn('text-xs mt-0.5', config.text, 'opacity-80')}>{message}</p>}
      </div>
      <button
        onClick={() => onClose(id)}
        className={cn('transition-opacity hover:opacity-100 opacity-60 cursor-pointer flex-shrink-0', config.text)}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

export function ToastContainer({ toasts, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2" role="region" aria-label="Notifications">
      <AnimatePresence mode="sync">
        {toasts.map(t => <Toast key={t.id} {...t} onClose={onClose} />)}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SPINNER
// ═══════════════════════════════════════════════════════════
export function Spinner({ size = 'md', className }) {
  const sizes = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7', xl: 'w-9 h-9' }
  return (
    <span
      className={cn('border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin', sizes[size], className)}
      role="status"
      aria-label="Loading"
    />
  )
}

// ═══════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════
export function EmptyState({ icon, title, description, action, compact }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-8 px-4' : 'py-16 px-6')}>
      {icon && (
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-900 mb-1.5">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-xs mb-6 leading-relaxed">{description}</p>}
      {action}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════
export function Skeleton({ className, variant }) {
  const variants = {
    text:    'h-4 rounded',
    title:   'h-6 rounded-lg',
    avatar:  'rounded-full aspect-square',
    button:  'h-10 rounded-xl',
    card:    'h-32 rounded-2xl',
  }
  return (
    <div
      className={cn('skeleton', variant ? variants[variant] : 'rounded-lg', className)}
      aria-hidden="true"
    />
  )
}

// Skeleton group for complex shapes
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-e2">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-10 h-10" variant="avatar" />
        <Skeleton className="w-16 h-6" variant="text" />
      </div>
      <Skeleton className="w-24 h-4 mb-2" variant="text" />
      <Skeleton className="w-32 h-7" variant="title" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// DIVIDER
// ═══════════════════════════════════════════════════════════
export function Divider({ label, className }) {
  return (
    <div className={cn('divider-or', className)}>
      {label || 'or'}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// STAT CARD  — cleaner hierarchy
// ═══════════════════════════════════════════════════════════
export function StatCard({ label, value, delta, deltaLabel, icon, iconBg, loading }) {
  const isPositive = delta >= 0

  if (loading) return <SkeletonCard />

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        {delta !== undefined && (
          <span className={cn(
            'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full',
            isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          )}>
            {isPositive ? '↑' : '↓'} {Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums number-lg mb-1">{value}</p>
      <div className="flex items-center justify-between">
        {deltaLabel && <p className="text-xs text-slate-400">{deltaLabel}</p>}
        {icon && (
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center ml-auto', iconBg || 'bg-brand-50')}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════════════════════
export function ProgressBar({ value, max = 100, color = 'brand', label, showLabel, className }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))
  const colors = {
    brand:   'bg-brand-600',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger:  'bg-red-500',
  }
  return (
    <div className={className}>
      {(label || showLabel) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs font-medium text-slate-600">{label}</span>}
          {showLabel && <span className="text-xs font-semibold text-slate-700">{Math.round(percent)}%</span>}
        </div>
      )}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', colors[color] || colors.brand)}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// STEPPER
// ═══════════════════════════════════════════════════════════
export function Stepper({ steps, currentStep, className }) {
  return (
    <div className={cn('flex items-center', className)}>
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className={cn(
            'flex items-center gap-2.5 py-1.5',
            i <= currentStep ? 'text-brand-600' : 'text-slate-400'
          )}>
            <span className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all flex-shrink-0',
              i < currentStep  ? 'border-emerald-500 bg-emerald-500 text-white' :
              i === currentStep ? 'border-brand-600 bg-brand-50 text-brand-700' :
              'border-slate-200 bg-white text-slate-400'
            )}>
              {i < currentStep ? '✓' : i + 1}
            </span>
            <span className={cn('hidden sm:block text-xs font-medium', i === currentStep && 'font-semibold')}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn('step-connector mx-2', i < currentStep && 'done')} />
          )}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════
export function Tabs({ tabs, active, onChange, className, variant = 'pill' }) {
  if (variant === 'underline') {
    return (
      <div className={cn('flex border-b border-slate-200', className)}>
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer border-b-2 -mb-px',
              active === tab.value
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.badge != null && (
              <span className={cn(
                'flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold',
                active === tab.value ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'
              )}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('flex bg-slate-100 p-1 rounded-xl gap-0.5', className)}>
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
            active === tab.value
              ? 'bg-white text-slate-900 shadow-e1'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.badge != null && (
            <span className={cn(
              'min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full text-[10px] font-bold',
              active === tab.value ? 'bg-brand-600 text-white' : 'bg-slate-300 text-slate-600'
            )}>{tab.badge}</span>
          )}
        </button>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// ALERT (inline message)
// ═══════════════════════════════════════════════════════════
export function Alert({ variant = 'info', title, children, icon, className }) {
  const variants = {
    info:    { bg: 'bg-brand-50',   border: 'border-brand-200',   text: 'text-brand-800',   icon: <Info size={16} className="text-brand-600" /> },
    success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: <CheckCircle2 size={16} className="text-emerald-600" /> },
    warning: { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800',   icon: <AlertTriangle size={16} className="text-amber-600" /> },
    danger:  { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-800',     icon: <AlertCircle size={16} className="text-red-600" /> },
  }
  const v = variants[variant]
  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-xl border', v.bg, v.border, v.text, className)}>
      <span className="flex-shrink-0 mt-0.5">{icon || v.icon}</span>
      <div className="text-sm">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        {children}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// CONNECTED BANK CARD
// ═══════════════════════════════════════════════════════════
export function ConnectedBankCard({ bank, onDisconnect, onReconnect }) {
  return (
    <Card className="p-5 hover:shadow-e3 transition-shadow duration-200">
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: bank.color }}
        >
          {bank.bankCode?.slice(0, 2) || bank.logo?.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">{bank.bankName}</p>
              <p className="text-xs text-slate-500 mt-0.5">{bank.accountNumber}</p>
            </div>
            <Badge variant={bank.status === 'active' ? 'success' : 'warning'} dot>
              {bank.status === 'active' ? 'Connected' : 'Attention'}
            </Badge>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>{bank.type} · {bank.currency}</span>
              {bank.connectedAt && <span>Connected {bank.connectedAt}</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" onClick={onReconnect}>Sync</Button>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={onDisconnect}>
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

import { CheckCircle2, Clock, AlertCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LoanStatusBadge({ status, className }) {
  const s = String(status || 'PENDING').toUpperCase()

  const isApproved = ['APPROVED', 'OFFER_GENERATED', 'OFFER_ISSUED', 'ACCEPTED', 'LOAN_CREATED', 'DISBURSED', 'CLOSED', 'COMPLETED'].includes(s)
  const isRejected = ['REJECTED', 'CANCELLED', 'FAILED'].includes(s)
  const isPending = !isApproved && !isRejected

  return (
    <span
      className={cn(
        'px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border uppercase tracking-wider shadow-2xs',
        isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
        isRejected ? 'bg-rose-50 text-rose-700 border-rose-200' :
        'bg-amber-50 text-amber-700 border-amber-200',
        className
      )}
    >
      {isApproved ? (
        <CheckCircle2 size={14} className="text-emerald-600" />
      ) : isRejected ? (
        <AlertCircle size={14} className="text-rose-600" />
      ) : (
        <Clock size={14} className="animate-spin text-amber-600" />
      )}
      {s.replace(/_/g, ' ')}
    </span>
  )
}

import { Landmark, Calendar, DollarSign } from 'lucide-react'
import { Card } from '@/components/ui'
import { LoanStatusBadge } from './LoanStatusBadge'
import { formatDate } from '@/lib/utils'
import { formatPence } from '@/lib/currencyFormatters'

export function LoanSummaryCard({ application, onClick, showBadge = true }) {
  if (!application) return null

  return (
    <Card
      onClick={onClick}
      className="p-5 bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all rounded-2xl cursor-pointer space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
          {application.application_number}
        </span>
        {showBadge && <LoanStatusBadge status={application.status} />}
      </div>

      <div>
        <p className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
          {formatPence(application.requested_amount)}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          Tenure: {application.requested_tenure_months} Months • {application.purpose || 'Personal Expenses'}
        </p>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Calendar size={13} /> Applied: {application.submitted_at ? formatDate(application.submitted_at) : 'Draft'}
        </span>
        {application.verified_dti_bps && (
          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            DTI: {(application.verified_dti_bps / 100).toFixed(1)}%
          </span>
        )}
      </div>
    </Card>
  )
}

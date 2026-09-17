import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, AlertCircle, ShieldCheck, ArrowRight, Activity, ChevronLeft, Landmark, FileText, Sparkles, Building2 } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, Button, Badge } from '@/components/ui'
import { loanApi } from '@/services/loanApi'
import { formatDate, cn, formatCurrency } from '@/lib/utils'
import { formatPence } from '@/lib/currencyFormatters'

export default function LoanApplicationStatusPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false
    let timerId = null

    const runPoll = async () => {
      try {
        const data = await loanApi.getApplicationById(id)
        if (!isCancelled) {
          setApp(data)
          setLoading(false)
          // Only poll if application exists and is in pending/underwriting status
          if (data && ['SUBMITTED', 'UNDERWRITING', 'ADMIN_REVIEW_PENDING'].includes(data.status)) {
            timerId = setTimeout(runPoll, 4000)
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to fetch application status:', err)
          setApp(null)
          setLoading(false)
          // Do not schedule next poll on 404 / error
        }
      }
    }

    runPoll()

    return () => {
      isCancelled = true
      if (timerId) clearTimeout(timerId)
    }
  }, [id])

  if (loading) {
    return (
      <AppLayout title="Application Tracking" subtitle="Real-time loan status tracking and decision timeline">
        <div className="p-12 text-slate-500 font-semibold flex items-center justify-center gap-2">
          <Activity size={20} className="animate-spin text-teal-600" /> Fetching live application metrics...
        </div>
      </AppLayout>
    )
  }

  if (!app) {
    return (
      <AppLayout title="Application Tracking" subtitle="Loan application record error">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <Button
              variant="secondary"
              size="sm"
              icon={<ChevronLeft size={16} />}
              onClick={() => navigate('/app/loans')}
              className="font-bold text-xs cursor-pointer hover:bg-slate-200"
            >
              Back to Portal
            </Button>
          </div>
          <div className="p-12 text-rose-600 font-bold text-center bg-white border border-rose-200 rounded-2xl">
            Loan application record not found or access unauthorized.
          </div>
        </div>
      </AppLayout>
    )
  }

  const isApproved = app.status === 'APPROVED' || app.status === 'OFFER_GENERATED' || app.status === 'ACCEPTED'
  const isRejected = app.status === 'REJECTED'
  const isPendingAdmin = app.status === 'ADMIN_REVIEW_PENDING' || app.status === 'UNDERWRITING'

  const formatCurrency = formatPence

  return (
    <AppLayout title="Application Tracking Status" subtitle={`Reference Code: #${app.application_number}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon={<ChevronLeft size={16} />}
              onClick={() => navigate('/app/loans')}
              className="font-bold text-xs cursor-pointer hover:bg-slate-200"
            >
              Back to Loans Portal
            </Button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
              Loans Directory &gt; <span className="text-slate-900 font-mono font-bold">#{app.application_number}</span> &gt; <span className="text-slate-900 font-bold">Status Tracker</span>
            </span>
          </div>

          <Badge variant={isApproved ? 'success' : isRejected ? 'danger' : 'warning'}>
            {app.status.replace(/_/g, ' ')}
          </Badge>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Status & Timeline (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Status Header Card */}
            <Card className="p-6 bg-white border border-slate-200/90 shadow-xs rounded-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                    Application #{app.application_number}
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 mt-2 font-mono tabular-nums">
                    {formatCurrency(app.requested_amount)}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Tenure: {app.requested_tenure_months} Months • Submitted {app.submitted_at ? formatDate(app.submitted_at) : 'Recently'}
                  </p>
                </div>

                <div>
                  <span className={cn(
                    'px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border uppercase tracking-wider shadow-xs',
                    isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      isRejected ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                  )}>
                    {isApproved ? <CheckCircle2 size={16} /> : isRejected ? <AlertCircle size={16} /> : <Clock size={16} className="animate-spin" />}
                    {app.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Offer Generation Banner */}
              {isApproved && (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-emerald-900 text-sm flex items-center gap-1.5">
                      <Sparkles size={16} className="text-emerald-600" /> Congratulations! Loan Approved.
                    </h4>
                    <p className="text-xs text-emerald-700 mt-0.5 font-medium">Your application has passed open banking affordability checks and an official offer is ready.</p>
                  </div>
                  <Button
                    onClick={() => navigate(`/app/loans/offer/${app.id}`)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex-shrink-0 cursor-pointer shadow-xs"
                  >
                    View Binding Offer <ArrowRight size={15} className="ml-1" />
                  </Button>
                </div>
              )}

              {/* Rejection Banner */}
              {isRejected && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                  <h4 className="font-bold text-rose-900 text-sm">Decision Result: Application Ineligible</h4>
                  <p className="text-xs text-rose-700 font-medium">
                    {app.system_recommendation_reason || 'Application did not meet maximum debt-to-income (DTI) or open banking credit criteria.'}
                  </p>
                </div>
              )}
            </Card>

            {/* Underwriting Timeline */}
            <Card className="p-6 bg-white border border-slate-200/90 shadow-xs rounded-2xl space-y-6">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-base">Underwriting & Verification Timeline</h3>
                <p className="text-xs text-slate-500 mt-0.5">Live progress tracking of open banking evaluation stages</p>
              </div>

              <div className="space-y-6 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200/80">
                {/* Stage 1 */}
                <div className="flex items-start gap-4 relative">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 z-10 shadow-xs">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Digital Application Received</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Loan parameters and requested terms registered in portal.</p>
                  </div>
                </div>

                {/* Stage 2 */}
                <div className="flex items-start gap-4 relative">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 z-10 shadow-xs">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Persona Resident ID Verification (KYC)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Applicant identity and government registration status confirmed.</p>
                  </div>
                </div>

                {/* Stage 3 */}
                <div className="flex items-start gap-4 relative">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 z-10 shadow-xs">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Plaid Open Banking Cash Flow & DTI Audit</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Automated calculation of debt-to-income ratio based on linked bank accounts.</p>
                  </div>
                </div>

                {/* Stage 4 */}
                <div className="flex items-start gap-4 relative">
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 z-10 shadow-xs',
                    isApproved ? 'bg-emerald-600 text-white' : isRejected ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white animate-pulse'
                  )}>
                    {isApproved || isRejected ? '✓' : '•'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Credit Risk & Underwriting Sign-off</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      {isPendingAdmin ? 'FinConnect Credit Officer is conducting manual review.' : 'Underwriting assessment complete.'}
                    </p>
                  </div>
                </div>

                {/* Stage 5 */}
                <div className="flex items-start gap-4 relative">
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 z-10 shadow-xs',
                    isApproved ? 'bg-emerald-600 text-white' : isRejected ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-400'
                  )}>
                    {isApproved || isRejected ? '✓' : '5'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Final Loan Agreement</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      {isApproved ? 'Binding agreement available for electronic signature.' : isRejected ? 'Decision completed.' : 'Awaiting sign-off completion.'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Summary Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
            <Card className="p-5 bg-white border border-slate-200/90 shadow-xs rounded-2xl space-y-4">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <FileText size={15} className="text-teal-600" /> Summary Metrics
              </h4>

              <div className="space-y-3 text-xs text-slate-600 font-medium">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Requested Amount:</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(app.requested_amount)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tenure:</span>
                  <span className="font-bold text-slate-900">{app.requested_tenure_months} Months</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Purpose:</span>
                  <span className="font-bold text-slate-900">{app.purpose || 'Personal Loan'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Plaid Open Banking:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1"><ShieldCheck size={13} /> Verified</span>
                </div>
              </div>

              {isApproved && (
                <Button
                  onClick={() => navigate(`/app/loans/offer/${app.id}`)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer rounded-xl flex items-center justify-center gap-1.5"
                >
                  View Offer Details <ArrowRight size={14} />
                </Button>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}


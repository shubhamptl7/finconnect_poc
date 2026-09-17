import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Landmark, Calculator, Plus, ArrowUpRight, Activity, ShieldCheck, ChevronRight, FileCheck, DollarSign } from 'lucide-react'
import { AppLayout, BreadcrumbBar } from '@/components/layout/AppLayout'
import { Card, Button, Badge } from '@/components/ui'
import { loanApi } from '@/services/loanApi'
import { formatDate, cn, formatCurrency } from '@/lib/utils'
import { formatPence } from '@/lib/currencyFormatters'

export default function LoansPage() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'approved' | 'pending'

  const fetchApps = async () => {
    try {
      const data = await loanApi.getApplications()
      setApplications(data || [])
    } catch (err) {
      console.error('Failed to fetch loan applications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApps()
  }, [])

  const formatCurrency = formatPence

  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      if (activeTab === 'approved') {
        return ['APPROVED', 'OFFER_GENERATED', 'ACCEPTED', 'LOAN_CREATED', 'DISBURSED', 'CLOSED', 'COMPLETED'].includes(app.status)
      }
      if (activeTab === 'pending') {
        return ['SUBMITTED', 'UNDERWRITING', 'ADMIN_REVIEW_PENDING'].includes(app.status)
      }
      return true
    })
  }, [applications, activeTab])

  const activeLoansList = useMemo(() => {
    return applications.filter(a => ['LOAN_CREATED', 'DISBURSED', 'ACTIVE', 'CLOSED', 'COMPLETED'].includes(a.status) && a.loan)
  }, [applications])

  const stats = useMemo(() => {
    const approved = applications.filter(a => ['APPROVED', 'OFFER_GENERATED', 'ACCEPTED', 'LOAN_CREATED', 'DISBURSED', 'CLOSED', 'COMPLETED'].includes(a.status))
    const totalApprovedCents = approved.reduce((acc, curr) => acc + Number(curr.approved_amount || curr.requested_amount || 0), 0)
    const pendingCount = applications.filter(a => ['SUBMITTED', 'UNDERWRITING', 'ADMIN_REVIEW_PENDING'].includes(a.status)).length

    return {
      totalApps: applications.length,
      approvedCount: approved.length,
      pendingCount,
      totalApprovedCents,
    }
  }, [applications])

  return (
    <AppLayout title="Loans & Personal Financing" subtitle="Personal credit management, open banking pre-qualification, and underwriting status">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Navigation Breadcrumb Bar */}
        <BreadcrumbBar
          items={[
            { label: 'Overview', to: '/app/dashboard' },
            { label: 'Loans Portal' }
          ]}
          backTo="/app/dashboard"
          backLabel="Overview"
        />

        {/* Executive Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800 relative overflow-hidden">
          <div className="space-y-2 relative z-10 max-w-xl">
            <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold uppercase tracking-wider border border-teal-500/30">
              Open Banking Underwriting
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Personal Loans & Credit Portal
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Real-time pre-qualification based on Plaid open banking cash flows. Fixed rates from 8.00% APR with zero hidden fees.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 relative z-10">
            <Button
              variant="secondary"
              icon={<Calculator size={15} />}
              onClick={() => navigate('/app/loans/eligibility')}
              className="bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs cursor-pointer shadow-xs"
            >
              Check Eligibility
            </Button>
            {activeLoansList.length >= 3 ? (
              <Button
                disabled
                className="bg-slate-700 text-slate-400 font-bold text-xs cursor-not-allowed border border-slate-600"
              >
                Max 3 Active Loans Reached
              </Button>
            ) : (
              <Button
                icon={<Plus size={15} />}
                onClick={() => navigate('/app/loans/apply')}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Apply Now
              </Button>
            )}
          </div>
        </div>

        {/* 4 Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Applications</span>
              <FileCheck size={18} className="text-teal-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 font-mono">{stats.totalApps}</p>
            <p className="text-[11px] font-semibold text-slate-500">Submitted credit requests</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Active & Approved</span>
              <ShieldCheck size={18} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 font-mono">{stats.approvedCount}</p>
            <p className="text-[11px] font-semibold text-emerald-600">Approved loans & active offers</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Underwriting Review</span>
              <Activity size={18} className="text-amber-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 font-mono">{stats.pendingCount}</p>
            <p className="text-[11px] font-semibold text-amber-600">Awaiting admin decision</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">TOTAL APPROVED LOAN AMOUNT</span>
              <DollarSign size={18} className="text-teal-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 font-mono">{formatCurrency(stats.totalApprovedCents)}</p>
          </div>
        </div>

        {/* Active Disbursed Loans Section */}
        {activeLoansList.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Landmark size={16} className="text-teal-600" /> Active Disbursed Loans ({activeLoansList.length})
              </h3>
              <span className="text-xs text-slate-500 font-medium">Manage repayments & schedules individually</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeLoansList.map((app, idx) => (
                <div key={app.id} className="p-6 bg-slate-900 text-white border border-slate-800 shadow-md rounded-2xl space-y-4 relative overflow-hidden">
                  <div className="flex items-start justify-between gap-2 relative z-10">
                    <div>
                      <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider bg-teal-500/20 px-2.5 py-0.5 rounded-full border border-teal-500/30">
                        Loan #{idx + 1}
                      </span>
                      <h4 className="text-lg font-black text-white font-mono mt-1">
                        {app.application_number || app.id.slice(0, 8)}
                      </h4>
                    </div>
                    <Badge variant="success" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                      {app.loan?.status || 'ACTIVE'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs relative z-10 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-sans">Original Principal</span>
                      <span className="font-bold text-white text-sm">
                        {formatCurrency(app.loan?.original_principal || app.requested_amount, app.requested_currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-sans">Outstanding Balance</span>
                      <span className="font-bold text-teal-300 text-sm">
                        {formatCurrency(app.loan?.principal_outstanding ?? app.requested_amount, app.requested_currency)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 relative z-10 text-xs">
                    <span className="text-slate-400 font-medium">
                      APR: {((app.loan?.interest_rate_bps || 850) / 100).toFixed(2)}% | {app.loan?.tenure_months || app.requested_tenure_months} Months
                    </span>
                    <Button
                      onClick={() => navigate(`/app/emi/${app.id}`)}
                      className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2 cursor-pointer shadow-xs"
                    >
                      Manage EMI & Schedule →
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Directory Card */}
        <Card className="p-6 bg-white border border-slate-200/80 shadow-xs rounded-2xl space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Your Applications & Loan Directory</h3>
              <p className="text-xs text-slate-500 mt-0.5">Track live underwriting status, view terms, and accept generated loan offers</p>
            </div>

            {/* Segmented Tab Controls */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                All ({applications.length})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  activeTab === 'approved' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Approved & Active ({stats.approvedCount})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  activeTab === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                In Underwriting ({stats.pendingCount})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
              <Activity size={18} className="animate-spin text-teal-600" /> Fetching your loan directory…
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="p-12 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200/80 max-w-lg mx-auto">
              <Landmark size={36} className="mx-auto text-slate-300" />
              <h4 className="font-bold text-slate-900 text-sm">No Loan Applications Found</h4>
              <p className="text-xs text-slate-500">
                {activeTab === 'all'
                  ? "You haven't submitted any loan requests yet. Check your pre-approved eligibility in seconds."
                  : `No applications currently match the "${activeTab}" filter.`}
              </p>
              <Button size="sm" icon={<Calculator size={14} />} onClick={() => navigate('/app/loans/eligibility')} className="bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer">
                Check Eligibility
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApps.map(app => {
                const isApproved = ['APPROVED', 'OFFER_GENERATED', 'ACCEPTED', 'LOAN_CREATED', 'DISBURSED', 'CLOSED', 'COMPLETED'].includes(app.status)
                const isRejected = ['REJECTED', 'CANCELLED', 'FAILED'].includes(app.status)
                const hasOfferAvailable = Boolean(app.offer || ['OFFER_GENERATED', 'ACCEPTED', 'DISBURSED'].includes(app.status))
                return (
                  <div
                    key={app.id}
                    onClick={() => {
                      if (['LOAN_CREATED', 'DISBURSED', 'ACTIVE', 'CLOSED', 'COMPLETED'].includes(app.status)) {
                        navigate(`/app/emi/${app.id}`)
                      } else {
                        navigate(`/app/loans/status/${app.id}`)
                      }
                    }}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-teal-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">#{app.application_number}</span>
                        <Badge variant={isApproved ? 'success' : isRejected ? 'danger' : 'warning'} dot>
                          {app.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-xl font-black text-slate-900 font-mono">
                        {formatCurrency(app.requested_amount, app.requested_currency)} · {app.requested_tenure_months} Months
                      </p>
                      <p className="text-xs text-slate-500 font-medium">{app.purpose || 'Personal Loan'} · Applied {formatDate(app.createdAt || app.created_at)}</p>
                    </div>

                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {hasOfferAvailable && (
                        <Button size="sm" variant="success" iconRight={<ArrowUpRight size={14} />} onClick={() => navigate(`/app/loans/offer/${app.id}`)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer text-xs">
                          View Offer
                        </Button>
                      )}
                      <Button size="sm" variant="secondary" iconRight={<ChevronRight size={14} />} 
                        onClick={(e) => {
                          e.stopPropagation()
                          if (['LOAN_CREATED', 'DISBURSED', 'ACTIVE', 'CLOSED', 'COMPLETED'].includes(app.status)) {
                            navigate(`/app/emi/${app.id}`)
                          } else {
                            navigate(`/app/loans/status/${app.id}`)
                          }
                        }} 
                        className="font-bold text-xs cursor-pointer"
                      >
                        {['LOAN_CREATED', 'DISBURSED', 'ACTIVE'].includes(app.status) ? 'Manage Loan' : 'Track Status'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}

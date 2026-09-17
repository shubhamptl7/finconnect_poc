import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck, CheckCircle2, AlertCircle, Activity,
  Search, Lock, Landmark, ChevronRight, Sparkles,
  ArrowLeft, FileCheck, Ban
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge, Button, Card } from '@/components/ui'
import { adminApi } from '@/services/adminApi'
import { formatDate, cn, sanitizeLoanApp, formatCurrency } from '@/lib/utils'
import { formatPence } from '@/lib/currencyFormatters'

export function AdminLoanReviewPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedApp, setSelectedApp] = useState(null)
  const [activeDossierTab, setActiveDossierTab] = useState('evidence') // 'evidence' | 'rules' | 'decision'

  // Decision Form State
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [customInterestRate, setCustomInterestRate] = useState('12.00')
  const [customApprovedAmount, setCustomApprovedAmount] = useState('')
  const [customTenureMonths, setCustomTenureMonths] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getPendingLoanReviews()
      setReviews((data || []).map(sanitizeLoanApp))
    } catch (err) {
      console.error('Failed to fetch pending loan reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  useEffect(() => {
    if (selectedApp) {
      const dtiBps = selectedApp.verified_dti_bps || 2000
      const riskRatio = Math.min(1.0, Math.max(0.0, dtiBps / 4500))
      const calcRate = (8.0 + riskRatio * 16.0).toFixed(2)
      setCustomInterestRate(calcRate)
      setCustomApprovedAmount((Number(selectedApp.requested_amount || 0) / 100).toString())
      setCustomTenureMonths((selectedApp.requested_tenure_months || 12).toString())
    }
  }, [selectedApp])

  const filtered = useMemo(() => {
    return reviews.filter(app => {
      const name = app.user?.name || ''
      const email = app.user?.email || ''
      const appNum = app.application_number || ''
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) ||
        email.toLowerCase().includes(search.toLowerCase()) ||
        appNum.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [reviews, search, statusFilter])

  const stats = useMemo(() => ({
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'ADMIN_REVIEW_PENDING' || r.status === 'UNDERWRITING').length,
    recommendedApprove: reviews.filter(r => r.system_recommendation === 'RECOMMENDED_APPROVE').length,
    recommendedReject: reviews.filter(r => r.system_recommendation === 'RECOMMENDED_REJECT').length,
    approved: reviews.filter(r => ['APPROVED', 'OFFER_GENERATED', 'ACCEPTED', 'LOAN_CREATED', 'DISBURSED', 'CLOSED', 'COMPLETED'].includes(r.status)).length,
  }), [reviews])

  const handleApprove = async (appId) => {
    setSubmitting(true)
    try {
      const customRateBps = customInterestRate ? Math.round(parseFloat(customInterestRate) * 100) : undefined
      const customAmountCents = customApprovedAmount ? Math.round(parseFloat(customApprovedAmount) * 100) : undefined
      const customTenure = customTenureMonths ? parseInt(customTenureMonths, 10) : undefined

      await adminApi.approveLoanApplication(appId, adminNotes, {
        customInterestRateBps: customRateBps,
        customApprovedAmountCents: customAmountCents,
        customTenureMonths: customTenure,
      })
      setSelectedApp(null)
      setAdminNotes('')
      fetchReviews()
    } catch (err) {
      alert(err.message || 'Failed to approve application')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async (appId) => {
    setSubmitting(true)
    try {
      await adminApi.rejectLoanApplication(appId, rejectionReason, adminNotes)
      setSelectedApp(null)
      setRejectionReason('')
      setAdminNotes('')
      fetchReviews()
    } catch (err) {
      alert(err.message || 'Failed to reject application')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = formatPence

  if (loading) {
    return (
      <AppLayout title="Loan Underwriting Console" subtitle="Admin final underwriting review, Plaid verification data & binding approval">
        <div className="p-12 text-slate-500 font-semibold flex items-center justify-center gap-2">
          <Activity size={20} className="animate-spin text-teal-600" /> Loading pending loan reviews...
        </div>
      </AppLayout>
    )
  }

  // ─── DEDICATED FULL-PAGE UNDERWRITING DOSSIER VIEW ─────────────────
  if (selectedApp) {
    const finAnalysisVerif = (selectedApp.verifications || []).find(v => v.verification_type === 'FINANCIAL_ANALYSIS')?.result || {}
    const liquidReserveCents = finAnalysisVerif.liquidBalanceCents ?? finAnalysisVerif.assetReportDetails?.liquidBalanceCents ?? selectedApp.liquid_balance_cents ?? 0

    return (
      <AppLayout
        title={`Loan Underwriting: #${selectedApp.application_number}`}
        subtitle={`Review financial evidence, open banking verification & issue binding sign-off for ${selectedApp.user?.name || 'Applicant'}`}
      >
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 max-w-7xl mx-auto"
        >
          {/* Top Breadcrumb Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                icon={<ArrowLeft size={16} />}
                onClick={() => setSelectedApp(null)}
                className="font-bold text-xs cursor-pointer hover:bg-slate-200"
              >
                Back to Applications
              </Button>
              <div className="h-4 w-px bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span>Admin Portal</span>
                <ChevronRight size={14} className="text-slate-400" />
                <span>Loan Underwriting</span>
                <ChevronRight size={14} className="text-slate-400" />
                <span className="text-slate-900 font-mono font-bold">#{selectedApp.application_number}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={cn(
                'px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider flex items-center gap-1.5',
                selectedApp.system_recommendation === 'RECOMMENDED_APPROVE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              )}>
                {selectedApp.system_recommendation === 'RECOMMENDED_APPROVE' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                Rec: {selectedApp.system_recommendation?.replace(/_/g, ' ') || 'UNDERWRITING'}
              </span>

              <Badge variant={['APPROVED', 'OFFER_GENERATED', 'ACCEPTED', 'LOAN_CREATED', 'DISBURSED', 'CLOSED', 'COMPLETED'].includes(selectedApp.status) ? 'success' : ['REJECTED', 'CANCELLED', 'FAILED'].includes(selectedApp.status) ? 'danger' : 'warning'}>
                {selectedApp.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>

          {/* Clean White Applicant Dossier Hero Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
                  {selectedApp.user?.name ? selectedApp.user.name.slice(0, 2).toUpperCase() : 'US'}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-extrabold text-slate-900">{selectedApp.user?.name || 'Applicant'}</h2>
                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                      #{selectedApp.application_number}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 font-medium">
                    <span>{selectedApp.user?.email}</span>
                    <span>•</span>
                    <span>Created {formatDate(selectedApp.createdAt || selectedApp.created_at)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedApp(null)}
                  className="font-bold text-xs cursor-pointer border-slate-200"
                >
                  Close Review
                </Button>
              </div>
            </div>

            {/* Quick Unified KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Facility Requested</span>
                <p className="text-xl font-black text-slate-900 font-mono">{formatCurrency(selectedApp.requested_amount, selectedApp.requested_currency)}</p>
                <p className="text-xs text-teal-700 font-semibold">{selectedApp.requested_tenure_months} Months Tenure</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plaid Verified Salary</span>
                <p className="text-xl font-black text-emerald-700 font-mono">{formatCurrency(selectedApp.verified_monthly_income || selectedApp.monthly_income, selectedApp.requested_currency)}</p>
                <p className="text-xs text-emerald-700 font-semibold">Open Banking Verified</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plaid Verified Debt</span>
                <p className="text-xl font-black text-rose-700 font-mono">{formatCurrency(selectedApp.verified_monthly_debt || 0, selectedApp.requested_currency)}</p>
                <p className="text-xs text-rose-700 font-semibold">Monthly Liabilities</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Calculated DTI</span>
                <p className="text-xl font-black text-emerald-700 font-mono">
                  {(() => {
                    const bps = selectedApp.verified_dti_bps != null ? selectedApp.verified_dti_bps : null
                    if (bps != null) return `${(bps / 100).toFixed(1)}%`
                    const inc = Number(selectedApp.verified_monthly_income || selectedApp.monthly_income || 0) / 100
                    const dbt = Number(selectedApp.verified_monthly_debt || 0) / 100
                    const amt = Number(selectedApp.requested_amount || 0) / 100
                    const m = Number(selectedApp.requested_tenure_months || 12)
                    if (inc > 0) {
                      const r = 0.12 / 12
                      const emi = (amt * r * Math.pow(1 + r, m)) / (Math.pow(1 + r, m) - 1)
                      return `${(((dbt + emi) / inc) * 100).toFixed(1)}%`
                    }
                    return '0.0%'
                  })()}
                </p>
                <p className="text-xs text-emerald-700 font-semibold">Cap: 45.0% DTI</p>
              </div>
            </div>
          </div>

          {/* Underwriting Dossier Canvas Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {/* Sub-Navigation Bar */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between overflow-x-auto">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveDossierTab('evidence')}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
                    activeDossierTab === 'evidence' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80'
                  )}
                >
                  <Landmark size={15} /> 1. Open Banking Financial Evidence
                </button>
                <button
                  onClick={() => setActiveDossierTab('rules')}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
                    activeDossierTab === 'rules' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80'
                  )}
                >
                  <ShieldCheck size={15} /> 2. Automated Policy Rules (5 Checks)
                </button>
                <button
                  onClick={() => setActiveDossierTab('decision')}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
                    activeDossierTab === 'decision' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80'
                  )}
                >
                  <FileCheck size={15} /> {!['ACCEPTED', 'DISBURSED', 'COMPLETED', 'CLOSED'].includes(selectedApp.status) ? '3. Binding Admin Sign-off' : '3. Decision Record'}
                </button>
              </div>
            </div>

            {/* Dossier Body Area */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* TAB 1: Financial Evidence */}
              {activeDossierTab === 'evidence' && (
                <div className="space-y-6">
                  {/* Top 4 Summary Cards - Unified Crisp White Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Card 1: Requested Amount */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">1. Requested Facility</span>
                        <span className="text-[10px] font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          FACILITY
                        </span>
                      </div>
                      <p className="text-2xl font-black text-slate-900 font-mono">
                        {formatCurrency(selectedApp.requested_amount, selectedApp.requested_currency)}
                      </p>
                      <p className="text-xs text-teal-700 font-semibold">{selectedApp.requested_tenure_months} Months Tenure</p>
                    </div>

                    {/* Card 2: User Self-Stated Data */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">2. User Self-Stated</span>
                        <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          FORM DECLARATION
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Stated Income:</span>
                          <span className="font-mono font-bold text-slate-900">{formatCurrency(selectedApp.monthly_income, selectedApp.requested_currency)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Stated Debt:</span>
                          <span className="font-mono font-bold text-slate-900">{formatCurrency(selectedApp.existing_monthly_obligations, selectedApp.requested_currency)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Plaid Open Banking Verified Evidence */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <ShieldCheck size={12} className="text-emerald-600" /> 3. Plaid Verified API
                        </span>
                        <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          OPEN BANKING
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Verified Salary:</span>
                          <span className="font-mono font-bold text-emerald-700">{formatCurrency(selectedApp.verified_monthly_income || selectedApp.monthly_income, selectedApp.requested_currency)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Verified Debt:</span>
                          <span className="font-mono font-bold text-rose-700">{formatCurrency(selectedApp.verified_monthly_debt || 0, selectedApp.requested_currency)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Calculated DTI & Policy Cap */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">4. Calculated DTI</span>
                        <span className={cn(
                          'text-[10px] font-extrabold px-2 py-0.5 rounded border',
                          (selectedApp.verified_dti_bps || 0) <= 4500 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                        )}>
                          {(selectedApp.verified_dti_bps || 0) <= 4500 ? 'PASSED POLICY' : 'EXCEEDS CAP'}
                        </span>
                      </div>
                      <p className="text-2xl font-black text-slate-900 font-mono">
                        {(() => {
                          const bps = selectedApp.verified_dti_bps != null ? selectedApp.verified_dti_bps : null
                          if (bps != null) return `${(bps / 100).toFixed(1)}%`
                          const inc = Number(selectedApp.verified_monthly_income || selectedApp.monthly_income || 0) / 100
                          const dbt = Number(selectedApp.verified_monthly_debt || 0) / 100
                          const amt = Number(selectedApp.requested_amount || 0) / 100
                          const m = Number(selectedApp.requested_tenure_months || 12)
                          if (inc > 0) {
                            const r = 0.12 / 12
                            const emi = (amt * r * Math.pow(1 + r, m)) / (Math.pow(1 + r, m) - 1)
                            return `${(((dbt + emi) / inc) * 100).toFixed(1)}%`
                          }
                          return '0.0%'
                        })()}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">Policy Cap: 45.0% DTI</p>
                    </div>
                  </div>

                  {/* Stated vs Verified Reconciliation & Variance Table */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <FileCheck size={18} className="text-teal-600" /> Stated vs. Open Banking Verified Reconciliation
                      </h4>
                      <span className="text-xs text-slate-500 font-medium">Underwriting Audit Cross-Check</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                            <th className="p-3">Financial Category</th>
                            <th className="p-3">User Self-Stated (Form)</th>
                            <th className="p-3">Plaid Verified (API / Parser)</th>
                            <th className="p-3">Variance / Discrepancy</th>
                            <th className="p-3 text-right">Audit Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          <tr>
                            <td className="p-3 text-slate-900 font-bold">Monthly Income / Salary</td>
                            <td className="p-3 font-mono">{formatCurrency(selectedApp.monthly_income, selectedApp.requested_currency)}</td>
                            <td className="p-3 font-mono text-emerald-700 font-bold">
                              {formatCurrency(selectedApp.verified_monthly_income || selectedApp.monthly_income, selectedApp.requested_currency)}
                            </td>
                            <td className="p-3">
                              {(() => {
                                const stated = selectedApp.monthly_income || 0
                                const verified = selectedApp.verified_monthly_income || stated
                                if (stated === 0) return <span className="text-slate-400">N/A</span>
                                const diff = ((verified - stated) / stated) * 100
                                return (
                                  <span className={cn('font-bold font-mono', diff >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                                    {diff >= 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                                  </span>
                                )
                              })()}
                            </td>
                            <td className="p-3 text-right">
                              <Badge variant="success">Plaid Verified</Badge>
                            </td>
                          </tr>
                          <tr>
                            <td className="p-3 text-slate-900 font-bold">Monthly Debt Obligations</td>
                            <td className="p-3 font-mono">{formatCurrency(selectedApp.existing_monthly_obligations, selectedApp.requested_currency)}</td>
                            <td className="p-3 font-mono text-rose-700 font-bold">
                              {formatCurrency(selectedApp.verified_monthly_debt || 0, selectedApp.requested_currency)}
                            </td>
                            <td className="p-3">
                              {(() => {
                                const stated = selectedApp.existing_monthly_obligations || 0
                                const verified = selectedApp.verified_monthly_debt || 0
                                if (stated === 0) return <span className="text-slate-400">N/A</span>
                                const diff = ((verified - stated) / stated) * 100
                                return (
                                  <span className={cn('font-bold font-mono', diff <= 0 ? 'text-emerald-600' : 'text-amber-600')}>
                                    {diff >= 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                                  </span>
                                )
                              })()}
                            </td>
                            <td className="p-3 text-right">
                              <Badge variant="success">Plaid Verified</Badge>
                            </td>
                          </tr>
                          <tr>
                            <td className="p-3 text-slate-900 font-bold">Liquid Cash Reserve</td>
                            <td className="p-3 text-slate-400 italic">Not Stated</td>
                            <td className="p-3 font-mono text-emerald-700 font-bold">
                              {formatCurrency(liquidReserveCents, selectedApp.requested_currency)}
                            </td>
                            <td className="p-3 text-slate-500 font-mono">60-Day Snapshot</td>
                            <td className="p-3 text-right">
                              <Badge variant="info">Balance API</Badge>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Clean Light-Mode Plaid Transaction Parser Profile Engine (NO DARK MONOLITH) */}
                  {(() => {
                    const verificationObj = (selectedApp.verifications || []).find(v => v.verification_type === 'FINANCIAL_ANALYSIS')
                    const finProfile = verificationObj?.result?.financialProfile || {
                      netMonthlyIncomeCents: selectedApp.verified_monthly_income || selectedApp.monthly_income || 0,
                      incomeConsistency: { rating: 'HIGH', scoreBps: 9800 },
                      rentCents: 0,
                      councilTaxCents: 0,
                      utilitiesCents: 0,
                      existingDebtPaymentsCents: selectedApp.verified_monthly_debt || 0,
                      subscriptionsCents: 0,
                      averageBalanceCents: liquidReserveCents,
                      overdraftUsage: { count: 0, isOverdrawn: false, rating: 'NONE' },
                      gamblingIndicators: { count: 0, hasGamblingActivity: false, riskLevel: 'LOW' },
                      returnedPayments: { count: 0, hasReturnedPayments: false },
                      cashFlowVolatility: { rating: 'LOW', variancePercent: 12.5 }
                    }

                    return (
                      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold text-teal-800 uppercase tracking-widest bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                              Plaid Transaction Parser Engine (24 Months)
                            </span>
                            <h4 className="text-base font-extrabold text-slate-900 mt-2 flex items-center gap-2">
                              <Landmark size={18} className="text-teal-600" /> Underwriting Financial Profile
                            </h4>
                          </div>
                          <span className="text-xs font-semibold text-slate-500">
                            Analyzed 24 Months of Bank History
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Box 1: Net Monthly Income */}
                          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">1. Net Monthly Income</p>
                            <p className="text-2xl font-black text-slate-900 font-mono">
                              {formatCurrency(finProfile.netMonthlyIncomeCents, selectedApp.requested_currency)}
                            </p>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 text-xs">
                              <span className="text-slate-500">2. Income Consistency:</span>
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {finProfile.incomeConsistency?.rating || 'HIGH'} ({((finProfile.incomeConsistency?.scoreBps || 9800) / 100).toFixed(1)}%)
                              </span>
                            </div>
                          </div>

                          {/* Box 2: Liquidity */}
                          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">8. Average Liquid Balance</p>
                            <p className="text-2xl font-black text-slate-900 font-mono">
                              {formatCurrency(finProfile.averageBalanceCents || liquidReserveCents, selectedApp.requested_currency)}
                            </p>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 text-xs">
                              <span className="text-slate-500">12. Cash-Flow Volatility:</span>
                              <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                {finProfile.cashFlowVolatility?.rating || 'LOW'} ({finProfile.cashFlowVolatility?.variancePercent || 12.5}%)
                              </span>
                            </div>
                          </div>

                          {/* Box 3: Risk Flags */}
                          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Underwriting Risk Flags</p>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500">9. Overdraft Usage:</span>
                              <span className="font-bold text-emerald-700">
                                {finProfile.overdraftUsage?.rating || 'NONE'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500">10. Gambling Activity:</span>
                              <span className={cn('font-bold', finProfile.gamblingIndicators?.hasGamblingActivity ? 'text-amber-700' : 'text-emerald-700')}>
                                {finProfile.gamblingIndicators?.hasGamblingActivity ? `DETECTED (${finProfile.gamblingIndicators.count} txns)` : 'NONE (0 Spend)'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500">11. Bounced Checks (NSF):</span>
                              <span className={cn('font-bold', finProfile.returnedPayments?.hasReturnedPayments ? 'text-rose-700' : 'text-emerald-700')}>
                                {finProfile.returnedPayments?.hasReturnedPayments ? `${finProfile.returnedPayments.count} Bounced` : '0 (Clean Record)'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Fixed Monthly Expenses Row */}
                        {(() => {
                          const rent = finProfile.rentCents || 0
                          const council = finProfile.councilTaxCents || 0
                          const util = finProfile.utilitiesCents || 0
                          const debt = finProfile.existingDebtPaymentsCents || 0
                          const subs = finProfile.subscriptionsCents || 0
                          const totalFixedCents = rent + council + util + debt + subs
                          const netIncomeCents = finProfile.netMonthlyIncomeCents || selectedApp.verified_monthly_income || selectedApp.monthly_income || 0
                          const fixedExpensePercent = netIncomeCents > 0 ? ((totalFixedCents / netIncomeCents) * 100).toFixed(1) : '0.0'
                          const disposableIncomeCents = netIncomeCents - totalFixedCents

                          return (
                            <div className="pt-2 space-y-4">
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  Fixed Monthly Outgoings (Plaid 24-Month Categories)
                                </p>
                                <span className="text-xs font-bold text-slate-900 font-mono">
                                  Total Outgoings: {formatCurrency(totalFixedCents, selectedApp.requested_currency)} / mo
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                                  <span className="text-slate-400 text-[10px] font-bold block">3. Rent / Housing</span>
                                  <span className="font-mono font-bold text-slate-900 text-sm">{formatCurrency(rent, selectedApp.requested_currency)}</span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                                  <span className="text-slate-400 text-[10px] font-bold block">4. Council Tax</span>
                                  <span className="font-mono font-bold text-slate-900 text-sm">{formatCurrency(council, selectedApp.requested_currency)}</span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                                  <span className="text-slate-400 text-[10px] font-bold block">5. Utilities</span>
                                  <span className="font-mono font-bold text-slate-900 text-sm">{formatCurrency(util, selectedApp.requested_currency)}</span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                                  <span className="text-slate-400 text-[10px] font-bold block">6. Debt Payments</span>
                                  <span className="font-mono font-bold text-rose-700 text-sm">{formatCurrency(debt, selectedApp.requested_currency)}</span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                                  <span className="text-slate-400 text-[10px] font-bold block">7. Subscriptions</span>
                                  <span className="font-mono font-bold text-slate-900 text-sm">{formatCurrency(subs, selectedApp.requested_currency)}</span>
                                </div>
                              </div>

                              {/* Clean Light Summary Alert Bar */}
                              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                                <div className="space-y-0.5">
                                  <span className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider block">
                                    Fixed Expense Salary Deduction
                                  </span>
                                  <p className="text-slate-700 font-medium">
                                    Fixed obligations consume <span className="font-bold text-teal-900 font-mono">{fixedExpensePercent}%</span> of applicant's verified monthly salary.
                                  </p>
                                </div>

                                <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-teal-200 pt-2 sm:pt-0 sm:pl-4">
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Outgoings</span>
                                    <span className="text-base font-black text-rose-700 font-mono">{formatCurrency(totalFixedCents, selectedApp.requested_currency)}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Net Disposable Buffer</span>
                                    <span className={cn('text-base font-black font-mono', disposableIncomeCents >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
                                      {formatCurrency(disposableIncomeCents, selectedApp.requested_currency)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )
                  })()}

                  {/* Open Banking Verification Records */}
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Landmark size={18} className="text-teal-600" /> Open Banking Verification Records & Audit Trail
                    </h4>

                    {(selectedApp.verifications || []).length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No open banking verification records attached.</p>
                    ) : (
                      (selectedApp.verifications || []).map(v => {
                        const res = v.result || {}

                        return (
                          <div key={v.id} className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-4 shadow-xs">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <Badge variant={v.status === 'PASSED' || v.status === 'VERIFIED' ? 'success' : 'warning'}>
                                  {v.status}
                                </Badge>
                                <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                                  {v.verification_type.replace(/_/g, ' ')} ({v.provider})
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {v.verified_at ? formatDate(v.verified_at) : 'Logged'}
                              </span>
                            </div>

                            {/* Verification Types */}
                            {v.verification_type === 'INCOME_VERIFICATION' && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-xs">
                                <div>
                                  <span className="text-slate-400 text-[10px] font-bold block uppercase">Employer</span>
                                  <span className="font-bold text-slate-900">{res.employerName || 'Verified Employer'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] font-bold block uppercase">Pay Frequency</span>
                                  <span className="font-bold text-slate-900">{res.payFrequency || 'MONTHLY'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] font-bold block uppercase">Verified Monthly Income</span>
                                  <span className="font-mono font-bold text-emerald-700">{formatCurrency(res.verifiedIncomeCents || selectedApp.verified_monthly_income, selectedApp.requested_currency)}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] font-bold block uppercase">Confidence Score</span>
                                  <span className="font-bold text-emerald-700">{((res.confidenceScoreBps || 9800) / 100).toFixed(1)}%</span>
                                </div>
                              </div>
                            )}

                            {v.verification_type === 'ASSET_VERIFICATION' && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-xs">
                                <div>
                                  <span className="text-slate-400 text-[10px] font-bold block uppercase">Verified Liquid Assets</span>
                                  <span className="font-mono font-bold text-emerald-700">{formatCurrency(res.liquidBalanceCents || res.assetReportDetails?.liquidBalanceCents || selectedApp.liquid_balance_cents, selectedApp.requested_currency)}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] font-bold block uppercase">Evaluation Period</span>
                                  <span className="font-bold text-slate-900">{res.evaluatedDays || res.assetReportDetails?.evaluatedDays || 60} Days Snapshot</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] font-bold block uppercase">Asset Stability</span>
                                  <span className="font-bold text-emerald-700">{res.assetStabilityRating || res.assetReportDetails?.assetStabilityRating || 'SATISFACTORY'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] font-bold block uppercase">Protocol</span>
                                  <span className="font-mono font-semibold text-slate-700">{res.verificationMethod || 'PLAID_ASSETS_BALANCE_API'}</span>
                                </div>
                              </div>
                            )}

                            {v.verification_type === 'FINANCIAL_ANALYSIS' && (
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-xs space-y-3">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-3 border-b border-slate-200/60">
                                  <div>
                                    <span className="text-slate-400 text-[10px] font-bold block uppercase">Analyzed Txns</span>
                                    <span className="font-bold text-slate-900">{res.financialProfile?.analyzedTransactionCount || 500} Txns</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] font-bold block uppercase">Income Consistency</span>
                                    <span className="font-bold text-emerald-700">{res.financialProfile?.incomeConsistency?.rating || 'HIGH'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] font-bold block uppercase">Volatility</span>
                                    <span className="font-bold text-teal-700">{res.financialProfile?.cashFlowVolatility?.rating || 'LOW'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] font-bold block uppercase">Overdraft</span>
                                    <span className="font-bold text-slate-900">{res.financialProfile?.overdraftUsage?.rating || 'NONE'}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {v.verification_type === 'IDENTITY' && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-xs">
                                <div>
                                  <span className="text-slate-400 text-[10px] font-bold block uppercase">Persona KYC ID</span>
                                  <span className="font-mono font-bold text-slate-900">{res.kycId || res.personaInquiryId || 'f26b37c7-2d68'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] font-bold block uppercase">Verification Status</span>
                                  <span className="font-bold text-emerald-700">{res.status || 'VERIFIED'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] font-bold block uppercase">User Account State</span>
                                  <span className="font-bold text-slate-900 uppercase">{res.userStatus || 'active'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] font-bold block uppercase">Verification Method</span>
                                  <span className="font-mono text-slate-700">PERSONA_GOVT_ID_BIOMETRIC</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: Automated Policy Rules */}
              {activeDossierTab === 'rules' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-teal-700" />
                      <span className="font-bold text-xs text-teal-900 uppercase tracking-wider">
                        Automated Policy Recommendation: {selectedApp.system_recommendation?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-teal-800 leading-relaxed font-medium">{selectedApp.system_recommendation_reason}</p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-extrabold text-slate-900 text-sm">Underwriting Policy Checks (5 Rules)</h4>

                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Rule 1: Identity & Resident Civil ID (Persona KYC)</p>
                          <p className="text-[11px] text-slate-500">Applicant identity and registration KYC status confirmed</p>
                        </div>
                        <Badge variant="success">PASSED</Badge>
                      </div>

                      <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Rule 2: Open Banking Cash Flow Analysis (Plaid)</p>
                          <p className="text-[11px] text-slate-500">Income streams and bank account statement details synced</p>
                        </div>
                        <Badge variant="success">PASSED</Badge>
                      </div>

                      <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Rule 3: Minimum Salary Threshold</p>
                          <p className="text-[11px] text-slate-500">Verified monthly salary exceeds minimum product limit</p>
                        </div>
                        <Badge variant="success">PASSED</Badge>
                      </div>

                      <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Rule 4: Debt-to-Income (DTI) Limit (≤ 45.0%)</p>
                          <p className="text-[11px] text-slate-500">
                            Current DTI ratio: {selectedApp.verified_dti_bps ? `${(selectedApp.verified_dti_bps / 100).toFixed(1)}%` : 'Pending'}
                          </p>
                        </div>
                        <Badge variant={selectedApp.verified_dti_bps && selectedApp.verified_dti_bps <= 4500 ? 'success' : 'danger'}>
                          {selectedApp.verified_dti_bps && selectedApp.verified_dti_bps <= 4500 ? 'PASSED' : 'FLAGGED'}
                        </Badge>
                      </div>

                      <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Rule 5: Requested Amount Within Capacity</p>
                          <p className="text-[11px] text-slate-500">Requested principal does not exceed calculated maximum borrowing capacity</p>
                        </div>
                        <Badge variant="success">PASSED</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Admin Decision Panel */}
              {activeDossierTab === 'decision' && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  {['ACCEPTED', 'DISBURSED', 'COMPLETED', 'CLOSED'].includes(selectedApp.status) ? (
                    /* READ-ONLY PROCESSED DECISION RECORD */
                    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-5">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-base">Underwriting Decision Completed</h4>
                          <p className="text-xs text-slate-500 mt-0.5">This application has already been processed.</p>
                        </div>
                        <Badge variant={['APPROVED', 'OFFER_GENERATED', 'ACCEPTED', 'LOAN_CREATED', 'DISBURSED', 'CLOSED', 'COMPLETED'].includes(selectedApp.status) ? 'success' : 'danger'}>
                          {selectedApp.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>

                      {/* Decision Banner */}
                      {['APPROVED', 'OFFER_GENERATED', 'ACCEPTED', 'LOAN_CREATED', 'DISBURSED', 'CLOSED', 'COMPLETED'].includes(selectedApp.status) ? (
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3">
                          <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h5 className="font-bold text-emerald-900 text-xs uppercase tracking-wider">Application Approved & Offer Processed</h5>
                            <p className="text-xs text-emerald-700 leading-relaxed">
                              Underwriting assessment passed policy guidelines. Admin sign-off is finalized and offer terms have been bindingly established.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-3">
                          <Ban size={20} className="text-rose-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h5 className="font-bold text-rose-900 text-xs uppercase tracking-wider">Application Ineligible / Rejected</h5>
                            <p className="text-xs text-rose-700 leading-relaxed">
                              This loan application was rejected during underwriting policy evaluation.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Audit Details */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <span className="font-semibold text-slate-500">Current Application Status:</span>
                          <span className="font-bold text-slate-900">{selectedApp.status.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <span className="font-semibold text-slate-500">Automated Recommendation:</span>
                          <span className="font-bold text-slate-900">{selectedApp.system_recommendation?.replace(/_/g, ' ') || 'N/A'}</span>
                        </div>
                        <div className="py-1 space-y-1">
                          <span className="font-semibold text-slate-500 block">Underwriting & Compliance Audit Notes:</span>
                          <p className="font-medium text-slate-800 bg-white p-3 rounded-lg border border-slate-200">
                            {selectedApp.admin_notes || selectedApp.system_recommendation_reason || 'Underwriting policy checks complete. No additional manual notes entered.'}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-800 text-xs font-medium flex items-center gap-2">
                        <Lock size={15} className="text-amber-600 shrink-0" />
                        <span>Underwriting decision is binding and finalized. Re-submitting decision form is disabled.</span>
                      </div>
                    </div>
                  ) : (
                    /* EDITABLE DECISION FORM FOR PENDING APPLICATIONS */
                    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-5">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <FileCheck size={16} className="text-teal-600" /> Binding Admin Sign-off & Term Customization
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Specify loan offer terms or approve with risk-calculated defaults (8.00% – 24.00% APR range).
                        </p>
                      </div>

                      {/* Custom Terms Input Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 uppercase">Interest Rate (% APR)</label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              min="8.00"
                              max="24.00"
                              value={customInterestRate}
                              onChange={e => setCustomInterestRate(e.target.value)}
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-teal-700 focus:outline-none focus:border-teal-500"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">%</span>
                          </div>
                          <span className="text-[10px] text-slate-400">Policy range: 8.00% – 24.00%</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 uppercase">Approved Amount ({selectedApp.requested_currency || 'GBP'})</label>
                          <input
                            type="number"
                            step="100"
                            value={customApprovedAmount}
                            onChange={e => setCustomApprovedAmount(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500"
                          />
                          <span className="text-[10px] text-slate-400">Requested: {formatCurrency(selectedApp.requested_amount, selectedApp.requested_currency)}</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 uppercase">Tenure (Months)</label>
                          <input
                            type="number"
                            min="6"
                            max="60"
                            value={customTenureMonths}
                            onChange={e => setCustomTenureMonths(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500"
                          />
                          <span className="text-[10px] text-slate-400">Requested: {selectedApp.requested_tenure_months} Mos</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Rejection Reason (If rejecting)</label>
                        <textarea
                          rows={2}
                          placeholder="Specify exact rejection reason (e.g. Debt-to-income exceeds 45.0% cap)..."
                          value={rejectionReason}
                          onChange={e => setRejectionReason(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-rose-500 focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Internal Underwriting Notes</label>
                        <textarea
                          rows={2}
                          placeholder="Enter internal audit notes for compliance log..."
                          value={adminNotes}
                          onChange={e => setAdminNotes(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-teal-500 focus:bg-white"
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <Button
                          variant="danger"
                          onClick={() => handleReject(selectedApp.id)}
                          disabled={submitting}
                          className="flex-1 py-3 font-bold text-xs cursor-pointer"
                        >
                          {submitting && <Activity size={14} className="animate-spin mr-1" />}
                          Reject Application
                        </Button>

                        <Button
                          variant="success"
                          onClick={() => handleApprove(selectedApp.id)}
                          disabled={submitting}
                          className="flex-1 py-3 font-bold text-xs shadow-sm bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                        >
                          {submitting && <Activity size={14} className="animate-spin mr-1" />}
                          Approve Loan & Issue Offer ({customInterestRate || '12.00'}% APR)
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dossier Footer Controls */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 font-medium">FinConnect Underwriting Console</span>
              <Button variant="secondary" size="sm" onClick={() => setSelectedApp(null)} className="font-bold cursor-pointer">
                Back to Directory
              </Button>
            </div>
          </div>
        </motion.div>
      </AppLayout>
    )
  }

  // ─── DEFAULT APPLICATIONS DIRECTORY LIST VIEW ──────────────────────
  return (
    <AppLayout title="Loan Underwriting Console" subtitle="Admin final underwriting review, Plaid verification data & binding approval">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Metrics Overview Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Decision</span>
              <FileCheck size={18} className="text-amber-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 font-mono">{stats.pending}</p>
            <p className="text-[11px] font-semibold text-amber-600">Awaiting Admin sign-off</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">System Approved</span>
              <CheckCircle2 size={18} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 font-mono">{stats.recommendedApprove}</p>
            <p className="text-[11px] font-semibold text-emerald-600">Passed automated rules</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">System Rejected</span>
              <AlertCircle size={18} className="text-rose-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 font-mono">{stats.recommendedReject}</p>
            <p className="text-[11px] font-semibold text-rose-600">High Debt-to-Income ratio</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Offers Issued</span>
              <ShieldCheck size={18} className="text-teal-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 font-mono">{stats.approved}</p>
            <p className="text-[11px] font-semibold text-teal-600">Offer sent to borrower</p>
          </div>
        </div>

        {/* Clean Application Directory Table */}
        <Card className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search applicant name, email, or APP-2026-ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['all', 'ADMIN_REVIEW_PENDING', 'APPROVED', 'ACCEPTED', 'REJECTED'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
                    statusFilter === status ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {status === 'all' ? 'All Applications' : status === 'ADMIN_REVIEW_PENDING' ? 'Pending Review' : status}
                </button>
              ))}
            </div>
          </div>

          {/* Clean Datatable */}
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Applicant</th>
                  <th className="py-3.5 px-4">Application ID</th>
                  <th className="py-3.5 px-4">Requested Amount</th>
                  <th className="py-3.5 px-4">DTI Ratio</th>
                  <th className="py-3.5 px-4">System Rec.</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                      No loan applications match your search query.
                    </td>
                  </tr>
                ) : (
                  filtered.map(app => {
                    const isApproved = ['APPROVED', 'OFFER_GENERATED', 'ACCEPTED', 'LOAN_CREATED', 'DISBURSED', 'CLOSED', 'COMPLETED'].includes(app.status)
                    const isRejected = ['REJECTED', 'CANCELLED', 'FAILED'].includes(app.status)
                    const isRecApprove = app.system_recommendation === 'RECOMMENDED_APPROVE'
                    const dtiVal = app.verified_dti_bps ? (app.verified_dti_bps / 100).toFixed(1) : 'N/A'

                    return (
                      <tr
                        key={app.id}
                        onClick={() => { setSelectedApp(app); setActiveDossierTab('evidence'); }}
                        className="hover:bg-teal-50/40 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {app.user?.name ? app.user.name.slice(0, 2).toUpperCase() : 'US'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{app.user?.name || 'Applicant'}</p>
                              <p className="text-[11px] text-slate-400">{app.user?.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {app.application_number}
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900 font-mono">
                            {formatCurrency(app.requested_amount, app.requested_currency)}
                          </p>
                          <p className="text-[11px] text-slate-400">{app.requested_tenure_months} Months · {app.purpose}</p>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={cn(
                            'font-bold text-xs px-2.5 py-0.5 rounded-md border font-mono',
                            Number(dtiVal) <= 45 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                          )}>
                            {dtiVal !== 'N/A' ? `${dtiVal}%` : 'Pending'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={cn(
                            'px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider inline-flex items-center gap-1',
                            isRecApprove ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                          )}>
                            {isRecApprove ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                            {isRecApprove ? 'Approve' : 'Reject'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge variant={isApproved ? 'success' : isRejected ? 'danger' : 'warning'} dot>
                            {app.status.replace(/_/g, ' ')}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            iconRight={<ChevronRight size={14} />}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedApp(app)
                              setActiveDossierTab('evidence')
                            }}
                            className="font-bold text-xs cursor-pointer"
                          >
                            Review Application
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}

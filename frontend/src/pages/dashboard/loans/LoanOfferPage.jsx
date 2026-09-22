import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePlaidLink } from 'react-plaid-link'
import { motion } from 'framer-motion'
import { ShieldCheck, CheckCircle2, ArrowRight, Activity, Calendar, Lock, ChevronLeft, Landmark, FileCheck, Check } from 'lucide-react'
import { AppLayout, BreadcrumbBar } from '@/components/layout/AppLayout'
import { Card, Button, Badge } from '@/components/ui'
import { loanApi } from '@/services/loanApi'
import { formatDate, cn, formatCurrency } from '@/lib/utils'
import { formatPence } from '@/lib/currencyFormatters'
import { useNotifications } from '@/hooks/useNotifications'

export default function LoanOfferPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useNotifications()
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [linkToken, setLinkToken] = useState(null)
  const [currentConsentId, setCurrentConsentId] = useState(null)

  const fetchOffer = async () => {
    try {
      const data = await loanApi.getApplicationById(id)
      setApp(data)
    } catch (err) {
      console.error('Failed to fetch offer:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOffer()
  }, [id])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async () => {
      setAccepting(true)
      try {
        await loanApi.acceptOffer(app.id, app.offer.id, { consentId: currentConsentId })
        addToast({
          title: 'Loan Disbursed & AutoPay Active',
          message: 'Your repayment mandate was authorized and loan funds have been disbursed to your account.',
          type: 'success',
        })
        navigate(`/app/emi/${app.id}`)
      } catch (err) {
        addToast({
          title: 'Acceptance Error',
          message: err.message || 'Failed to complete loan acceptance',
          type: 'error',
        })
        fetchOffer()
      } finally {
        setAccepting(false)
        setLinkToken(null)
        setCurrentConsentId(null)
      }
    },
    onExit: (err) => {
      setAccepting(false)
      setLinkToken(null)
      setCurrentConsentId(null)
      if (err) {
        addToast({
          title: 'Mandate Authorization Cancelled',
          message: err.message || 'Bank mandate authorization was cancelled. Funds have not been disbursed.',
          type: 'warning',
        })
      }
    },
  })

  useEffect(() => {
    if (ready && linkToken) {
      open()
    }
  }, [ready, open, linkToken])

  const handleStartAcceptance = async () => {
    if (!app?.offer?.id) return
    setAccepting(true)
    try {
      const res = await loanApi.setupOfferAutopay(app.id, app.offer.id)
      if (res?.link_token && res?.consent_id) {
        setCurrentConsentId(res.consent_id)
        setLinkToken(res.link_token)
      } else {
        throw new Error('Failed to obtain bank mandate authorization token')
      }
    } catch (err) {
      addToast({
        title: 'AutoPay Setup Error',
        message: err.message || 'Failed to initialize AutoPay mandate setup',
        type: 'error',
      })
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Official Loan Offer" subtitle="Review binding loan offer terms and interest breakdown">
        <div className="p-12 text-slate-500 font-semibold flex items-center justify-center gap-2">
          <Activity size={20} className="animate-spin text-teal-600" /> Retrieving official loan offer document...
        </div>
      </AppLayout>
    )
  }

  if (!app || !app.offer) {
    return (
      <AppLayout title="Official Loan Offer" subtitle="Offer status notice">
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
          <div className="p-12 text-slate-500 font-medium text-center bg-white border border-slate-200/80 rounded-2xl">
            Loan offer is not yet available for this application.
          </div>
        </div>
      </AppLayout>
    )
  }

  const offer = app.offer
  const currency = app.requested_currency || 'GBP'

  const formatCurrency = formatPence

  const isAccepted = offer.status === 'ACCEPTED' || app.status === 'ACCEPTED' || app.status === 'DISBURSED'

  return (
    <AppLayout title="Official Binding Loan Offer" subtitle={`Application Reference: #${app.application_number}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb Bar */}
        <BreadcrumbBar
          items={[
            { label: 'Loans Portal', to: '/app/loans' },
            { label: `Application #${app.application_number}` },
            { label: 'Loan Agreement' }
          ]}
          rightElement={
            <Badge variant={isAccepted ? 'success' : 'warning'}>
              {app.status === 'DISBURSED' ? 'Loan Disbursed & Active' : isAccepted ? 'Offer Accepted' : 'Offer Ready for Signature'}
            </Badge>
          }
        />

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Terms & Breakdown (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Clean White Approved Offer Banner */}
            <Card className="p-6 bg-white border border-slate-200/90 shadow-xs rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-[10px] font-extrabold uppercase tracking-wider border border-teal-200 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-teal-600" /> FinConnect Binding Loan Agreement
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">#{app.application_number}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Approved Loan Amount</span>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">{formatCurrency(offer.approved_amount)}</p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Sanctioned under open banking underwriting guidelines. Interest rates fixed for full tenure after Plaid affordability check.
              </p>
            </Card>

            {/* Financial Terms & Breakdown Grid */}
            <Card className="p-6 bg-white border border-slate-200/90 shadow-xs rounded-2xl space-y-6">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-base">Approved Repayment Terms</h3>
                <p className="text-xs text-slate-500 mt-0.5">Key schedule metrics for your pre-approved financing offer</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fixed Monthly Payment (EMI)</span>
                  <p className="text-xl font-black text-slate-900 font-mono">{formatCurrency(offer.estimated_emi)}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Auto-debit on 1st of each month</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Interest Rate (Fixed APR)</span>
                  <p className="text-xl font-black text-teal-700 font-mono">{(offer.interest_rate_bps / 100).toFixed(2)}% APR</p>
                  <p className="text-[11px] text-slate-500 font-medium">Fixed rate throughout term</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approved Tenure</span>
                  <p className="text-xl font-black text-slate-900">{offer.tenure_months} Months</p>
                  <p className="text-[11px] text-slate-500 font-medium">Total duration ({offer.tenure_months / 12} years)</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Interest Charge</span>
                  <p className="text-xl font-black text-slate-900 font-mono">{formatCurrency(offer.total_interest)}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Total financing cost over tenure</p>
                </div>
              </div>

              {/* Total Repayment Summary Alert */}
              <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-teal-900">Total Repayment Amount</p>
                  <p className="text-xs text-slate-600 font-medium">Principal amount plus cumulative interest over full term</p>
                </div>
                <p className="text-2xl font-black text-teal-800 font-mono">{formatCurrency(offer.total_repayment)}</p>
              </div>

              {/* Action Area */}
              <div className="pt-2">
                {isAccepted ? (
                  <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-emerald-900">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                      <div>
                        <h4 className="font-extrabold text-sm">
                          {app.status === 'DISBURSED' ? 'Loan Executed & Funds Disbursed' : 'Loan Agreement Accepted & Binding'}
                        </h4>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          {app.status === 'DISBURSED'
                            ? `Funds successfully disbursed on ${formatDate(app.updatedAt || new Date())}. AutoPay is active.`
                            : `Signed on ${formatDate(offer.accepted_at || new Date())}. Funds queued for disbursement.`}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate(`/app/emi/${app.id}`)}
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                    >
                      View Servicing & AutoPay
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-teal-50/80 border border-teal-200/80 rounded-xl text-xs text-teal-900 flex items-start gap-2.5">
                      <ShieldCheck size={18} className="text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Mandate-First Repayment Security</p>
                        <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                          To protect borrower credit standing, you will authorize your monthly Variable Recurring Payment (VRP) AutoPay mandate of <strong className="text-slate-900">{formatCurrency(offer.estimated_emi)}</strong> directly with your linked bank. Capital is immediately disbursed once authorized.
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={handleStartAcceptance}
                      disabled={accepting}
                      className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 rounded-xl cursor-pointer"
                    >
                      {accepting ? <Activity size={16} className="animate-spin" /> : <Lock size={15} />}
                      {accepting ? 'Connecting to Bank Mandate...' : 'Authorize AutoPay & Accept Loan'} <ArrowRight size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Summary Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
            <Card className="p-5 bg-white border border-slate-200/90 shadow-xs rounded-2xl space-y-4">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <FileCheck size={15} className="text-teal-600" /> Compliance Details
              </h4>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Agreement Reference:</span>
                  <span className="font-mono font-bold text-slate-900">#{app.application_number}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Borrower:</span>
                  <span className="font-bold text-slate-900">{app.user?.name || 'Borrower'}</span>
                </div>
                <div className="flex justify-between items-start py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tied Bank Account:</span>
                  <span className="font-bold text-teal-800 text-right font-mono">
                    {app.bankAccount ? (
                      <>
                        {app.bankAccount.connection?.bank_name || 'Bank'} · {app.bankAccount.account_name}
                        <br />
                        <span className="text-[10px] text-slate-400 font-normal">
                          {app.bankAccount.iban || app.bankAccount.account_number || 'Linked'}
                        </span>
                      </>
                    ) : (
                      'Dedicated Linked Account'
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Offer Expiry:</span>
                  <span className="font-bold text-slate-900">{formatDate(offer.expires_at)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Security Signature:</span>
                  <span className="font-bold text-teal-700">AES-256 Encrypted</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1 font-bold text-slate-800">
                  <Lock size={12} className="text-teal-600" /> Legal Notice
                </div>
                <p className="leading-relaxed">
                  Acceptance creates a legally binding loan agreement under banking regulations. Monthly payments will be debited according to schedule.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}


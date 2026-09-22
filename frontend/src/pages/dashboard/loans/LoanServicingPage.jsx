import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, Button, Badge } from '@/components/ui'
import { loanApi } from '@/services/loanApi'
import { ChevronRight, Calendar, DollarSign, Activity, AlertCircle, ShieldCheck, Landmark } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import { formatPence } from '@/lib/currencyFormatters'
import { useApp } from '@/store/AppContext'
import { usePlaidLink } from 'react-plaid-link'

export default function LoanServicingPage() {
  const { id } = useParams() // application id
  const navigate = useNavigate()
  const { addToast, setActiveLoanApplicationId } = useApp()
  
  const [application, setApplication] = useState(null)
  const [allActiveLoans, setAllActiveLoans] = useState([])
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [linkToken, setLinkToken] = useState(null)
  const [linkAction, setLinkAction] = useState(null) // 'AUTOPAY' | 'MANUAL'
  const [currentConsentId, setCurrentConsentId] = useState(null)

  const formatCurrency = formatPence

  const loadData = async () => {
    try {
      setLoading(true)
      const allApps = await loanApi.getApplications()
      const activeApps = (allApps || []).filter(app => ['LOAN_CREATED', 'DISBURSED', 'ACTIVE', 'CLOSED', 'COMPLETED'].includes(app.status))
      setAllActiveLoans(activeApps)

      let targetId = id;
      let appData = null;

      // Check if targetId is provided and actually belongs to the user's active loans
      if (!targetId || !activeApps.some(a => a.id === targetId)) {
        if (activeApps.length === 0) {
          setApplication(null)
          setActiveLoanApplicationId(null)
          sessionStorage.removeItem('activeLoanAppId')
          if (id) {
            window.history.replaceState(null, '', '/app/emi')
          }
          setLoading(false)
          return
        }
        appData = activeApps[0]
        targetId = activeApps[0].id
        setActiveLoanApplicationId(targetId)
        sessionStorage.setItem('activeLoanAppId', targetId)
        window.history.replaceState(null, '', `/app/emi/${targetId}`)
      } else {
        appData = await loanApi.getApplicationById(targetId)
      }

      setApplication(appData)

      if (appData?.loan?.id) {
        const schedData = await loanApi.getLoanSchedule(appData.loan.id)
        setSchedule(schedData || [])
      }
    } catch (error) {
      addToast({ title: 'Error', message: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async () => {
      setPaying(false)
      if (linkAction === 'AUTOPAY' && currentConsentId) {
        try {
          await loanApi.activateAutopay(application.loan.id, currentConsentId)
          addToast({ title: 'Success', message: 'AutoPay activated successfully!', type: 'success' })
          loadData()
        } catch (err) {
          addToast({ title: 'Error', message: err.message, type: 'error' })
        }
      } else if (linkAction === 'MANUAL') {
        addToast({ title: 'Success', message: 'Payment authorized successfully!', type: 'success' })
      }
      setLinkToken(null)
      setCurrentConsentId(null)
      loadData()
    },
    onExit: (err) => {
      setPaying(false)
      setLinkToken(null)
      setCurrentConsentId(null)
      if (err) addToast({ title: 'Link Cancelled', message: err.message, type: 'error' })
    }
  })

  useEffect(() => {
    if (ready && linkToken) open()
  }, [ready, open, linkToken])

  const handleSetupAutopay = async () => {
    try {
      setPaying(true)
      const emiAmount = schedule.find(s => s.status === 'PENDING')?.scheduled_amount || application.loan.original_principal;
      const res = await loanApi.setupAutopay(application.loan.id, {
        maxMonthlyAmountMinor: emiAmount
      })
      if (res.link_token) {
        setLinkAction('AUTOPAY')
        setCurrentConsentId(res.consent_id)
        setLinkToken(res.link_token)
      } else {
        addToast({ title: 'Error', message: 'Failed to retrieve Plaid Link token', type: 'error' })
        setPaying(false)
      }
    } catch (error) {
      addToast({ title: 'Setup Failed', message: error.message, type: 'error' })
      setPaying(false)
    }
  }

  const handleManualPayment = async (amountMinor) => {
    try {
      setPaying(true)
      const res = await loanApi.initiateManualPayment(application.loan.id, {
        amountMinor,
        paymentType: 'EMI'
      })
      if (res.link_token) {
        setLinkAction('MANUAL')
        setLinkToken(res.link_token)
      } else {
        addToast({ title: 'Error', message: 'Failed to retrieve Plaid Link token', type: 'error' })
        setPaying(false)
      }
    } catch (error) {
      addToast({ title: 'Payment Failed', message: error.message, type: 'error' })
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Loan Servicing" subtitle="Manage your loan repayment">
        <div className="p-12 text-center text-slate-500 flex justify-center items-center gap-2">
          <Activity size={18} className="animate-spin text-teal-600" /> Loading details...
        </div>
      </AppLayout>
    )
  }

  if (!application?.loan) {
    return (
      <AppLayout title="Loan Servicing & EMI Management" subtitle="Manage your active loan repayments and amortization schedules">
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Link to="/app/loans" className="text-slate-600 hover:text-brand-600 transition-colors">Loans Portal</Link>
              <ChevronRight size={14} className="text-slate-300" />
              <span className="text-slate-900 font-bold">Servicing</span>
            </div>
            <Link to="/app/loans" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600 bg-slate-50 hover:bg-brand-50 px-3 py-1.5 rounded-xl border border-slate-200/80 transition-all">
              ← Back to Loans Portal
            </Link>
          </div>

          {/* Empty State Card */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs text-center max-w-2xl mx-auto space-y-6 my-8">
            <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto border border-teal-100">
              <ShieldCheck size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">No Active Loan Found</h3>
              <p className="text-sm text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                You do not currently have an active disbursed loan to service. Apply for a new loan or check your pre-qualified limit to get started.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => navigate('/app/loans/eligibility')}
                className="w-full sm:w-auto font-bold text-xs px-6 py-2.5 cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-800"
              >
                Check Eligibility
              </Button>
              <Button
                onClick={() => navigate('/app/loans/apply')}
                className="w-full sm:w-auto font-bold text-xs px-6 py-2.5 cursor-pointer bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
              >
                Apply for a Loan
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  const loan = application.loan

  return (
    <AppLayout title="Loan Servicing" subtitle="Manage your loan repayment and amortization schedule">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link to="/app/loans" className="text-slate-600 hover:text-brand-600 transition-colors">Loans Portal</Link>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="text-slate-900 font-bold">Servicing</span>
          </div>
        </div>

        {/* Multi-Loan Switcher Bar */}
        {allActiveLoans.length > 1 && (
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Landmark size={15} className="text-teal-600" /> Active Loans ({allActiveLoans.length})
              </span>
              <span className="text-[11px] font-semibold text-slate-400">Select a loan to view individual schedule and repayments</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
              {allActiveLoans.map((app, idx) => {
                const isSelected = app.id === application?.id
                return (
                  <button
                    key={app.id}
                    onClick={() => navigate(`/app/emi/${app.id}`)}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer border",
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-slate-900/20"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200/90"
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0", isSelected ? "bg-teal-400 animate-pulse" : "bg-slate-400")} />
                    <span>Loan #{idx + 1} ({app.application_number || app.id.slice(0, 8)})</span>
                    <span className={cn("font-mono font-black ml-1 px-2 py-0.5 rounded-lg text-[11px]", isSelected ? "bg-white/10 text-teal-300" : "bg-slate-200/70 text-slate-900")}>
                      {formatCurrency(app.loan?.original_principal || app.requested_amount, app.requested_currency)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Loan Summary Header */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <Badge variant="success" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              {loan.status}
            </Badge>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Original Loan Principal</div>
            <h2 className="text-2xl font-black text-white font-mono">
              {formatCurrency(loan.original_principal, loan.currency)}
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Interest Rate: {(loan.interest_rate_bps / 100).toFixed(2)}% | Term: {loan.tenure_months} Months
            </p>
          </div>
          
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-lg shrink-0">
                🏦
              </div>
              <div>
                <span className="text-[10px] text-teal-300 font-bold uppercase tracking-wider block">Dedicated Servicing Account</span>
                <p className="text-xs font-bold text-white">
                  {application?.bankAccount ? (
                    `${application.bankAccount.connection?.bank_name || 'Bank'} · ${application.bankAccount.account_name} (${application.bankAccount.iban || application.bankAccount.account_number || 'Linked'})`
                  ) : (
                    'Designated Account'
                  )}
                </p>
                <span className="text-[10px] text-slate-400">All disbursements & repayments bound to this account</span>
              </div>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-4 flex flex-col items-start sm:items-end">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Outstanding Principal</span>
              <span className="text-xl font-bold font-mono text-white">
                {formatCurrency(loan.principal_outstanding, loan.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* AutoPay & Payments Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-teal-600" />
                  AutoPay (Variable Recurring Payment)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Automatically sweep monthly EMIs exclusively from your designated loan account:
                  <strong className="text-slate-700 block mt-0.5">
                    {application?.bankAccount ? `${application.bankAccount.connection?.bank_name || 'Bank'} · ${application.bankAccount.account_name}` : 'Tied Bank Account'}
                  </strong>
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              {application.loan.autopay?.status === 'ACTIVE' ? (
                <>
                  <Badge variant="success">Active</Badge>
                  <Button disabled className="bg-slate-300 text-slate-500 cursor-not-allowed text-xs font-bold px-4 py-2">
                    AutoPay Configured
                  </Button>
                </>
              ) : (
                <>
                  <Badge variant="warning">Inactive</Badge>
                  <Button onClick={handleSetupAutopay} className="bg-teal-600 text-white hover:bg-teal-700 text-xs font-bold px-4 py-2">
                    Set Up AutoPay
                  </Button>
                </>
              )}
            </div>
          </Card>

          <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <DollarSign size={18} className="text-slate-600" />
                Manual Payment
              </h3>
              <p className="text-xs text-slate-500 mt-1">Pay your upcoming EMI or make an additional principal payment.</p>
            </div>
            
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button 
                onClick={() => handleManualPayment(schedule.find(s => s.status === 'PENDING')?.scheduled_amount || 0)} 
                disabled={paying || !schedule.find(s => s.status === 'PENDING')}
                variant="outline" 
                className="text-xs font-bold"
              >
                {paying ? 'Processing...' : 'Pay Next EMI'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Amortization Schedule Table */}
        <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-slate-600" />
            <h3 className="font-bold text-slate-900">Amortization Schedule</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-bold rounded-tl-xl">EMI #</th>
                  <th className="px-4 py-3 font-bold">Due Date</th>
                  <th className="px-4 py-3 font-bold text-right">Amount</th>
                  <th className="px-4 py-3 font-bold text-right">Principal</th>
                  <th className="px-4 py-3 font-bold text-right">Interest</th>
                  <th className="px-4 py-3 font-bold rounded-tr-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedule.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400 text-xs">No schedule found.</td>
                  </tr>
                ) : (
                  schedule.map((emi) => (
                    <tr key={emi.installment_number} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-600">{emi.installment_number}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{formatDate(emi.due_date)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(emi.scheduled_amount, loan.currency)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        {formatCurrency(emi.scheduled_principal, loan.currency)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        {formatCurrency(emi.scheduled_interest, loan.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={emi.status === 'PAID' ? 'success' : 'warning'}>
                          {emi.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}

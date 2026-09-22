import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, ShieldCheck, Landmark, Activity, Briefcase, FileText, ChevronLeft, Calculator, Lock, AlertCircle } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, Button, Select } from '@/components/ui'
import { loanApi } from '@/services/loanApi'
import { useApp } from '@/store/AppContext'
import { cn } from '@/lib/utils'
import { formatPence } from '@/lib/currencyFormatters'

export default function LoanApplicationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, bankAccounts } = useApp()

  const prefill = location.state || {}

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedBank, setSelectedBank] = useState('')
  const [hasMaxLoans, setHasMaxLoans] = useState(false)

  useEffect(() => {
    const checkActiveLoanCap = async () => {
      try {
        const apps = await loanApi.getApplications()
        const activeCount = (apps || []).filter(a => ['LOAN_CREATED', 'DISBURSED', 'ACTIVE'].includes(a.status) && a.loan?.status === 'ACTIVE').length
        if (activeCount >= 3) {
          setHasMaxLoans(true)
        }
      } catch (err) {
        console.error('Failed to check active loan cap:', err)
      }
    }
    checkActiveLoanCap()
  }, [])

  // Helper to resolve institution/bank name for an account
  const resolveBankName = (acc) => {
    if (acc?.connection?.institution_name) return acc.connection.institution_name
    if (acc?.connection?.bank_name) return acc.connection.bank_name
    if (acc?.bank_name) return acc.bank_name
    return acc?.institution_name || acc?.bank_name || 'Connected Bank Institution'
  }

  // String input states to fix numeric 0 prepending / clearing bug
  const [amountStr, setAmountStr] = useState(prefill.amount ? String(prefill.amount) : '5000')
  const [incomeStr, setIncomeStr] = useState(prefill.income ? String(prefill.income) : '2500')
  const [obligationsStr, setObligationsStr] = useState(prefill.existingDebt ? String(prefill.existingDebt) : '300')


  const [form, setForm] = useState({
    currency: prefill.currency || 'GBP',
    requested_amount: prefill.amount ? prefill.amount * 100 : 500000,
    requested_tenure_months: prefill.tenure || 24,
    purpose: 'Personal Expenses',
    employment_type: 'FULL_TIME',
    monthly_income: prefill.income ? prefill.income * 100 : 250000,
    existing_monthly_obligations: prefill.existingDebt ? prefill.existingDebt * 100 : 30000,
    bank_account_id: bankAccounts && bankAccounts.length > 0 ? bankAccounts[0].id : null,
  })

  const uniqueBankNames = Array.from(new Set((bankAccounts || []).map(acc => resolveBankName(acc))))
  const activeBank = selectedBank || (
    form?.bank_account_id
      ? resolveBankName((bankAccounts || []).find(a => a.id === form.bank_account_id))
      : (uniqueBankNames[0] || '')
  )

  const bankFilteredAccounts = (bankAccounts || []).filter(acc => resolveBankName(acc) === activeBank)
  const selectedAccount = (bankAccounts || []).find(acc => acc.id === form?.bank_account_id) || bankFilteredAccounts[0]

  const handleBankChange = (e) => {
    const newBank = e.target.value
    setSelectedBank(newBank)
    const accsInBank = (bankAccounts || []).filter(acc => resolveBankName(acc) === newBank)
    if (accsInBank.length > 0) {
      setForm(prev => ({ ...prev, bank_account_id: accsInBank[0].id }))
    }
  }

  const handleAmountChange = (valStr) => {
    setAmountStr(valStr)
    const num = parseFloat(valStr)
    setForm(prev => ({
      ...prev,
      requested_amount: isNaN(num) ? 0 : Math.round(num * 100)
    }))
  }

  const handleIncomeChange = (valStr) => {
    setIncomeStr(valStr)
    const num = parseFloat(valStr)
    setForm(prev => ({
      ...prev,
      monthly_income: isNaN(num) ? 0 : Math.round(num * 100)
    }))
  }

  const handleObligationsChange = (valStr) => {
    setObligationsStr(valStr)
    const num = parseFloat(valStr)
    setForm(prev => ({
      ...prev,
      existing_monthly_obligations: isNaN(num) ? 0 : Math.round(num * 100)
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const finalAmountNum = parseFloat(amountStr)
      const finalIncomeNum = parseFloat(incomeStr)
      const finalObligationsNum = parseFloat(obligationsStr)

      const payload = {
        ...form,
        requested_amount: !isNaN(finalAmountNum) && finalAmountNum > 0 ? Math.round(finalAmountNum * 100) : form.requested_amount,
        monthly_income: !isNaN(finalIncomeNum) && finalIncomeNum >= 0 ? Math.round(finalIncomeNum * 100) : form.monthly_income,
        existing_monthly_obligations: !isNaN(finalObligationsNum) && finalObligationsNum >= 0 ? Math.round(finalObligationsNum * 100) : form.existing_monthly_obligations,
      }

      const draft = await loanApi.createApplication(payload)
      const updated = await loanApi.submitApplication(draft.id)
      if (updated?.offer || updated?.status === 'OFFER_GENERATED') {
        navigate(`/app/loans/offer/${updated.id}`)
      } else {
        navigate(`/app/loans/status/${updated.id}`)
      }
    } catch (err) {
      alert(err.message || 'Failed to submit loan application')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = formatPence

  // Calculate live indicative monthly payment (estimated at 12% APR)
  const calcEstimatedEMI = () => {
    const principal = form.requested_amount / 100
    const months = form.requested_tenure_months || 12
    if (!principal || principal <= 0) return 0
    const monthlyRate = 0.12 / 12
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
    return Math.round(emi)
  }

  // Calculate estimated DTI
  const calcDTI = () => {
    const income = form.monthly_income / 100
    const debt = form.existing_monthly_obligations / 100
    const emi = calcEstimatedEMI()
    if (!income || income <= 0) return (debt + emi) > 0 ? 100 : 0
    return Math.round(((debt + emi) / income) * 100)
  }

  const estimatedEMI = calcEstimatedEMI()
  const estimatedDTI = calcDTI()

  return (
    <AppLayout title="Apply for a Personal Loan" subtitle="Complete your digital application backed by open banking verification">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumbs Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon={<ChevronLeft size={16} />}
              onClick={() => navigate('/app/loans')}
              className="font-bold text-xs cursor-pointer hover:bg-slate-200"
            >
              Back to Portal
            </Button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
              Loans Directory &gt; <span className="text-slate-900 font-bold">New Application Wizard</span>
            </span>
          </div>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full flex items-center gap-1.5">
            <ShieldCheck size={14} /> Open Banking Sync Active
          </span>
        </div>

        {hasMaxLoans ? (
          <Card className="p-8 sm:p-12 bg-white border border-slate-200/80 shadow-xs rounded-3xl text-center max-w-2xl mx-auto space-y-6 my-8">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Maximum Active Loans Limit Reached (3/3)</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-md mx-auto">
                System policy permits a maximum of 3 active loans per borrower at a time. You currently have 3 active ongoing loans. Please complete repayment of an existing loan before applying for a new facility.
              </p>
            </div>
            <Button
              onClick={() => navigate('/app/loans')}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-2.5 cursor-pointer shadow-xs"
            >
              Return to Loans Portal
            </Button>
          </Card>
        ) : (
          /* 2-Column Responsive Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Active Step Form Wizard (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Stepper Header */}
            <Card className="p-4 bg-white border border-slate-200/80 shadow-xs rounded-2xl">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { num: 1, title: 'Loan Terms', icon: <FileText size={14} /> },
                  { num: 2, title: 'Income & Job', icon: <Briefcase size={14} /> },
                  { num: 3, title: 'Bank Verification', icon: <Landmark size={14} /> },
                  { num: 4, title: 'Review & Submit', icon: <CheckCircle2 size={14} /> },
                ].map(s => (
                  <div
                    key={s.num}
                    onClick={() => step > s.num && setStep(s.num)}
                    className={cn(
                      'p-2.5 rounded-xl border transition-all flex items-center gap-2.5',
                      step === s.num ? 'bg-teal-50/80 border-teal-300 shadow-xs' : step > s.num ? 'bg-slate-50 border-slate-200/80 cursor-pointer hover:bg-slate-100' : 'bg-white border-slate-100 opacity-60'
                    )}
                  >
                    <div className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                      step >= s.num ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'
                    )}>
                      {step > s.num ? <CheckCircle2 size={15} /> : s.icon}
                    </div>
                    <div className="min-w-0">
                      <p className={cn('text-xs font-bold truncate', step >= s.num ? 'text-slate-900' : 'text-slate-400')}>
                        {s.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">Step {s.num} of 4</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Step Form Container Card */}
            <Card className="p-6 bg-white border border-slate-200/80 shadow-xs rounded-2xl">
              {step === 1 && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="pb-4 border-b border-slate-100">
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <FileText size={18} className="text-teal-600" /> Step 1: Requested Loan Terms
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Specify the financing amount and preferred repayment schedule</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Requested Loan Amount ({form.currency})</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">£</span>
                        <input
                          type="number"
                          placeholder="e.g. 5,000"
                          value={amountStr}
                          onChange={e => handleAmountChange(e.target.value)}
                          className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Min £500 · Max £25,000</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Repayment Tenure</label>
                      <select
                        value={form.requested_tenure_months}
                        onChange={e => setForm({ ...form, requested_tenure_months: Number(e.target.value) })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                      >
                        {[6, 12, 18, 24, 36, 48, 60].map(m => (
                          <option key={m} value={m}>{m} Months ({m / 12} Years)</option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-400 font-medium">Flexible terms up to 60 months</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Primary Purpose of Financing</label>
                    <select
                      value={form.purpose}
                      onChange={e => setForm({ ...form, purpose: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                    >
                      <option value="Personal Expenses">Personal Expenses & Needs</option>
                      <option value="Home Renovation">Home Improvement & Renovation</option>
                      <option value="Debt Consolidation">Debt Consolidation & Restructuring</option>
                      <option value="Education">Education & Professional Certification</option>
                      <option value="Medical Expenses">Medical & Family Emergency</option>
                    </select>
                  </div>

                  {/* Pricing Banner */}
                  <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-800 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-teal-300 uppercase tracking-widest bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                        Dynamic Rate Engine
                      </span>
                      <span className="text-xs font-black text-amber-300 font-mono">
                        8.00% – 24.00% APR Range
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      Interest rates are personalized based on Plaid Open Banking cash flow verification, income consistency score, and Debt-to-Income ratio during administrative review.
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="pb-4 border-b border-slate-100">
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <Briefcase size={18} className="text-teal-600" /> Step 2: Income & Employment Verification
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Provide details on your current employment status and financial obligations</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Employment Sector</label>
                    <select
                      value={form.employment_type}
                      onChange={e => setForm({ ...form, employment_type: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                    >
                      <option value="FULL_TIME">Full-Time Salaried (Government / Private Sector)</option>
                      <option value="PART_TIME">Part-Time Salaried</option>
                      <option value="SELF_EMPLOYED">Business Owner / Self-Employed Professional</option>
                      <option value="CONTRACT">Independent Contractor</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Net Monthly Salary ({form.currency})</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">£</span>
                        <input
                          type="number"
                          placeholder="e.g. 2,500"
                          value={incomeStr}
                          onChange={e => handleIncomeChange(e.target.value)}
                          className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Verified automatically via Plaid</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Existing Monthly Debt ({form.currency})</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">£</span>
                        <input
                          type="number"
                          placeholder="e.g. 300"
                          value={obligationsStr}
                          onChange={e => handleObligationsChange(e.target.value)}
                          className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Existing loans & credit card minimum payments</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="pb-4 border-b border-slate-100">
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <Landmark size={18} className="text-teal-600" /> Step 3: Bank Selection & Open Banking Sync
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      First select your connected bank institution, then choose the specific account for loan disbursement and verification.
                    </p>
                  </div>

                  {bankAccounts && bankAccounts.length > 0 ? (
                    <div className="space-y-5">
                      {/* 1st Selection: Bank Institution Cards */}
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-700">1. Select Connected Bank Institution</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {uniqueBankNames.map(bank => {
                            const count = (bankAccounts || []).filter(a => resolveBankName(a) === bank).length;
                            const isSelected = activeBank === bank;
                            return (
                              <div
                                key={bank}
                                onClick={() => handleBankChange({ target: { value: bank } })}
                                className={cn(
                                  'p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3',
                                  isSelected ? 'border-teal-500 bg-teal-50/50 shadow-[0_4px_12px_rgba(20,184,166,0.15)]' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                )}
                              >
                                <div className={cn(
                                  'w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 transition-colors',
                                  isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'
                                )}>
                                  🏦
                                </div>
                                <div>
                                  <h4 className={cn('text-sm font-bold', isSelected ? 'text-teal-900' : 'text-slate-700')}>{bank}</h4>
                                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">{count} {count === 1 ? 'Account' : 'Accounts'} Connected</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* 2nd Selection: Specific Account Cards */}
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-700">2. Select Specific Account from {activeBank || 'Bank'}</label>
                        <div className="grid grid-cols-1 gap-3">
                          {bankFilteredAccounts.map((acc, idx) => {
                            const isSelected = (form.bank_account_id || bankFilteredAccounts[0]?.id) === acc.id;
                            const balance = formatPence(acc.available_balance || acc.current_balance || 0);
                            const mask = acc.iban || acc.bacs_account || acc.account_number || 'Linked';
                            return (
                              <div
                                key={acc.id}
                                onClick={() => setForm(prev => ({ ...prev, bank_account_id: acc.id }))}
                                className={cn(
                                  'p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between',
                                  isSelected ? 'border-emerald-500 bg-emerald-50/50 shadow-[0_4px_12px_rgba(16,185,129,0.15)]' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    'w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 transition-colors',
                                    isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                                  )}>
                                    💳
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className={cn('text-sm font-bold', isSelected ? 'text-emerald-900' : 'text-slate-700')}>{acc.account_name || 'Account'}</h4>
                                      {idx === 0 && <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Primary</span>}
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium font-mono mt-0.5">{mask}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available</span>
                                  <p className={cn('text-sm font-bold font-mono', isSelected ? 'text-emerald-700' : 'text-slate-900')}>{balance}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Selected Account Detail Preview Card */}
                      {selectedAccount && (
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50/90 via-emerald-50/40 to-slate-50 border border-teal-200 shadow-xs space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                                🏦
                              </div>
                              <div>
                                <h4 className="text-sm font-extrabold text-slate-900">{selectedAccount.account_name || 'Selected Bank Account'}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[11px] font-bold text-teal-800 bg-teal-100/90 px-2.5 py-0.5 rounded-full border border-teal-300/80">
                                    {activeBank}
                                  </span>
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                    VERIFIED OPEN BANKING
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Balance</span>
                              <p className="text-base font-black text-slate-900 font-mono mt-0.5">
                                {formatPence(selectedAccount.available_balance || selectedAccount.current_balance || 0)}
                              </p>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-teal-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                            <div className="bg-white/80 p-3 rounded-xl border border-teal-200/50 space-y-1">
                              <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wide block">IBAN / Account Number</span>
                              <p className="text-slate-900 font-bold truncate">{selectedAccount.iban || selectedAccount.bacs_account || selectedAccount.account_number || 'Linked'}</p>
                            </div>
                            <div className="bg-white/80 p-3 rounded-xl border border-teal-200/50 space-y-1">
                              <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wide block">BIC / Sort Code</span>
                              <p className="text-slate-900 font-bold truncate">{selectedAccount.bic || selectedAccount.sort_code || 'NWBKGB2L'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center space-y-3 bg-amber-50/80 rounded-2xl border border-amber-200">
                      <Landmark size={28} className="mx-auto text-amber-600" />
                      <h4 className="text-xs font-bold text-amber-900">No Connected Bank Accounts Found</h4>
                      <p className="text-[11px] text-amber-700">Please connect a bank account via Plaid open banking to receive loan disbursements.</p>
                      <Button size="sm" onClick={() => navigate('/app/connected-banks')} className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer">
                        Connect Bank Account
                      </Button>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-emerald-700" />
                        <span className="text-xs font-bold text-slate-900">Applicant Persona Identity Verification</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        VERIFIED & SYNCED
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">Biometric KYC & government identification verified during onboarding.</p>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="pb-4 border-b border-slate-100">
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-600" /> Step 4: Confirm & Submit Application
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Review your final loan terms before sending to underwriting</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex justify-between items-center text-xs py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Applicant Name:</span>
                      <span className="font-bold text-slate-900">{user?.name || 'Applicant'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Requested Loan Amount:</span>
                      <span className="font-bold text-teal-700 font-mono text-sm">{formatCurrency(form.requested_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Disbursement & Repayment Account:</span>
                      <span className="font-bold text-teal-900 font-mono">
                        {(() => {
                          const acc = (bankAccounts || []).find(a => a.id === form.bank_account_id)
                          return acc ? `${resolveBankName(acc)} · ${acc.account_name} (${acc.iban || acc.account_number || 'Linked'})` : 'Please select an account in Step 3'
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Repayment Period:</span>
                      <span className="font-bold text-slate-900">{form.requested_tenure_months} Months ({form.requested_tenure_months / 12} Yrs)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Declared Net Monthly Salary:</span>
                      <span className="font-bold text-slate-900 font-mono">{formatCurrency(form.monthly_income)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-1">
                      <span className="text-slate-500 font-medium">Purpose of Loan:</span>
                      <span className="font-bold text-slate-900">{form.purpose}</span>
                    </div>
                  </div>

                  {/* Account Exclusivity Guarantee Notice */}
                  <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200/80 flex items-start gap-3">
                    <ShieldCheck size={20} className="text-teal-700 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-teal-900">Dedicated Account Binding Policy</p>
                      <p className="text-slate-600 leading-relaxed">
                        Funds will be disbursed <strong>exclusively</strong> into your selected bank account. Similarly, all Variable Recurring Payment (VRP) AutoPay mandates and scheduled EMI repayments will be drawn <strong>strictly from this account</strong> without affecting any other linked accounts.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Stepper Navigation Actions */}
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
                {step > 1 ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<ChevronLeft size={15} />}
                    onClick={() => setStep(step - 1)}
                    className="font-bold text-xs border-slate-200 cursor-pointer"
                  >
                    Previous Step
                  </Button>
                ) : <div />}

                {step < 4 ? (
                  <Button
                    onClick={() => setStep(step + 1)}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 px-6 cursor-pointer shadow-xs"
                  >
                    Next Step <ArrowRight size={15} className="ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-6 shadow-sm cursor-pointer"
                  >
                    {loading && <Activity size={15} className="animate-spin mr-1.5" />}
                    Submit Formal Application
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Sticky Live Summary & Calculator Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
            <Card className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest bg-teal-950 px-2 py-0.5 rounded border border-teal-800 flex items-center gap-1">
                  <Calculator size={12} /> Live Facility Breakdown
                </span>
                <span className="text-[11px] text-slate-400 font-semibold font-mono">12.00% Est. APR</span>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Estimated Monthly EMI</span>
                <p className="text-3xl font-black text-white font-mono mt-1">
                  £{estimatedEMI.toLocaleString('en-GB')}<span className="text-xs text-slate-400 font-normal">/mo</span>
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/10 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Principal Facility:</span>
                  <span className="font-bold text-white font-mono">{formatCurrency(form.requested_amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Tenure:</span>
                  <span className="font-bold text-white">{form.requested_tenure_months} Months</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Estimated DTI Ratio:</span>
                  <span className={cn('font-bold font-mono px-2 py-0.5 rounded text-[11px]', estimatedDTI <= 45 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800')}>
                    {estimatedDTI}% (Cap: 45%)
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 text-teal-300 font-bold">
                  <Lock size={13} /> Underwriting Commitment
                </div>
                <p className="text-slate-300 leading-relaxed font-medium">
                  Submitting this application triggers automated Plaid verification and admin underwriting review. Fixed offer terms generated within 2 minutes.
                </p>
              </div>
            </Card>
          </div>
        </div>
        )}
      </div>
    </AppLayout>
  )
}


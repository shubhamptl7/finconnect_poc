import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Landmark, DollarSign, Activity, Sparkles, ChevronLeft } from 'lucide-react'
import { AppLayout, BreadcrumbBar } from '@/components/layout/AppLayout'
import { Card, Button, Badge } from '@/components/ui'
import { loanApi } from '@/services/loanApi'
import { cn } from '@/lib/utils'

const CURRENCY_OPTIONS = [
  { code: 'GBP', name: 'British Pound (£)', min: 500, max: 25000, step: 1, symbol: '£', minMinor: 50000 },
  { code: 'USD', name: 'US Dollar ($)', min: 1000, max: 25000, step: 1, symbol: '$', minMinor: 100000 },
]

export default function LoanEligibilityPage() {
  const navigate = useNavigate()
  const [currency, setCurrency] = useState('GBP')
  const [amount, setAmount] = useState(5000)
  const [tenure, setTenure] = useState(24)
  const [incomeStr, setIncomeStr] = useState('2500')
  const [existingDebtStr, setExistingDebtStr] = useState('300')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const income = parseFloat(incomeStr) || 0
  const existingDebt = parseFloat(existingDebtStr) || 0

  const activeCurr = CURRENCY_OPTIONS.find(c => c.code === currency) || CURRENCY_OPTIONS[0]

  const handleCheck = async () => {
    setLoading(true)
    try {
      const data = await loanApi.checkEligibility({
        currency,
        requestedAmountCents: amount * 100,
        tenureMonths: tenure,
        monthlyIncomeCents: income * 100,
        existingMonthlyObligationsCents: existingDebt * 100,
      })
      setResult(data)
    } catch (err) {
      console.error('Eligibility check error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    handleCheck()
  }, [currency, amount, tenure, income, existingDebt])

  const formatMoney = (cents) => {
    const val = (Number(cents || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `${activeCurr.symbol}${val}`
  }

  return (
    <AppLayout title="Loan Prequalification Calculator" subtitle="Instant credit check powered by open banking affordability algorithms">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb Bar */}
        <BreadcrumbBar
          items={[
            { label: 'Loans Portal', to: '/app/loans' },
            { label: 'Eligibility Calculator' }
          ]}
          badge="Instant Credit Check"
          badgeIcon={ShieldCheck}
          backTo="/app/loans"
          backLabel="Loans Portal"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Calculator size={20} className="text-teal-600" /> Affordability Parameters
                </h3>
                <p className="text-xs text-slate-500">Adjust loan amount and tenure to calculate instant EMI</p>
              </div>

              {/* Currency Selector */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                {CURRENCY_OPTIONS.map(c => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCurrency(c.code)
                      setAmount(c.min * 2)
                    }}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                      currency === c.code ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    {c.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Loan Amount Input & Slider */}
            <div className="space-y-3 p-4 bg-slate-50/80 rounded-xl border border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-700">
                <span>Requested Loan Amount</span>
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 font-bold">{activeCurr.symbol}</span>
                  <input
                    type="number"
                    min={activeCurr.min}
                    max={activeCurr.max}
                    value={amount}
                    onChange={e => setAmount(Math.max(0, Number(e.target.value)))}
                    className="w-24 text-right text-teal-700 text-base font-extrabold font-mono focus:outline-none bg-transparent"
                  />
                </div>
              </div>
              <input
                type="range"
                min={activeCurr.min}
                max={activeCurr.max}
                step={activeCurr.step}
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                <span>{activeCurr.symbol}{activeCurr.min.toLocaleString()}</span>
                <span>{activeCurr.symbol}{activeCurr.max.toLocaleString()}</span>
              </div>
            </div>

            {/* Tenure Slider */}
            <div className="space-y-3 p-4 bg-slate-50/80 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Loan Duration (Tenure)</span>
                <span className="text-teal-700 text-lg font-extrabold">{tenure} Months</span>
              </div>
              <input
                type="range"
                min={6}
                max={60}
                step={6}
                value={tenure}
                onChange={e => setTenure(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                <span>6 Months</span>
                <span>60 Months (5 Years)</span>
              </div>
            </div>

            {/* Income & Debt Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Net Monthly Salary ({currency})</label>
                <input
                  type="number"
                  placeholder="e.g. 2,500"
                  value={incomeStr}
                  onChange={e => setIncomeStr(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Existing Monthly Debt ({currency})</label>
                <input
                  type="number"
                  placeholder="e.g. 300"
                  value={existingDebtStr}
                  onChange={e => setExistingDebtStr(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Instant Eligibility Result Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden border border-slate-800">
            {loading && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-20">
                <Activity size={26} className="animate-spin text-teal-400" />
              </div>
            )}

            <div className="space-y-5 relative z-10">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-white/10 text-teal-200 text-[10px] font-bold uppercase tracking-wider border border-white/10 flex items-center gap-1">
                  <Sparkles size={11} /> Open Banking Affordability Engine
                </span>
                {result && (
                  <span className={cn(
                    'px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border',
                    result.eligible ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  )}>
                    {result.eligible ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {result.eligible ? 'Eligible' : 'Ineligible'}
                  </span>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Estimated Monthly EMI</p>
                <p className="text-4xl font-extrabold text-white mt-1 tabular-nums font-mono">
                  {result ? formatMoney(result.estimatedEmiCents) : '—'}
                </p>
              </div>

              {result && (
                <div className="space-y-2.5 pt-4 border-t border-white/10">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Max Borrowing Capacity:</span>
                    <span className="font-bold text-white font-mono">{formatMoney(result.maxAmountCents)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Estimated Total Interest:</span>
                    <span className="font-bold text-white font-mono">{formatMoney(result.totalInterestCents)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Debt-to-Income (DTI) Ratio:</span>
                    <span className="font-bold text-emerald-400">{(result.dtiBps / 100).toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 relative z-10 space-y-3">
              {result?.reason && (
                <p className="text-xs text-rose-300 bg-rose-950/60 p-3 rounded-xl border border-rose-800/40 leading-relaxed">
                  {result.reason}
                </p>
              )}
              <button
                onClick={() => navigate('/app/loans/apply', { state: { currency, amount, tenure, income, existingDebt } })}
                disabled={!result?.eligible}
                className={cn(
                  'w-full py-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md',
                  result?.eligible ? 'bg-teal-600 text-white hover:bg-teal-500' : 'bg-white/10 text-white/40 cursor-not-allowed'
                )}
              >
                Proceed to Formal Application <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

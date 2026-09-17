import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity, Calculator, ArrowRight, DollarSign, Calendar, Percent,
  ShieldCheck, Info, ChevronRight, ChevronDown, Sparkles, CheckCircle2, ArrowUpRight
} from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { AppLayout, BreadcrumbBar } from '@/components/layout/AppLayout'
import CalculatorsDropdown from '@/components/layout/CalculatorsDropdown'
import { calculateEligibility, getCurrencySymbol, formatAmount, getCurrencyConfig } from '@/lib/calculatorMath'
import { useApp } from '@/store/AppContext'

function TopNavbar() {
  const { isAuthenticated } = useApp()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-emerald-900 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 text-base tracking-[-0.01em]">
            Fin<span className="text-brand-600">Connect</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Home
          </Link>
          <CalculatorsDropdown />
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link to="/app/dashboard">
              <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 rounded-xl">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/auth/login" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="text-slate-700 font-medium">Sign in</Button>
              </Link>
              <Link to="/auth/register">
                <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 rounded-xl shadow-sm" iconRight={<ArrowRight size={14} />}>
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default function EligibilityCalculatorPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useApp()
  const [monthlyIncome, setMonthlyIncome] = useState(1200)
  const [existingObligations, setExistingObligations] = useState(150)
  const [tenure, setTenure] = useState(24)
  const [rate, setRate] = useState(9.5)
  const [currency, setCurrency] = useState('GBP')

  const currConfig = useMemo(() => getCurrencyConfig(currency), [currency])

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency)
    const newConfig = getCurrencyConfig(newCurrency)
    setMonthlyIncome(newConfig.income.default)
    setExistingObligations(newConfig.obligations.default)
  }

  // Instant client-side calculation
  const { maxEligibleAmount, maxAllowedEmi, status } = useMemo(() => {
    return calculateEligibility(monthlyIncome, existingObligations, tenure, rate)
  }, [monthlyIncome, existingObligations, tenure, rate])

  const statusBadge = useMemo(() => {
    if (status === 'HIGH') {
      return {
        label: 'Great Borrowing Power',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        desc: 'Your financial profile is strong! High probability of loan approval.',
      }
    }
    if (status === 'MODERATE') {
      return {
        label: 'Moderate Borrowing Power',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        desc: 'Your monthly capacity is moderate. Extending tenure can lower your monthly payment.',
      }
    }
    return {
      label: 'Limited Borrowing Power',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      desc: 'Existing debt obligations consume a large portion of your income.',
    }
  }, [status])

  const renderCalculatorWorkspace = () => (
    <div className="space-y-6">
      {/* Navigation Breadcrumb Bar */}
      <BreadcrumbBar
        items={[
          { label: isAuthenticated ? "Loans Portal" : "Home", to: isAuthenticated ? "/app/loans" : "/" },
          { label: "Eligibility Calculator" }
        ]}
        backTo={isAuthenticated ? "/app/loans" : "/"}
        backLabel={isAuthenticated ? "Loans Portal" : "Home"}
      />

      {/* Switcher & Currency Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate(isAuthenticated ? '/app/calculators/emi' : '/calculators/emi')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-slate-600 hover:text-slate-900 hover:bg-white/60 flex items-center gap-1.5 cursor-pointer"
          >
            <Calculator size={14} className="text-slate-400" /> EMI Calculator
          </button>
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-white text-teal-700 shadow-xs flex items-center gap-1.5"
          >
            <Activity size={14} className="text-teal-600" /> Eligibility Calculator
          </button>
        </div>

        <div className="relative flex items-center">
          <select
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl pl-3.5 pr-8 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer transition-all"
            aria-label="Select Currency"
          >
            <option value="GBP">GBP (£)</option>
            <option value="OMR">OMR (Rial)</option>
            <option value="USD">USD ($)</option>
            <option value="INR">INR (₹)</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Master Card Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT SECTION: Sliders */}
        <div className="lg:col-span-7 p-6 sm:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-slate-100">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} className="text-teal-600" /> Financial Inputs
            </h2>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              Live Affordability Check
            </span>
          </div>

          {/* 1. Monthly Net Income */}
          <div className="space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Net Monthly Income ({getCurrencySymbol(currency)})
              </label>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1 shadow-2xs">
                <span className="text-xs font-bold text-slate-400">{getCurrencySymbol(currency)}</span>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Math.max(currConfig.income.min, Math.min(currConfig.income.max, Number(e.target.value))))}
                  className="w-28 text-right font-bold text-slate-900 text-sm font-mono focus:outline-none bg-transparent"
                />
              </div>
            </div>

            <div className="relative pt-1">
              <input
                type="range"
                min={currConfig.income.min}
                max={currConfig.income.max}
                step={currConfig.income.step}
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-1.5">
                <span>{formatAmount(currConfig.income.min, currency)}</span>
                <span>{formatAmount(currConfig.income.mid, currency)}</span>
                <span>{formatAmount(currConfig.income.max, currency)}</span>
              </div>
            </div>
          </div>

          {/* 2. Existing Monthly Obligations */}
          <div className="space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Existing Monthly Debt Obligations
              </label>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1 shadow-2xs">
                <span className="text-xs font-bold text-slate-400">{getCurrencySymbol(currency)}</span>
                <input
                  type="number"
                  value={existingObligations}
                  onChange={(e) => setExistingObligations(Math.max(currConfig.obligations.min, Math.min(currConfig.obligations.max, Number(e.target.value))))}
                  className="w-28 text-right font-bold text-slate-900 text-sm font-mono focus:outline-none bg-transparent"
                />
              </div>
            </div>

            <div className="relative pt-1">
              <input
                type="range"
                min={currConfig.obligations.min}
                max={currConfig.obligations.max}
                step={currConfig.obligations.step}
                value={existingObligations}
                onChange={(e) => setExistingObligations(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-1.5">
                <span>{formatAmount(currConfig.obligations.min, currency)}</span>
                <span>{formatAmount(currConfig.obligations.mid, currency)}</span>
                <span>{formatAmount(currConfig.obligations.max, currency)}</span>
              </div>
            </div>
          </div>

          {/* 3. Desired Tenure */}
          <div className="space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Desired Loan Tenure
              </label>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-3 py-1 rounded-xl">
                {tenure} Months ({(tenure / 12).toFixed(1)} yrs)
              </span>
            </div>

            <div className="relative pt-1">
              <input
                type="range"
                min="6"
                max="60"
                step="6"
                value={tenure}
                onChange={(e) => setTenure(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-1.5">
                <span>6 Months</span>
                <span>30 Months</span>
                <span>60 Months</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: Result Display */}
        <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-50/50 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                Max Eligible Loan Amount
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-4xl font-black text-slate-900 tracking-tight font-mono">
                  {formatAmount(maxEligibleAmount, currency)}
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <div className={`p-4 rounded-xl border ${statusBadge.color} space-y-1.5`}>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${statusBadge.dot}`} />
                <span className="text-xs font-bold">{statusBadge.label}</span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">{statusBadge.desc}</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Max Allowed EMI</p>
                <p className="text-base font-bold text-slate-900 mt-0.5 font-mono">{formatAmount(maxAllowedEmi, currency)}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Assumed Interest Rate</p>
                <p className="text-base font-bold text-teal-700 mt-0.5 font-mono">{rate}% APR</p>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-4 border-t border-slate-200/60">
            <Button
              onClick={() => navigate(isAuthenticated ? '/app/loans/apply' : '/auth/register')}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl shadow-xs flex items-center justify-center gap-2"
            >
              <span>Apply for {formatAmount(maxEligibleAmount, currency)} Financing</span>
              <ArrowUpRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  if (isAuthenticated) {
    return (
      <AppLayout title="Loan Eligibility Calculator" subtitle="Estimate borrowing capacity based on monthly income and obligations">
        <div className="max-w-5xl mx-auto">
          {renderCalculatorWorkspace()}
        </div>
      </AppLayout>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-24">
      <TopNavbar />
      <section className="pt-24 pb-6 px-4 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Loan Eligibility Calculator
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Estimate borrowing capacity based on monthly income and obligations.
            </p>
          </div>
          {renderCalculatorWorkspace()}
        </div>
      </section>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Calculator, Activity, ArrowRight, DollarSign, Calendar, Percent,
  ShieldCheck, Table, ChevronRight, ChevronDown, Sparkles, CheckCircle2, ArrowUpRight
} from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { AppLayout, BreadcrumbBar } from '@/components/layout/AppLayout'
import CalculatorsDropdown from '@/components/layout/CalculatorsDropdown'
import { calculateEmi, generateAmortizationSchedule, getCurrencySymbol, formatAmount, getCurrencyConfig } from '@/lib/calculatorMath'
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

export default function EmiCalculatorPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useApp()
  const [principal, setPrincipal] = useState(10000)
  const [rate, setRate] = useState(9.5)
  const [tenure, setTenure] = useState(24)
  const [currency, setCurrency] = useState('GBP')
  const [viewMode, setViewMode] = useState('monthly')

  const currConfig = useMemo(() => getCurrencyConfig(currency), [currency])

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency)
    const newConfig = getCurrencyConfig(newCurrency)
    setPrincipal(newConfig.principal.default)
  }

  // Instant calculation
  const { emi, totalInterest, totalPayment } = useMemo(() => {
    return calculateEmi(principal, rate, tenure)
  }, [principal, rate, tenure])

  const schedule = useMemo(() => {
    return generateAmortizationSchedule(principal, rate, tenure)
  }, [principal, rate, tenure])

  const yearlySchedule = useMemo(() => {
    const years = {}
    schedule.forEach((row) => {
      const yearNum = Math.ceil(row.month / 12)
      if (!years[yearNum]) {
        years[yearNum] = {
          year: yearNum,
          emiSum: 0,
          principalPaidSum: 0,
          interestPaidSum: 0,
          endingBalance: row.endingBalance,
        }
      }
      years[yearNum].emiSum += row.emi
      years[yearNum].principalPaidSum += row.principalPaid
      years[yearNum].interestPaidSum += row.interestPaid
      years[yearNum].endingBalance = row.endingBalance
    })
    return Object.values(years)
  }, [schedule])

  const principalRatio = totalPayment > 0 ? (principal / totalPayment) * 100 : 100
  const interestRatio = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0

  // SVG Donut Geometry
  const radius = 56
  const strokeWidth = 12
  const circumference = 2 * Math.PI * radius
  const principalStrokeDash = (principalRatio / 100) * circumference
  const interestStrokeDash = (interestRatio / 100) * circumference

  // Calculator Workspace Content
  const renderCalculatorWorkspace = () => (
    <div className="space-y-6">
      {/* Navigation Breadcrumb Bar */}
      <BreadcrumbBar
        items={[
          { label: isAuthenticated ? "Loans Portal" : "Home", to: isAuthenticated ? "/app/loans" : "/" },
          { label: "EMI Calculator" }
        ]}
        backTo={isAuthenticated ? "/app/loans" : "/"}
        backLabel={isAuthenticated ? "Loans Portal" : "Home"}
      />

      {/* Switcher & Currency Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-white text-teal-700 shadow-xs flex items-center gap-1.5"
          >
            <Calculator size={14} className="text-teal-600" /> EMI Calculator
          </button>
          <button
            type="button"
            onClick={() => navigate(isAuthenticated ? '/app/calculators/eligibility' : '/calculators/eligibility')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-slate-600 hover:text-slate-900 hover:bg-white/60 flex items-center gap-1.5 cursor-pointer"
          >
            <Activity size={14} className="text-slate-400" /> Eligibility Calculator
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
        {/* LEFT SECTION: Interactive Sliders */}
        <div className="lg:col-span-7 p-6 sm:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-slate-100">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Calculator size={16} className="text-teal-600" /> Interactive Parameters
            </h2>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              Live Computation
            </span>
          </div>

          {/* 1. Loan Amount */}
          <div className="space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Loan Amount ({getCurrencySymbol(currency)})
              </label>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1 shadow-2xs">
                <span className="text-xs font-bold text-slate-400">{getCurrencySymbol(currency)}</span>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Math.max(currConfig.principal.min, Math.min(currConfig.principal.max, Number(e.target.value))))}
                  className="w-28 text-right font-bold text-slate-900 text-sm font-mono focus:outline-none bg-transparent"
                />
              </div>
            </div>

            <div className="relative pt-1">
              <input
                type="range"
                min={currConfig.principal.min}
                max={currConfig.principal.max}
                step={currConfig.principal.step}
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-1.5">
                <span>{formatAmount(currConfig.principal.min, currency)}</span>
                <span>{formatAmount(currConfig.principal.mid, currency)}</span>
                <span>{formatAmount(currConfig.principal.max, currency)}</span>
              </div>
            </div>
          </div>

          {/* 2. Interest Rate */}
          <div className="space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Interest Rate (% APR)
              </label>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-3 py-1 shadow-2xs">
                <input
                  type="number"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(Math.max(1, Math.min(30, Number(e.target.value))))}
                  className="w-16 text-right font-bold text-slate-900 text-sm font-mono focus:outline-none bg-transparent"
                />
                <span className="text-xs font-bold text-slate-400">%</span>
              </div>
            </div>

            <div className="relative pt-1">
              <input
                type="range"
                min="5.0"
                max="25.0"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-1.5">
                <span>5.0%</span>
                <span>15.0%</span>
                <span>25.0%</span>
              </div>
            </div>
          </div>

          {/* 3. Tenure */}
          <div className="space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Loan Tenure
              </label>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-3 py-1 rounded-xl">
                {tenure} Months ({(tenure / 12).toFixed(1)} yrs)
              </span>
            </div>

            <div className="relative pt-1">
              <input
                type="range"
                min="1"
                max="60"
                step="1"
                value={tenure}
                onChange={(e) => setTenure(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-1.5">
                <span>1 Month</span>
                <span>30 Months</span>
                <span>60 Months</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: Live Summary & Visualization */}
        <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-50/50 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                Calculated Monthly EMI
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-4xl font-black text-slate-900 tracking-tight font-mono">
                  {formatAmount(emi, currency)}
                </span>
                <span className="text-xs text-slate-400 font-medium">/ month</span>
              </div>
            </div>

            {/* SVG Ring Chart */}
            <div className="flex items-center gap-5 p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r={radius} stroke="#E2E8F0" strokeWidth={strokeWidth} fill="transparent" />
                  <circle
                    cx="70" cy="70" r={radius}
                    stroke="#0D9488" strokeWidth={strokeWidth}
                    strokeDasharray={`${principalStrokeDash} ${circumference - principalStrokeDash}`}
                    strokeLinecap="round" fill="transparent"
                    className="transition-all duration-300"
                  />
                  <circle
                    cx="70" cy="70" r={radius}
                    stroke="#10B981" strokeWidth={strokeWidth}
                    strokeDasharray={`${interestStrokeDash} ${circumference - interestStrokeDash}`}
                    strokeDashoffset={-principalStrokeDash}
                    strokeLinecap="round" fill="transparent"
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Tenure</span>
                  <span className="text-xs font-bold text-slate-900">{tenure}m</span>
                </div>
              </div>

              <div className="flex-1 space-y-2 text-xs font-semibold">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600" /> Principal
                  </span>
                  <span className="font-extrabold text-slate-900">{principalRatio.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Interest
                  </span>
                  <span className="font-extrabold text-slate-900">{interestRatio.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Interest</p>
                <p className="text-base font-bold text-emerald-600 mt-0.5 font-mono">{formatAmount(totalInterest, currency)}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Payment</p>
                <p className="text-base font-bold text-slate-900 mt-0.5 font-mono">{formatAmount(totalPayment, currency)}</p>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-4 border-t border-slate-200/60">
            <Button
              onClick={() => navigate(isAuthenticated ? '/app/loans/apply' : '/auth/register')}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl shadow-xs flex items-center justify-center gap-2"
            >
              <span>Apply for {formatAmount(principal, currency)} Loan</span>
              <ArrowUpRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Amortization Schedule Table */}
      <Card className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Table size={18} className="text-teal-600" /> Amortization Schedule
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Repayment breakdown over {tenure} months.
            </p>
          </div>

          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold border border-slate-200/50">
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Monthly View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('yearly')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'yearly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Yearly Summary
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {viewMode === 'monthly' ? (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Month</th>
                  <th className="py-3 px-4">Beginning Balance</th>
                  <th className="py-3 px-4">EMI</th>
                  <th className="py-3 px-4 text-teal-700">Principal Paid</th>
                  <th className="py-3 px-4 text-emerald-700">Interest Paid</th>
                  <th className="py-3 px-4 rounded-r-xl">Ending Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedule.map((row) => (
                  <tr key={row.month} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-slate-900">Month {row.month}</td>
                    <td className="py-2.5 px-4 font-mono">{formatAmount(row.beginningBalance, currency)}</td>
                    <td className="py-2.5 px-4 font-bold font-mono text-slate-900">{formatAmount(row.emi, currency)}</td>
                    <td className="py-2.5 px-4 font-bold font-mono text-teal-700">{formatAmount(row.principalPaid, currency)}</td>
                    <td className="py-2.5 px-4 font-bold font-mono text-emerald-600">{formatAmount(row.interestPaid, currency)}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500">{formatAmount(row.endingBalance, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Year</th>
                  <th className="py-3 px-4">Total EMI Paid</th>
                  <th className="py-3 px-4 text-teal-700">Principal Paid</th>
                  <th className="py-3 px-4 text-emerald-700">Interest Paid</th>
                  <th className="py-3 px-4 rounded-r-xl">Year-End Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {yearlySchedule.map((row) => (
                  <tr key={row.year} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">Year {row.year}</td>
                    <td className="py-3 px-4 font-bold font-mono text-slate-900">{formatAmount(row.emiSum, currency)}</td>
                    <td className="py-3 px-4 font-bold font-mono text-teal-700">{formatAmount(row.principalPaidSum, currency)}</td>
                    <td className="py-3 px-4 font-bold font-mono text-emerald-600">{formatAmount(row.interestPaidSum, currency)}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{formatAmount(row.endingBalance, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )

  // Render wrapped in AppLayout when authenticated, or public container when unauthenticated
  if (isAuthenticated) {
    return (
      <AppLayout title="Personal Loan EMI Calculator" subtitle="Real-time repayment calculation with principal vs. interest breakdown">
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
              Personal Loan EMI Calculator
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Real-time repayment calculation with principal vs. interest breakdown.
            </p>
          </div>
          {renderCalculatorWorkspace()}
        </div>
      </section>
    </div>
  )
}

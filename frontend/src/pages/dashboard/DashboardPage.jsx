import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, ArrowLeftRight, Plus, Download,
  ChevronRight, Landmark, Eye, EyeOff, CheckCircle2,
  Building2, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownLeft,
  ShieldCheck, Wallet, Receipt, CreditCard
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { AppLayout, BreadcrumbBar } from '@/components/layout/AppLayout'
import { Card, Button, Badge } from '@/components/ui'
import { formatRelative, cn, formatCurrency } from '@/lib/utils'
import { formatPence } from '@/lib/currencyFormatters'
import { useApp } from '@/store/AppContext'

// ─── Total Balance Hero Canvas ─────────────────────────────
function TotalBalanceHero() {
  const { bankAccounts } = useApp()
  const [hidden, setHidden] = useState(false)
  const total = bankAccounts.reduce((s, a) => s + Number(a.available_balance || a.current_balance || 0), 0)
  const monthChange = 4.2

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-[0_4px_20px_rgba(15,23,42,0.03)] relative overflow-hidden">
      {/* Decorative subtle brand ambient glow */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-600 via-brand-400 to-emerald-600" />
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-brand-50/70 rounded-full blur-3xl opacity-60 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                Total Balance Across All Banks
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60">
                <TrendingUp size={11} className="text-emerald-600" /> +{monthChange}% vs last month
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-extrabold tabular-nums text-slate-900 tracking-tight" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>
                {hidden ? '•••••••' : formatPence(total)}
              </span>
              <button
                onClick={() => setHidden(v => !v)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-100"
                aria-label={hidden ? 'Show balance' : 'Hide balance'}
              >
                {hidden ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-1">
              Refreshed live via Open Banking APIs · {bankAccounts.length} Connected {bankAccounts.length === 1 ? 'Account' : 'Accounts'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <Link to="/app/payments">
              <Button size="md" icon={<ArrowLeftRight size={15} />} className="shadow-sm">
                Initiate Payment
              </Button>
            </Link>
            <Link to="/app/accounts">
              <Button variant="secondary" size="md" icon={<Landmark size={15} />}>
                View Accounts
              </Button>
            </Link>
            <Link to="/app/banks">
              <Button variant="outline" size="md" icon={<Plus size={15} />}>
                Connect Bank
              </Button>
            </Link>
          </div>
        </div>

        {/* Connected Bank Chips */}
        {bankAccounts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 pt-5 mt-6 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-400 mr-1">Linked:</span>
            {bankAccounts.map(acc => (
              <div
                key={acc.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-brand-200 hover:bg-brand-50/30 transition-all cursor-pointer text-xs"
              >
                <div className="w-4 h-4 rounded-full bg-slate-900 text-white text-[9px] font-bold flex items-center justify-center">
                  {acc.connection?.bank_name?.slice(0, 1) || 'B'}
                </div>
                <span className="font-semibold text-slate-700">{acc.connection?.bank_name?.split(' ')[0] || 'Bank'}</span>
                <span className="font-mono font-bold text-slate-900">
                  {hidden ? '•••' : formatPence(acc.available_balance || acc.current_balance)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Cash Flow Chart ───────────────────────────────────────
function SpendingChart() {
  const { transactions } = useApp()

  const chartData = useMemo(() => {
    // Group transactions by month or generate standard 6-month trend
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const monthlySummary = months.map((m, idx) => ({
      month: m,
      income: 1200 + (idx * 150) + (idx % 2 === 0 ? 300 : 0),
      expenses: 650 + (idx * 80) + (idx % 3 === 0 ? 140 : 0),
    }))

    if (transactions.length > 0) {
      // Calculate real totals if available
      let incomeSum = 0
      let expenseSum = 0
      transactions.forEach(t => {
        const amt = Math.abs(parseFloat(t.amount || 0))
        if (t.type === 'credit') incomeSum += amt
        else expenseSum += amt
      })
      if (incomeSum > 0 || expenseSum > 0) {
        monthlySummary[5].income = incomeSum > 0 ? incomeSum / 1000 : monthlySummary[5].income
        monthlySummary[5].expenses = expenseSum > 0 ? expenseSum / 1000 : monthlySummary[5].expenses
      }
    }
    return monthlySummary
  }, [transactions])

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs shadow-lg">
        <p className="font-bold text-slate-800 mb-2 uppercase tracking-wide text-[10px]">{label} Overview</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-600" />
            <span className="text-slate-500 font-medium">Income</span>
            <span className="ml-auto font-bold text-slate-900 tabular-nums">{formatCurrency(payload[0]?.value)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-slate-500 font-medium">Expenses</span>
            <span className="ml-auto font-bold text-slate-900 tabular-nums">{formatCurrency(payload[1]?.value)}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>Cash Flow Trend</h3>
          <p className="text-xs text-slate-400 mt-0.5">Income vs spending trajectory across all connected accounts</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600 block" />Income
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block" />Expenses
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0F766E" stopOpacity={0.16} />
              <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'IBM Plex Sans' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'IBM Plex Sans' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }} />
          <Area type="monotone" dataKey="income" stroke="#0F766E" strokeWidth={2.5} fill="url(#incomeGrad)" dot={false} activeDot={{ fill: '#0F766E', strokeWidth: 0, r: 5 }} />
          <Area type="monotone" dataKey="expenses" stroke="#F43F5E" strokeWidth={2.5} fill="url(#expenseGrad)" dot={false} activeDot={{ fill: '#F43F5E', strokeWidth: 0, r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}

// ─── Category Breakdown ────────────────────────────────────
function CategoryBreakdown() {
  const { transactions } = useApp()

  const categories = useMemo(() => {
    const defaultCats = [
      { name: 'Housing & Utilities', value: 450, color: '#0F766E' },
      { name: 'Shopping & Goods',    value: 280, color: '#059669' },
      { name: 'Transport & Travel',  value: 160, color: '#D97706' },
      { name: 'Dining & Services',   value: 120, color: '#8B5CF6' },
    ]

    if (transactions.length > 0) {
      const counts = {}
      transactions.forEach(t => {
        if (t.category) {
          const amt = Math.abs(parseFloat(t.amount || 0))
          counts[t.category] = (counts[t.category] || 0) + (amt || 100)
        }
      })
      const keys = Object.keys(counts)
      if (keys.length > 0) {
        const colors = ['#0F766E', '#059669', '#D97706', '#8B5CF6', '#EC4899']
        return keys.slice(0, 4).map((k, i) => ({
          name: k,
          value: Math.round(counts[k]),
          color: colors[i % colors.length]
        }))
      }
    }
    return defaultCats
  }, [transactions])

  const total = categories.reduce((s, c) => s + c.value, 0)

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>Spending Allocation</h3>
        <span className="text-xs text-slate-400 font-semibold">Current Month</span>
      </div>

      <div className="flex justify-center mb-5">
        <div className="relative">
          <PieChart width={140} height={140}>
            <Pie
              data={categories} cx="50%" cy="50%"
              innerRadius={44} outerRadius={66}
              paddingAngle={3} dataKey="value" strokeWidth={0}
            >
              {categories.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
            <span className="text-xs font-black text-slate-900 tabular-nums">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {categories.map((cat, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                <span className="font-semibold text-slate-700">{cat.name}</span>
              </div>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(cat.value)}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: cat.color }}
                initial={{ width: 0 }}
                animate={{ width: `${(cat.value / (total || 1)) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Recent Activity Feed ──────────────────────────────────
function RecentActivityFeed() {
  const { transactions } = useApp()
  const recent = transactions.slice(0, 5)

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>Recent Activity</h3>
          <p className="text-xs text-slate-400 mt-0.5">Real-time banking transactions</p>
        </div>
        <Link to="/app/transactions">
          <Button variant="ghost" size="sm" iconRight={<ChevronRight size={13} />}>View all</Button>
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs">
          <Receipt size={24} className="mx-auto mb-2 opacity-50" />
          <p className="font-semibold text-slate-600">No transactions recorded yet</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Your payments and transfers will appear here in real-time.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {recent.map((txn, i) => {
            const isCredit = txn.type === 'credit'
            return (
              <div
                key={txn.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
              >
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold',
                  isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-700'
                )}>
                  {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {txn.description || 'Transaction'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatRelative(txn.transaction_date || txn.date || new Date())} · {txn.category || 'General'}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className={cn(
                    'text-sm font-extrabold tabular-nums font-mono',
                    isCredit ? 'text-emerald-600' : 'text-slate-900'
                  )}>
                    {txn.amount === null ? (
                      <span className="text-slate-400">••••</span>
                    ) : (
                      <>{isCredit ? '+' : '−'}{formatCurrency(Math.abs(parseFloat(txn.amount || 0)))}</>
                    )}
                  </p>
                  {txn.status && (
                    <span className={cn(
                      'inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 capitalize',
                      txn.status === 'completed' || txn.status === 'settled' ? 'bg-emerald-50 text-emerald-700' :
                      txn.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                    )}>
                      {txn.status}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

// ─── Connected Banks Widget ────────────────────────────────
function ConnectedBanksWidget() {
  const { bankAccounts } = useApp()

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>
          Connected Banks
        </h3>
        <Link to="/app/banks">
          <Button variant="ghost" size="sm" iconRight={<ChevronRight size={12} />}>Manage</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {bankAccounts.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            No bank accounts connected yet.
          </div>
        ) : (
          bankAccounts.slice(0, 4).map(acc => (
            <div key={acc.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {acc.connection?.bank_name?.slice(0, 1) || 'B'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{acc.connection?.bank_name || 'Bank Account'}</p>
                <p className="text-[10px] text-slate-400 truncate">{acc.account_name} · Active sync</p>
              </div>
              <p className="text-xs font-mono font-extrabold text-slate-900 tabular-nums">
                {formatPence(acc.available_balance || acc.current_balance)}
              </p>
            </div>
          ))
        )}
      </div>

      <Link to="/app/banks" className="block mt-4">
        <button className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/40 transition-all cursor-pointer">
          <Plus size={14} /> Link New Bank Account
        </button>
      </Link>
    </Card>
  )
}

// ─── Security Status Alert ─────────────────────────────────
function SecurityStatusCard() {
  return (
    <Card className="p-5 border-l-4 border-l-emerald-500 bg-emerald-50/30">
      <div className="flex items-start gap-3">
        <ShieldCheck size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-slate-900">UK Open Banking Compliant</p>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            Your connection is tokenised and encrypted to UK Open Banking regulatory standards. Credentials remain securely with your bank.
          </p>
        </div>
      </div>
    </Card>
  )
}

// ─── Main Dashboard Page ───────────────────────────────────
export default function DashboardPage() {
  const { user } = useApp()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <AppLayout
      title={`${greeting}, ${user?.name?.split(' ')[0] || 'User'}`}
      subtitle="Open Banking Financial Console"
    >
      <div className="space-y-6">
        {/* Navigation Breadcrumb Bar */}
        <BreadcrumbBar
          items={[
            { label: 'FinConnect' },
            { label: 'Executive Dashboard' }
          ]}
          liveSync
        />

        {/* Hero Canvas */}
        <TotalBalanceHero />

        {/* 2-Column Asymmetric Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <SpendingChart />
            <RecentActivityFeed />
          </div>

          {/* Side Context Panel (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <ConnectedBanksWidget />
            <CategoryBreakdown />
            <SecurityStatusCard />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

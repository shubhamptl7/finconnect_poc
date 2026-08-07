import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, ArrowLeftRight, Plus, Download,
  ChevronRight, Landmark, Eye, EyeOff, CheckCircle2,
  Building2, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownLeft,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, Button, Badge, StatCard } from '@/components/ui'
import { formatCurrency, formatRelative, cn } from '@/lib/utils'
import { useApp } from '@/store/AppContext'

// ─── Total Balance Card ────────────────────────────────────
// Clean, white-theme, high-trust
function TotalBalanceCard() {
  const { bankAccounts } = useApp();
  const [hidden, setHidden] = useState(false)
  const total = bankAccounts.reduce((s, a) => s + parseFloat(a.available_balance || a.current_balance || 0), 0)
  const monthChange = 4.2

  return (
    <Card className="p-6 col-span-1 lg:col-span-2 relative overflow-hidden bg-white border border-slate-200">
      {/* Subtle brand accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-brand-300" />
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-6 sm:gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-3">
              Total Balance Across All Banks
            </p>
            <div className="flex items-end gap-3">
              <p className="text-3xl sm:text-4xl font-bold tabular-nums text-slate-900 leading-none break-all sm:break-normal">
                {hidden ? '••••••' : formatCurrency(total)}
              </p>
              <button
                onClick={() => setHidden(v => !v)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer mb-1 p-1"
                aria-label={hidden ? 'Show balance' : 'Hide balance'}
              >
                {hidden ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                <TrendingUp size={11} className="text-emerald-500" />
                <span className="text-xs font-bold">+{monthChange}%</span>
              </div>
              <span className="text-slate-400 text-xs">vs last month</span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-3 sm:gap-2">
            <Link to="/app/payments">
              <QuickAction icon={<ArrowLeftRight size={14} className="text-slate-600" />} label="Pay" />
            </Link>
            <Link to="/app/accounts">
              <QuickAction icon={<Download size={14} className="text-slate-600" />} label="View" />
            </Link>
            <Link to="/app/banks">
              <QuickAction icon={<Plus size={14} className="text-brand-600" />} label="Connect" highlight />
            </Link>
          </div>
        </div>

        {/* Account pills */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
          {bankAccounts.map(acc => (
            <div
              key={acc.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer transition-all duration-150 hover:border-brand-200"
            >
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0 text-white bg-slate-900">
                {acc.connection?.bank_name?.slice(0, 1) || 'B'}
              </div>
              <span className="text-slate-600 text-xs">{acc.connection?.bank_name?.split(' ')[0] || 'Bank'}</span>
              <span className="text-slate-900 text-xs font-semibold tabular-nums">
                {hidden ? '•••' : formatCurrency(acc.available_balance || acc.current_balance)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function QuickAction({ icon, label, highlight }) {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      className="flex flex-col items-center gap-1.5 cursor-pointer group"
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 shadow-sm",
          highlight 
            ? "bg-brand-50 border border-brand-100 group-hover:border-brand-200" 
            : "bg-slate-50 border border-slate-100 group-hover:border-slate-200"
        )}
      >
        {icon}
      </div>
      <span className="text-[10px] text-slate-500 font-medium group-hover:text-slate-700 transition-colors">{label}</span>
    </motion.div>
  )
}

// ─── Spending Chart ────────────────────────────────────────
function SpendingChart() {
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs shadow-e3">
        <p className="font-semibold text-slate-700 mb-2 uppercase tracking-wide text-[10px]">{label}</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-500" />
            <span className="text-slate-500">Income</span>
            <span className="ml-auto font-bold text-slate-800">{formatCurrency(payload[0]?.value)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-slate-500">Expenses</span>
            <span className="ml-auto font-bold text-slate-800">{formatCurrency(payload[1]?.value)}</span>
          </div>
        </div>
      </div>
    )
  }

  const data = [] // Replaced mock spending data with empty array

  return (
    <Card className="p-6 col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[15px] font-semibold text-slate-900" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>Cash Flow</h3>
          <p className="text-xs text-slate-400 mt-0.5">Last 6 months</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 block" />Income
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 block" />Expenses
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#1B55E2" stopOpacity={0.14} />
              <stop offset="95%" stopColor="#1B55E2" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#FB7185" stopOpacity={0.10} />
              <stop offset="95%" stopColor="#FB7185" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 0" stroke="#F0F4F8" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B98A9', fontFamily: 'IBM Plex Sans' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#8B98A9', fontFamily: 'IBM Plex Sans' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E8EDF2', strokeWidth: 1 }} />
          <Area type="monotone" dataKey="income" stroke="#1B55E2" strokeWidth={2} fill="url(#incomeGrad)" dot={false} activeDot={{ fill: '#1B55E2', strokeWidth: 0, r: 4 }} />
          <Area type="monotone" dataKey="expenses" stroke="#FB7185" strokeWidth={2} fill="url(#expenseGrad)" dot={false} activeDot={{ fill: '#FB7185', strokeWidth: 0, r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}

// ─── Category Breakdown ────────────────────────────────────
function CategoryBreakdown() {
  const categoryData = [] // Replaced mock category data
  const total = 0
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-semibold text-slate-900" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>By Category</h3>
        <p className="text-xs text-slate-400">This month</p>
      </div>
      <div className="flex justify-center mb-5">
        <div className="relative">
          <PieChart width={140} height={140}>
            <Pie
              data={categoryData} cx="50%" cy="50%"
              innerRadius={42} outerRadius={66}
              paddingAngle={2} dataKey="value" strokeWidth={0}
            >
              {categoryData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">Spent</p>
            <p className="text-sm font-bold text-slate-800 stat-number">{formatCurrency(total * 1000)}</p>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {categoryData.map((cat, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                <span className="text-xs font-medium text-slate-700">{cat.name}</span>
              </div>
              <span className="text-xs text-slate-500 tabular-nums">{formatCurrency(cat.value * 1000)}</span>
            </div>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: cat.color }}
                initial={{ width: 0 }}
                animate={{ width: `${(cat.value / total) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.07, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Category Styles ──────────────────────────────────────
const categoryStyles = {
  Income:        { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <ArrowDownLeft size={13} /> },
  Shopping:      { bg: 'bg-blue-50',    text: 'text-blue-600',    icon: null },
  Transport:     { bg: 'bg-amber-50',   text: 'text-amber-600',   icon: null },
  Utilities:     { bg: 'bg-slate-100',  text: 'text-slate-600',   icon: null },
  Dining:        { bg: 'bg-orange-50',  text: 'text-orange-600',  icon: null },
  Healthcare:    { bg: 'bg-purple-50',  text: 'text-purple-600',  icon: null },
  Entertainment: { bg: 'bg-pink-50',    text: 'text-pink-600',    icon: null },
  Housing:       { bg: 'bg-indigo-50',  text: 'text-indigo-600',  icon: null },
  Transfer:      { bg: 'bg-cyan-50',    text: 'text-cyan-600',    icon: <ArrowLeftRight size={13} /> },
}

// ─── Recent Transactions ───────────────────────────────────
function RecentTransactions() {
  const { transactions } = useApp()
  const recent = transactions.slice(0, 5)
  return (
    <Card className="p-0 overflow-hidden col-span-2">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-[15px] font-semibold text-slate-900" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>Recent Transactions</h3>
          <p className="text-xs text-slate-400 mt-0.5">Latest {recent.length} activities</p>
        </div>
        <Link to="/app/transactions">
          <Button variant="ghost" size="sm" iconRight={<ChevronRight size={13} />}>View all</Button>
        </Link>
      </div>
      <div className="divide-y divide-slate-50">
        {recent.map((txn, i) => {
          const style = categoryStyles[txn.category] || { bg: 'bg-slate-100', text: 'text-slate-600', icon: null }
          const isCredit = txn.type === 'credit'
          return (
            <motion.div
              key={txn.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, ease: [0.4, 0, 0.2, 1] }}
              className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/70 transition-colors duration-100 cursor-pointer group"
            >
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[11px] font-bold transition-all',
                style.bg, style.text
              )}>
                {style.icon || txn.category.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{txn.description}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{formatRelative(txn.transaction_date || txn.date)} · {txn.category}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={cn(
                  'text-sm font-semibold tabular-nums',
                  isCredit ? 'text-emerald-600' : 'text-slate-800'
                )}>
                  {isCredit ? '+' : '−'}{formatCurrency(Math.abs(parseFloat(txn.amount)))}
                </p>
                {txn.status === 'pending' && (
                  <Badge variant="warning" size="sm" className="mt-0.5">Pending</Badge>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </Card>
  )
}

// ─── Quick Stats ───────────────────────────────────────────
function QuickStats() {
  const thisMonthIncome   = 0
  const thisMonthExpenses = 0

  return (
    <>
      <StatCard
        label="Monthly Income"
        value={formatCurrency(thisMonthIncome)}
        delta={8.2}
        deltaLabel="vs last month"
        icon={<TrendingUp size={16} className="text-emerald-600" />}
        iconBg="bg-emerald-50"
      />
      <StatCard
        label="Monthly Expenses"
        value={formatCurrency(thisMonthExpenses)}
        delta={-3.1}
        deltaLabel="vs last month"
        icon={<TrendingDown size={16} className="text-red-500" />}
        iconBg="bg-red-50"
      />
    </>
  )
}

// ─── Connected Banks Summary ───────────────────────────────
function ConnectedBanksSummary() {
  const { bankAccounts } = useApp();
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>Connected Banks</h3>
        <Link to="/app/banks">
          <Button variant="ghost" size="sm" iconRight={<ChevronRight size={12} />}>Manage</Button>
        </Link>
      </div>
      <div className="space-y-3">
        {bankAccounts.slice(0, 4).map(acc => (
          <div key={acc.id} className="flex items-center gap-3 group">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-slate-900"
            >
              {acc.connection?.bank_name?.slice(0, 1) || 'B'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{acc.connection?.bank_name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <p className="text-[10px] text-slate-400">{acc.account_name} · Synced just now</p>
              </div>
            </div>
            <p className="text-sm font-bold text-slate-900 tabular-nums text-right">{formatCurrency(acc.available_balance || acc.current_balance)}</p>
          </div>
        ))}
      </div>
      <Link to="/app/banks">
        <button className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-medium text-slate-500 hover:border-brand-200 hover:text-brand-600 hover:bg-brand-50 transition-all duration-150 cursor-pointer group">
          <Plus size={13} />
          Connect another bank
        </button>
      </Link>
    </Card>
  )
}

// ─── Pending Actions ───────────────────────────────────────
function PendingActions() {
  const { payments } = useApp()
  const pending = payments.filter(p => p.status === 'initiated' || p.status === 'pending')
  
  if (!pending.length) return null
  return (
    <Card className="p-4 border-l-4 border-l-amber-400 bg-amber-50/40">
      <div className="flex items-start gap-3">
        <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-slate-900">{pending.length} pending transfer{pending.length > 1 ? 's' : ''}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            You have transfers awaiting bank settlement. They will appear in your transactions once cleared.
          </p>
        </div>
      </div>
    </Card>
  )
}

// ─── Main Dashboard ────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useApp()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <AppLayout
      title={`${greeting}, ${user?.name?.split(' ')[0] || 'User'}`}
      subtitle="Your financial overview"
    >
      <div className="space-y-5">
        {/* Pending actions banner */}
        <PendingActions />

        {/* Row 1: Balance hero + 3 stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <TotalBalanceCard />
          <QuickStats />
        </div>

        {/* Row 2: Chart + category */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SpendingChart />
          <CategoryBreakdown />
        </div>

        {/* Row 3: Transactions + side column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <RecentTransactions />
          <div className="space-y-4">
            <ConnectedBanksSummary />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

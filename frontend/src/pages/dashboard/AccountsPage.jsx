import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Copy, ChevronRight, Landmark, TrendingUp, ShieldCheck, CheckCircle2, CreditCard, ExternalLink, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { AppLayout, BreadcrumbBar } from '@/components/layout/AppLayout'
import { Card, Button, Badge } from '@/components/ui'
import { formatDate, cn } from '@/lib/utils'
import { formatPence } from '@/lib/currencyFormatters'
import { useApp } from '@/store/AppContext'
import ConnectBankButton from '@/components/ConnectBankButton'

// ─── Bank Card Visual ──────────────────────────────────────
function BankCardVisual({ account, selected, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-200 select-none shadow-sm',
        selected ? 'ring-2 ring-teal-600 ring-offset-2 ring-offset-slate-50 shadow-md' : 'hover:shadow-md'
      )}
      style={{
        background: selected 
          ? `linear-gradient(135deg, #0F172A 0%, ${account.color || '#0D9488'} 100%)`
          : `linear-gradient(135deg, #1E293B 0%, ${account.color || '#334155'} 100%)`
      }}
    >
      {/* Decorative background glow */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-start justify-between mb-8 relative z-10">
        <div>
          <span className="inline-block text-[10px] font-bold text-teal-300 uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-full mb-1">
            {account.connection?.bank_name || 'Bank Account'}
          </span>
          <p className="text-white text-sm font-semibold tracking-tight">{account.account_name}</p>
        </div>
        <div className="w-9 h-7 bg-amber-400/90 rounded-lg flex items-center justify-center shadow-inner border border-amber-300/40">
          <div className="grid grid-cols-2 gap-0.5 w-5 h-4">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-amber-900/40 rounded-sm" />)}
          </div>
        </div>
      </div>

      {/* Account Number */}
      <div className="mb-6 relative z-10">
        <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-0.5">Account Number</p>
        <p className="text-white font-mono text-base tracking-[0.25em]">**** {account.account_number}</p>
      </div>

      {/* Balance & Badges */}
      <div className="flex items-end justify-between relative z-10 pt-2 border-t border-white/10">
        <div>
          <p className="text-white/50 text-[10px] uppercase tracking-widest">Available Balance</p>
          <p className="text-white text-2xl font-bold tracking-tight tabular-nums">
            {formatPence(account.available_balance || account.current_balance)}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {account.isPrimary && (
            <span className="text-[10px] font-semibold bg-teal-500/30 text-teal-200 border border-teal-400/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Primary
            </span>
          )}
          <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
            Active
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Account Detail Panel ──────────────────────────────────
function AccountDetail({ account }) {
  const { transactions } = useApp()
  const [copiedField, setCopiedField] = useState(null)

  const acctTransactions = transactions.filter(t => t.account_id === account.id || t.accountId === account.id)

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <motion.div
      key={account.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Account Info Card */}
      <Card className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">{account.account_name} Details</h3>
            <p className="text-xs text-slate-500">Verified open banking account connection</p>
          </div>
          <Badge variant={account.status === 'active' ? 'success' : 'neutral'} dot>
            {account.status || 'Active'}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Financial Institution</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{account.connection?.bank_name || 'Partner Bank'}</p>
            </div>
            <Landmark size={18} className="text-teal-600" />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Currency</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{account.currency || 'GBP'} (British Pound)</p>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-md border border-teal-100">GBP</span>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
            <span className="text-xs text-slate-500">Account Mask</span>
            <span className="text-xs font-mono font-semibold text-slate-800">**** {account.account_number}</span>
          </div>

          <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
            <span className="text-xs text-slate-500">Connection Date</span>
            <span className="text-xs font-semibold text-slate-700">{formatDate(account.created_at || account.createdAt || new Date())}</span>
          </div>

          {account.sort_code && (
            <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
              <span className="text-xs text-slate-500">Sort Code</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-slate-800">{account.sort_code}</span>
                <button
                  onClick={() => copyToClipboard(account.sort_code, 'sort_code')}
                  className="p-1 rounded text-teal-600 hover:bg-teal-50 transition-colors"
                  aria-label="Copy Sort Code"
                >
                  {copiedField === 'sort_code' ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}

          {account.bacs_account && (
            <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
              <span className="text-xs text-slate-500">Local Clearing No.</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-slate-800">{account.bacs_account}</span>
                <button
                  onClick={() => copyToClipboard(account.bacs_account, 'bacs_account')}
                  className="p-1 rounded text-teal-600 hover:bg-teal-50 transition-colors"
                  aria-label="Copy Clearing Number"
                >
                  {copiedField === 'bacs_account' ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}

          {account.iban && (
            <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
              <span className="text-xs text-slate-500">IBAN</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-slate-800 break-all">{account.iban}</span>
                <button
                  onClick={() => copyToClipboard(account.iban, 'iban')}
                  className="p-1 rounded text-teal-600 hover:bg-teal-50 transition-colors"
                  aria-label="Copy IBAN"
                >
                  {copiedField === 'iban' ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Recent Transactions Panel */}
      <Card className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Recent Activity</h3>
            <p className="text-xs text-slate-500">Filtered transactions for selected account</p>
          </div>
          <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
            {acctTransactions.length} records
          </span>
        </div>

        {acctTransactions.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs font-medium text-slate-500">No transactions recorded for this account yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {acctTransactions.map(txn => (
              <div key={txn.id} className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold',
                    txn.type === 'credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                  )}>
                    {txn.type === 'credit' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{txn.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500">{txn.category}</span>
                      <span className="text-[10px] text-slate-400">•</span>
                      <span className="text-[10px] text-slate-400">{formatDate(txn.date || new Date())}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className={cn('text-sm font-bold tabular-nums', txn.type === 'credit' ? 'text-emerald-600' : 'text-slate-900')}>
                    {txn.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(txn.amount))}
                  </p>
                  <span className="text-[10px] font-medium text-slate-400 uppercase">GBP</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  )
}

// ─── Accounts Page ─────────────────────────────────────────
export default function AccountsPage() {
  const { bankAccounts, bankConnections } = useApp();
  const [selected, setSelected] = useState(bankAccounts.length > 0 ? bankAccounts[0] : null)

  useEffect(() => {
    if (!selected && bankAccounts.length > 0) {
      setSelected(bankAccounts[0])
    }
  }, [selected, bankAccounts])

  const totalBalance = bankAccounts.reduce((s, a) => s + Number(a.available_balance || a.current_balance || 0), 0)

  return (
    <AppLayout title="Connected Accounts" subtitle="Centralized management of your linked open banking accounts in the UK">
      <div className="space-y-6">
        {/* Navigation Breadcrumb Bar */}
        <BreadcrumbBar
          items={[
            { label: 'Overview', to: '/app/dashboard' },
            { label: 'Connected Accounts' }
          ]}
          backTo="/app/dashboard"
          backLabel="Overview"
        />

        {/* Header Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl border-l-4 border-l-teal-600">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Combined Liquid Balance</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatPence(totalBalance)}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> Live aggregate from {bankAccounts.length} accounts
            </p>
          </Card>

          <Card className="p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl border-l-4 border-l-emerald-600">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Connected Institutions</p>
            <p className="text-2xl font-bold text-slate-900">{bankConnections.length}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <ShieldCheck size={12} className="text-teal-600" /> Compliant with UK Open Banking Framework
            </p>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider mb-1">Add Account</p>
              <p className="text-sm font-semibold text-white">Link bank account</p>
              <p className="text-[11px] text-teal-100/70 mt-0.5">Secure OAuth2 connectivity</p>
            </div>
            <ConnectBankButton />
          </Card>
        </div>

        {/* Layout: Card Selection + Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Cards List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Linked Cards ({bankAccounts.length})</h3>
            </div>
            
            {bankAccounts.length === 0 && (
              <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-6">
                <Landmark className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-sm font-semibold text-slate-700">No bank accounts linked</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">Connect your bank account to sync balances and transactions.</p>
                <ConnectBankButton />
              </div>
            )}

            {bankAccounts.map(acc => (
              <BankCardVisual
                key={acc.id}
                account={acc}
                selected={selected?.id === acc.id}
                onClick={() => setSelected(acc)}
              />
            ))}
          </div>

          {/* Right Column: Account Details & Txn Stream */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selected && <AccountDetail key={selected.id} account={selected} />}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

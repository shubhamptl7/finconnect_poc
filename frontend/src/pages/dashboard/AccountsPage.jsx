import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Copy, ChevronRight, MoreHorizontal, Landmark, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, Button, Badge, Modal } from '@/components/ui'
import { accounts, availableBanks } from '@/store/mockData'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useApp } from '@/store/AppContext'
import ConnectBankButton from '@/components/ConnectBankButton'

// ─── Bank Card Visual ──────────────────────────────────────
function BankCardVisual({ account, selected, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'bank-card cursor-pointer transition-all duration-200 select-none',
        selected && 'ring-2 ring-brand-400 ring-offset-2 ring-offset-slate-50 scale-[1.01]'
      )}
      style={{ background: `linear-gradient(135deg, #0f172a 0%, ${account.color} 100%)` }}
    >
      {/* Chip */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-1">{account.connection?.bank_name}</p>
          <p className="text-white/70 text-xs">{account.account_name}</p>
        </div>
        <div className="w-8 h-6 bg-yellow-300/80 rounded-md flex items-center justify-center">
          <div className="grid grid-cols-2 gap-0.5 w-4 h-3">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-yellow-700/60 rounded-sm" />)}
          </div>
        </div>
      </div>

      {/* Number */}
      <p className="text-white font-mono text-sm tracking-[0.2em] mb-4">**** {account.account_number}</p>

      {/* Balance + info */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-white/40 text-[9px] uppercase tracking-widest">Balance ({account.currency})</p>
          <p className="text-white text-xl font-bold tabular-nums">{formatCurrency(account.available_balance || account.current_balance)}</p>
        </div>
        <div className="text-right">
          {account.isPrimary && (
            <span className="text-[9px] bg-white/15 text-white/70 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">Primary</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Connect Bank Modal ────────────────────────────────────


// ─── Account Detail ────────────────────────────────────────
function AccountDetail({ account }) {
  const [copiedField, setCopiedField] = useState(null)
  const acctTransactions = [] // Real transactions will come in Phase 2

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <motion.div
      key={account.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Account info */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Account Details</h3>
          <Badge variant={account.status === 'active' ? 'success' : 'neutral'} dot>
            {account.status}
          </Badge>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-xs text-slate-500">Bank</span>
            <span className="text-xs font-semibold text-slate-800">{account.connection?.bank_name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-xs text-slate-500">Account Name</span>
            <span className="text-xs font-semibold text-slate-800">{account.account_name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-xs text-slate-500">Currency</span>
            <span className="text-xs font-semibold text-slate-800">{account.currency}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-xs text-slate-500">Connected</span>
            <span className="text-xs font-semibold text-slate-800">{formatDate(account.created_at || account.createdAt || new Date())}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-xs text-slate-500">Account ID</span>
            <span className="text-xs font-mono text-slate-700">****{account.account_number}</span>
          </div>
          {account.sort_code && (
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-xs text-slate-500">Sort Code</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-700">{account.sort_code}</span>
                <button onClick={() => copyToClipboard(account.sort_code, 'sort_code')} className="text-brand-600 hover:text-brand-800 cursor-pointer transition-colors" aria-label="Copy Sort Code">
                  {copiedField === 'sort_code' ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          )}
          {account.bacs_account && (
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-xs text-slate-500">BACS Account Number</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-700">{account.bacs_account}</span>
                <button onClick={() => copyToClipboard(account.bacs_account, 'bacs_account')} className="text-brand-600 hover:text-brand-800 cursor-pointer transition-colors" aria-label="Copy BACS Account Number">
                  {copiedField === 'bacs_account' ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          )}
          {account.iban && (
            <div className="flex justify-between items-center py-2">
              <span className="text-xs text-slate-500">IBAN</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-700">{account.iban}</span>
                <button onClick={() => copyToClipboard(account.iban, 'iban')} className="text-brand-600 hover:text-brand-800 cursor-pointer transition-colors" aria-label="Copy IBAN">
                  {copiedField === 'iban' ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Recent txns for this account */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Transactions</h3>
        {acctTransactions.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No transactions for this account</p>
        ) : (
          <div className="space-y-3">
            {acctTransactions.map(txn => (
              <div key={txn.id} className="flex items-center gap-3">
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                  txn.type === 'credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                )}>
                  {txn.type === 'credit' ? '↓' : '↑'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{txn.description}</p>
                  <p className="text-[10px] text-slate-400">{txn.category}</p>
                </div>
                <span className={cn('text-xs font-bold tabular-nums', txn.type === 'credit' ? 'text-emerald-600' : 'text-slate-700')}>
                  {txn.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(txn.amount) * 1000)}
                </span>
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

  const totalBalance = bankAccounts.reduce((s, a) => s + parseFloat(a.available_balance || a.current_balance || 0), 0)

  return (
    <AppLayout title="Accounts" subtitle="Manage your connected bank accounts">

      <div className="space-y-6">
        {/* Header stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 border-l-[3px] border-l-brand-500">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Balance</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums stat-number">{formatCurrency(totalBalance)}</p>
          </Card>
          <Card className="p-5 border-l-[3px] border-l-emerald-500">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Connected Banks</p>
            <p className="text-xl font-bold text-slate-900">{bankConnections.length}</p>
          </Card>
          <Card className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Add Account</p>
              <p className="text-sm font-semibold text-slate-700">Connect a bank</p>
            </div>
            <ConnectBankButton />
          </Card>
        </div>

        {/* Cards + detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: card list */}
          <div className="space-y-4">
            {bankAccounts.length === 0 && (
               <p className="text-sm text-slate-500 text-center py-8">No accounts connected yet.</p>
            )}
            {bankAccounts.map(acc => (
              <BankCardVisual
                key={acc.id}
                account={acc}
                selected={selected?.id === acc.id}
                onClick={() => setSelected(acc)}
              />
            ))}
            <div className="mt-4 w-full">
              <ConnectBankButton />
            </div>
          </div>

          {/* Right: detail */}
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

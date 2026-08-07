import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Download, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, Button, Badge, Input, Select } from '@/components/ui'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useApp } from '@/store/AppContext'

const CATEGORIES = ['All', 'Income', 'Shopping', 'Transport', 'Utilities', 'Dining', 'Healthcare', 'Entertainment', 'Housing', 'Transfer']
const PAGE_SIZE = 8

const categoryColors = {
  Income: 'success', Shopping: 'info', Transport: 'warning',
  Utilities: 'neutral', Dining: 'warning', Healthcare: 'purple',
  Entertainment: 'purple', Housing: 'info', Transfer: 'info',
}

export default function TransactionsPage() {
  const { transactions, payments, bankAccounts, syncTransactions, addToast } = useApp()
  const [search, setSearch] = useState('')
  const [accountId, setAccountId] = useState('All')
  const [category, setCategory] = useState('All')
  const [type, setType] = useState('all')
  const [sort, setSort] = useState('date-desc')
  const [page, setPage] = useState(1)
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    let connId = null;
    if (accountId !== 'All') {
       const account = bankAccounts.find(a => a.id === accountId);
       if (account && account.connection_id) connId = account.connection_id;
    }
    const success = await syncTransactions(connId)
    setSyncing(false)
    if (success) {
      addToast({ type: 'success', title: 'Sync Complete', message: 'Transactions are up to date.' })
    } else {
      addToast({ type: 'error', title: 'Sync Failed', message: 'Could not sync transactions.' })
    }
  }

  const combinedTransactions = useMemo(() => {
    const pendingPayments = payments
      .filter(p => p.status === 'initiated' || p.status === 'pending' || p.status === 'cancelled')
      .map(p => ({
        id: p.id,
        description: p.note ? p.note : `Transfer to ${p.beneficiary?.name || 'Beneficiary'}`,
        external_transaction_id: p.provider_reference,
        category: 'Transfer',
        account_id: p.account_id || 'pending',
        account: p.account,
        type: 'debit',
        amount: p.amount,
        status: p.status,
        transaction_date: p.created_at || p.createdAt || new Date().toISOString(),
        is_pending_payment: true
      }))
    
    return [...pendingPayments, ...transactions]
  }, [transactions, payments])

  const filtered = useMemo(() => {
    let list = [...combinedTransactions]
    if (search) list = list.filter(t => t.description?.toLowerCase().includes(search.toLowerCase()) || t.external_transaction_id?.toLowerCase().includes(search.toLowerCase()))
    if (accountId !== 'All') list = list.filter(t => t.account_id === accountId)
    if (category !== 'All') list = list.filter(t => t.category === category)
    if (type === 'credit') list = list.filter(t => t.type === 'credit')
    if (type === 'debit') list = list.filter(t => t.type === 'debit')
    if (sort === 'date-desc') list.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
    if (sort === 'date-asc') list.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date))
    if (sort === 'amount-desc') list.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
    if (sort === 'amount-asc') list.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))
    return list
  }, [combinedTransactions, search, accountId, category, type, sort])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalIn = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + parseFloat(t.amount), 0)
  const totalOut = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + Math.abs(parseFloat(t.amount)), 0)

  return (
    <AppLayout title="Transaction History" subtitle="Full history of your financial activity">
      <div className="space-y-5">

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 overflow-x-auto pb-2 -mb-2 no-scrollbar">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search transactions, references..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>
            <Select value={accountId} onChange={e => { setAccountId(e.target.value); setPage(1) }} className="w-full sm:w-48">
              <option value="All">All Accounts</option>
              {bankAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.connection?.bank_name} ({acc.account_number})</option>
              ))}
            </Select>
            <Select
              value={type}
              onChange={e => { setType(e.target.value); setPage(1) }}
              className="w-full sm:w-36"
            >
              <option value="all">All Types</option>
              <option value="credit">Money In</option>
              <option value="debit">Money Out</option>
            </Select>
            <Select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="w-full sm:w-40"
            >
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="amount-desc">Highest amount</option>
              <option value="amount-asc">Lowest amount</option>
            </Select>
            <Button onClick={handleSync} loading={syncing} variant="secondary" icon={<ArrowUpDown size={15} />} className="flex-shrink-0">Sync</Button>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1) }}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer',
                  category === cat
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </Card>

        {/* Table */}
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Account</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  paginated.map((txn, i) => {
                    const account = bankAccounts.find(a => a.id === txn.account_id) || txn.account;
                    return (
                      <motion.tr
                        key={txn.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="cursor-pointer"
                      >
                        <td>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{txn.description}</p>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{txn.external_transaction_id?.slice(0, 10)}...</p>
                          </div>
                        </td>
                        <td>
                          <Badge variant={categoryColors[txn.category] || 'neutral'}>{txn.category}</Badge>
                        </td>
                        <td>
                          {txn.is_pending_payment && !txn.account ? (
                            <p className="text-xs italic text-slate-500 mt-1">Processing via Plaid...</p>
                          ) : (
                            <>
                              <p className="text-xs text-slate-800 font-semibold">{account?.connection?.bank_name?.split(' ')[0]}</p>
                              <p className="text-xs text-slate-500">{account?.account_name}</p>
                              <p className="text-xs text-slate-400 font-mono">{account?.account_number}</p>
                            </>
                          )}
                        </td>
                        <td className="text-slate-600">
                          <p className="text-xs">{formatDate(txn.transaction_date)}</p>
                          <p className="text-xs text-slate-400">{new Date(txn.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td>
                          <Badge variant={txn.status === 'settled' ? 'success' : txn.status === 'cancelled' ? 'danger' : 'warning'} dot>
                            {txn.status}
                          </Badge>
                        </td>
                        <td className="text-right">
                          <span className={cn('font-bold text-sm tabular-nums', txn.type === 'credit' ? 'text-emerald-600' : 'text-slate-900')}>
                            {txn.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(parseFloat(txn.amount)))}
                          </span>
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={cn(
                      'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium cursor-pointer transition-colors',
                      page === i + 1 ? 'bg-brand-700 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}

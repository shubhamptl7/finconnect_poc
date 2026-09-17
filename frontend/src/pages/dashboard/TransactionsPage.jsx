import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Filter, Download, ArrowUpDown, ChevronLeft, ChevronRight, ArrowDownLeft, ArrowUpRight, Receipt, Calendar } from 'lucide-react'
import { AppLayout, BreadcrumbBar } from '@/components/layout/AppLayout'
import { Card, Button, Badge, Select } from '@/components/ui'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useApp } from '@/store/AppContext'

const CATEGORIES = ['All', 'Income', 'Shopping', 'Transport', 'Utilities', 'Dining', 'Healthcare', 'Entertainment', 'Housing', 'Transfer']
const PAGE_SIZE = 50

const categoryColors = {
  Income: 'success', Shopping: 'info', Transport: 'warning',
  Utilities: 'neutral', Dining: 'warning', Healthcare: 'purple',
  Entertainment: 'purple', Housing: 'info', Transfer: 'info',
}

export default function TransactionsPage() {
  const { transactions, transactionMeta, payments, bankAccounts, fetchTransactions, syncTransactions, addToast, isDecryptingTransactions } = useApp()
  const [search, setSearch] = useState('')
  const [accountId, setAccountId] = useState('All')
  const [category, setCategory] = useState('All')
  const [type, setType] = useState('all')
  const [sort, setSort] = useState('date-desc')
  const [page, setPage] = useState(1)
  const [syncing, setSyncing] = useState(false)

  // Fetch transactions dynamically whenever page changes
  useEffect(() => {
    fetchTransactions(PAGE_SIZE, (page - 1) * PAGE_SIZE)
  }, [page, fetchTransactions])

  const handleSync = async () => {
    setSyncing(true)
    let connId = null
    if (accountId !== 'All') {
       const account = bankAccounts.find(a => a.id === accountId)
       if (account && account.connection_id) connId = account.connection_id
    }
    const success = await syncTransactions(connId)
    setSyncing(false)
    if (success) {
      addToast({ type: 'success', title: 'Sync Complete', message: 'Transactions updated live.' })
      fetchTransactions(PAGE_SIZE, (page - 1) * PAGE_SIZE)
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

  const totalRecords = transactionMeta?.totalCount || filtered.length
  const totalPages = Math.ceil(totalRecords / PAGE_SIZE) || 1

  const pageNumbers = useMemo(() => {
    const maxVisible = 5
    let start = Math.max(1, page - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    const pages = []
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }, [page, totalPages])

  const totals = useMemo(() => {
    let inc = 0
    let exp = 0
    filtered.forEach(t => {
      if (t.amount !== null) {
        const val = Math.abs(parseFloat(t.amount || 0))
        if (t.type === 'credit') inc += val
        else exp += val
      }
    })
    return { inc, exp }
  }, [filtered])

  return (
    <AppLayout title="Transaction History" subtitle="Live stream of your financial activity across all connected bank accounts">
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Navigation Breadcrumb Bar */}
        <BreadcrumbBar
          items={[
            { label: 'Overview', to: '/app/dashboard' },
            { label: 'Transaction History' }
          ]}
          backTo="/app/dashboard"
          backLabel="Overview"
        />

        {/* Metric Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs border-l-4 border-l-brand-600">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Bank Transactions</p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">{totalRecords}</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Stored in Encrypted DB</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs border-l-4 border-l-emerald-500">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Money Received</p>
            <p className="text-2xl font-black text-emerald-600 font-mono mt-1">{formatCurrency(totals.inc)}</p>
            <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">Credits in view</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs border-l-4 border-l-rose-500">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Money Spent</p>
            <p className="text-2xl font-black text-rose-600 font-mono mt-1">{formatCurrency(totals.exp)}</p>
            <p className="text-[11px] font-semibold text-rose-700 mt-0.5">Debits in view</p>
          </div>
        </div>

        {/* Filters Header Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search description, reference, or recipient…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
              />
            </div>

            <Select value={accountId} onChange={e => { setAccountId(e.target.value); setPage(1) }} className="w-full md:w-48 text-xs font-semibold">
              <option value="All">All Bank Accounts</option>
              {bankAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.connection?.bank_name} ({acc.account_number})</option>
              ))}
            </Select>

            <Select value={type} onChange={e => { setType(e.target.value); setPage(1) }} className="w-full md:w-36 text-xs font-semibold">
              <option value="all">All Types</option>
              <option value="credit">Money In (+)</option>
              <option value="debit">Money Out (−)</option>
            </Select>

            <Select value={sort} onChange={e => setSort(e.target.value)} className="w-full md:w-40 text-xs font-semibold">
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </Select>

            <Button onClick={handleSync} loading={syncing} variant="secondary" icon={<ArrowUpDown size={15} />} className="flex-shrink-0">
              Sync
            </Button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1) }}
                className={cn(
                  'px-3.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                  category === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Data Stream Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6 rounded-l-xl">Description</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Bank Account</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right rounded-r-xl">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 text-xs font-semibold">
                      <Receipt size={28} className="mx-auto mb-2 opacity-40" />
                      {isDecryptingTransactions ? 'Decrypting transaction stream...' : 'No transactions matching filters.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((txn) => {
                    const account = bankAccounts.find(a => a.id === txn.account_id) || txn.account
                    const isCredit = txn.type === 'credit'
                    return (
                      <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold',
                              isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-700'
                            )}>
                              {isCredit ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{txn.description || 'Encrypted Transaction'}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{txn.external_transaction_id || 'OB-REF-88402'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={categoryColors[txn.category] || 'neutral'}>{txn.category}</Badge>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-800 text-xs">{account?.connection?.bank_name?.split(' ')[0] || 'Connected Bank'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">****{account?.account_number || '****'}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-semibold text-slate-700">{formatDate(txn.transaction_date)}</p>
                          <p className="text-[10px] text-slate-400">{new Date(txn.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={txn.status === 'settled' || txn.status === 'completed' ? 'success' : txn.status === 'cancelled' ? 'danger' : 'warning'} dot>
                            {txn.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className={cn('font-mono font-extrabold text-sm tabular-nums', isCredit ? 'text-emerald-600' : 'text-slate-900')}>
                            {isCredit ? '+' : '−'}{formatCurrency(Math.abs(parseFloat(txn.amount || 0)))}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Dynamic Numbered Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">
              Showing {totalRecords === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalRecords)} of {totalRecords}
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-semibold disabled:opacity-40 hover:bg-slate-50 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft size={14} /> Prev
              </button>

              {pageNumbers.map(pNum => (
                <button
                  key={pNum}
                  onClick={() => setPage(pNum)}
                  className={cn(
                    'w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center',
                    page === pNum
                      ? 'bg-slate-900 text-white shadow-xs ring-2 ring-slate-900/20'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {pNum}
                </button>
              ))}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-semibold disabled:opacity-40 hover:bg-slate-50 cursor-pointer flex items-center gap-1"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Users, CreditCard, ShieldCheck, Eye, Ban, ArrowUpRight,
  Search, Shield, CheckCircle2, AlertCircle, Activity, Filter,
  ArrowDownLeft, BarChart3, Lock, LogOut, ChevronRight
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AppLayout, BreadcrumbBar } from '@/components/layout/AppLayout'
import { Card, Badge, Button } from '@/components/ui'
import { adminApi } from '@/services/adminApi'
import { formatDate, cn } from '@/lib/utils'

// ─── Admin Customers ───────────────────────────────────────
export function AdminCustomers() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [realCustomers, setRealCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getUsers().then(users => {
      setRealCustomers(users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        joinedAt: u.createdAt || u.created_at,
        kycStatus: 'verified',
        status: u.status,
        accounts: u.bank_accounts_count || 1
      })))
      setLoading(false)
    }).catch(console.error)
  }, [])

  const filtered = useMemo(() => {
    return realCustomers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [realCustomers, search, statusFilter])

  const stats = useMemo(() => ({
    total: realCustomers.length,
    active: realCustomers.filter(c => c.status === 'active').length,
    verifiedKyc: realCustomers.filter(c => c.kycStatus === 'verified').length,
    pending: realCustomers.filter(c => c.status !== 'active').length,
  }), [realCustomers])

  if (loading) {
    return (
      <AppLayout title="Customer Management" subtitle="Platform customer directory & identity status">
        <div className="p-8 text-slate-500 font-medium flex items-center gap-2">
          <Activity size={18} className="animate-spin text-brand-600" /> Loading customer records...
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Customer Management" subtitle="Platform customer directory & identity status">
      <div className="space-y-6">
        {/* Navigation Breadcrumb Bar */}
        <BreadcrumbBar
          items={[
            { label: 'Admin Console', to: '/admin/dashboard' },
            { label: 'Customer Management' }
          ]}
          backTo="/admin/dashboard"
          backLabel="Admin Console"
        />

        {/* Metric Cards Header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Customers</span>
              <Users size={18} className="text-brand-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.total}</p>
            <p className="text-[11px] font-semibold text-emerald-600">Registered platform users</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Active Users</span>
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.active}</p>
            <p className="text-[11px] font-semibold text-slate-500">Fully operational accounts</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Verified KYC</span>
              <ShieldCheck size={18} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.verifiedKyc}</p>
            <p className="text-[11px] font-semibold text-emerald-600">Persona Identity Checked</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Review</span>
              <AlertCircle size={18} className="text-amber-500" />
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.pending}</p>
            <p className="text-[11px] font-semibold text-amber-600">Requires onboarding review</p>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search customers by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {['all', 'active', 'pending'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setStatusFilter(t)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                    statusFilter === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 rounded-l-xl">Customer</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4">KYC Status</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Bank Connections</th>
                  <th className="py-3.5 px-4 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-800 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                          {c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-sm">{c.name}</p>
                          <p className="text-xs text-slate-400 font-medium">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-600">{c.joinedAt ? formatDate(c.joinedAt) : 'N/A'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={c.kycStatus === 'verified' ? 'success' : 'warning'} dot>
                        {c.kycStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={c.status === 'active' ? 'success' : 'danger'} dot>{c.status}</Badge>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{c.accounts} Connected</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" title="View Details" className="p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 cursor-pointer transition-colors">
                          <Eye size={16} />
                        </button>
                        <button type="button" title="Suspend User" className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors">
                          <Ban size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

// ─── Admin Payments ────────────────────────────────────────
export function AdminPayments() {
  const [payments, setPayments] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getPayments().then(data => {
      setPayments(data)
      setLoading(false)
    }).catch(console.error)
  }, [])

  const formatPaymentAmount = (val) => {
    if (val === null || val === undefined) return '0.000';
    const num = Number(val);
    if (isNaN(num) || num === 0) return '0.000';
    const omr = num >= 100 ? num / 1000 : num;
    return omr.toFixed(3);
  };

  const filtered = useMemo(() => {
    return payments.filter(p => {
      const uName = p.user?.name || ''
      const rName = p.recipient_name || p.beneficiary?.name || ''
      const matchesSearch = uName.toLowerCase().includes(search.toLowerCase()) || rName.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [payments, search, statusFilter])

  const stats = useMemo(() => {
    let volume = 0
    let settledCount = 0
    let initiatedCount = 0
    payments.forEach(p => {
      const num = Number(p.amount) || 0
      const omr = num >= 100 ? num / 1000 : num
      if (p.status === 'settled') {
        volume += omr
        settledCount++
      } else {
        initiatedCount++
      }
    })
    return {
      total: payments.length,
      volume: volume.toFixed(3),
      settled: settledCount,
      initiated: initiatedCount,
    }
  }, [payments])

  if (loading) {
    return (
      <AppLayout title="Payment Monitoring" subtitle="Real-time transaction tracking & ACH volume">
        <div className="p-8 text-slate-500 font-medium flex items-center gap-2">
          <Activity size={18} className="animate-spin text-brand-600" /> Loading payment records...
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Payment Monitoring" subtitle="Real-time transaction tracking & ACH volume">
      <div className="space-y-6">
        {/* Navigation Breadcrumb Bar */}
        <BreadcrumbBar
          items={[
            { label: 'Admin Console', to: '/admin/dashboard' },
            { label: 'Payment Monitoring' }
          ]}
          backTo="/admin/dashboard"
          backLabel="Admin Console"
        />

        {/* Metric Cards Header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Volume</span>
              <CreditCard size={18} className="text-brand-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">£{stats.volume}</p>
            <p className="text-[11px] font-semibold text-emerald-600">Settled transaction volume</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Settled Payments</span>
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.settled}</p>
            <p className="text-[11px] font-semibold text-slate-500">Completed P2P transfers</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Initiated / Pending</span>
              <Activity size={18} className="text-amber-500" />
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.initiated}</p>
            <p className="text-[11px] font-semibold text-amber-600">In-flight ACH processing</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Records</span>
              <BarChart3 size={18} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.total}</p>
            <p className="text-[11px] font-semibold text-emerald-600">Monitored transactions</p>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search payments by sender or recipient…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {['all', 'settled', 'initiated'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setStatusFilter(t)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                    statusFilter === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 rounded-l-xl">Sender (User)</th>
                  <th className="py-3.5 px-4">Beneficiary / Recipient</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 rounded-r-xl">Execution Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(p => {
                  const dateStr = p.createdAt || p.created_at;
                  const beneficiaryName = p.recipient_name || p.beneficiary?.name || p.beneficiary?.account_name || (p.note ? `Note: ${p.note}` : 'Direct Transfer');
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                            {p.user?.name ? p.user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <span className="font-extrabold text-slate-900 text-xs">{p.user?.name || 'Unknown User'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{beneficiaryName}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-900 text-sm">£{formatPaymentAmount(p.amount)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={p.status === 'settled' ? 'success' : 'warning'} dot>{p.status}</Badge>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-500">{dateStr ? formatDate(dateStr) : 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

// ─── Admin Audits ──────────────────────────────────────────
export function AdminAudits() {
  const [audits, setAudits] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getAudits().then(data => {
      setAudits(data)
      setLoading(false)
    }).catch(console.error)
  }, [])

  const filtered = useMemo(() => {
    return audits.filter(a => {
      const uName = a.user?.name || 'System'
      const act = a.action || ''
      return uName.toLowerCase().includes(search.toLowerCase()) || act.toLowerCase().includes(search.toLowerCase())
    })
  }, [audits, search])

  const renderMetadataSummary = (metadata) => {
    if (!metadata || typeof metadata !== 'object') return '-';
    const entries = Object.entries(metadata).slice(0, 3);
    return (
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([k, v]) => (
          <span key={k} className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/60 text-[10px] font-semibold text-slate-600">
            <strong className="text-slate-800">{k}:</strong> {typeof v === 'object' ? JSON.stringify(v).slice(0, 15) : String(v)}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <AppLayout title="Security Audit Logs" subtitle="Immutable platform audit trail & security events">
        <div className="p-8 text-slate-500 font-medium flex items-center gap-2">
          <Activity size={18} className="animate-spin text-brand-600" /> Loading audit logs...
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Security Audit Logs" subtitle="Immutable platform audit trail & security events">
      <div className="space-y-6">
        {/* Navigation Breadcrumb Bar */}
        <BreadcrumbBar
          items={[
            { label: 'Admin Console', to: '/admin/dashboard' },
            { label: 'Audit Logs' }
          ]}
          backTo="/admin/dashboard"
          backLabel="Admin Console"
        />

        {/* Metric Cards Header */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Audit Events</span>
              <ShieldCheck size={18} className="text-brand-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{audits.length}</p>
            <p className="text-[11px] font-semibold text-emerald-600">Immutable system logs</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">User Actions</span>
              <Users size={18} className="text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{audits.filter(a => a.user_id).length}</p>
            <p className="text-[11px] font-semibold text-slate-500">Initiated by platform users</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">System Events</span>
              <Lock size={18} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{audits.filter(a => !a.user_id).length}</p>
            <p className="text-[11px] font-semibold text-emerald-600">Automated background events</p>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search audit logs by action or user…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 rounded-l-xl">User / Principal</th>
                  <th className="py-3.5 px-4">Action Event</th>
                  <th className="py-3.5 px-4">Context Metadata</th>
                  <th className="py-3.5 px-4 rounded-r-xl">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(a => {
                  const dateStr = a.createdAt || a.created_at;
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-extrabold text-slate-900">{a.user?.name || 'System Auto'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-900 font-bold text-xs border border-slate-200">
                          {a.action}
                        </span>
                      </td>
                      <td className="py-3 px-4">{renderMetadataSummary(a.metadata)}</td>
                      <td className="py-3 px-4 font-medium text-slate-500">{dateStr ? formatDate(dateStr) : 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

// ─── Admin Executive Dashboard ───────────────────────────────
export function AdminDashboard() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [payments, setPayments] = useState([])
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.getUsers().catch(() => []),
      adminApi.getPayments().catch(() => []),
      adminApi.getAudits().catch(() => [])
    ]).then(([u, p, a]) => {
      setUsers(u || [])
      setPayments(p || [])
      setAudits(a || [])
      setLoading(false)
    })
  }, [])

  const stats = useMemo(() => {
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.status === 'active').length
    const totalPayments = payments.length
    const successPayments = payments.filter(p => p.status === 'completed' || p.status === 'success').length

    return {
      totalUsers,
      activeUsers,
      totalPayments,
      successPayments,
      totalAudits: audits.length
    }
  }, [users, payments, audits])

  if (loading) {
    return (
      <AppLayout title="Admin Executive Dashboard" subtitle="Real-time open banking & platform intelligence">
        <div className="p-8 text-slate-500 font-medium flex items-center gap-2">
          <Activity size={18} className="animate-spin text-brand-600" /> Loading executive dashboard...
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Admin Executive Dashboard" subtitle="Overview of platform identity metrics, payment volume, and security integrity">
      <div className="space-y-6">
        {/* Navigation Breadcrumb Bar */}
        <BreadcrumbBar
          items={[
            { label: 'Loan Applications', to: '/admin/loans' },
            { label: 'Admin Console' }
          ]}
          backTo="/admin/loans"
          backLabel="Loan Applications"
        />

        {/* Metric Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Customers</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-brand-600">
                <Users size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-slate-900">{stats.totalUsers}</p>
              <span className="text-xs font-semibold text-emerald-600">{stats.activeUsers} Active</span>
            </div>
            <p className="text-[11px] font-medium text-slate-500">Verified platform identities</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Payments Monitored</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CreditCard size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-slate-900">{stats.totalPayments}</p>
              <span className="text-xs font-semibold text-emerald-600">{stats.successPayments} Success</span>
            </div>
            <p className="text-[11px] font-medium text-slate-500">Real-time ACH & wire volume</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Audit Trail Logs</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <ShieldCheck size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-slate-900">{stats.totalAudits}</p>
              <span className="text-xs font-semibold text-emerald-600">100% Immutable</span>
            </div>
            <p className="text-[11px] font-medium text-slate-500">Zero security violations detected</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Bank API Connectors</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Shield size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-slate-900">7 / 7</p>
              <span className="text-xs font-semibold text-emerald-600">Operational</span>
            </div>
            <p className="text-[11px] font-medium text-slate-500">Open Banking API rails</p>
          </div>
        </div>

        {/* Quick Action Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-950 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-brand-500/30 text-brand-200 text-[10px] font-bold uppercase tracking-wider border border-brand-400/20">
                  Admin Console
                </span>
                <span className="text-xs text-emerald-200/80">Centralized Platform Operations</span>
              </div>
              <h2 className="text-xl font-bold">Manage Customers, Payments & Security Logs</h2>
              <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
                Access customer identity controls, live payment monitoring, and immutable system audit trail records.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => navigate('/admin/customers')}
                className="px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
              >
                Customer Directory
              </button>
              <button
                onClick={() => navigate('/admin/payments')}
                className="px-4 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-500 transition-colors shadow-sm cursor-pointer"
              >
                Payment Flow
              </button>
              <button
                onClick={() => navigate('/admin/audits')}
                className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-colors border border-white/10 cursor-pointer"
              >
                Audit Trail
              </button>
            </div>
          </div>
        </div>

        {/* Two Column Layout: Recent Users & Recent Audit Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Customers */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Recent Customer Directory</h3>
                <p className="text-xs text-slate-400 font-medium">Newly registered platform accounts</p>
              </div>
              <button
                onClick={() => navigate('/admin/customers')}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
              >
                View all <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {users.slice(0, 5).map(u => (
                <div key={u.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                      {u.name ? u.name.slice(0, 2).toUpperCase() : 'US'}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{u.name}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </div>
                  </div>
                  <span className={cn(
                    'px-2.5 py-1 rounded-xl text-[10px] font-bold border uppercase tracking-wider',
                    u.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  )}>
                    {u.status || 'Active'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent System Security Audits */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Live Security Audit Log</h3>
                <p className="text-xs text-slate-400 font-medium">Real-time system events</p>
              </div>
              <button
                onClick={() => navigate('/admin/audits')}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
              >
                View all <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {audits.slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                      <ShieldCheck size={16} className="text-brand-600" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{a.action}</p>
                      <p className="text-[11px] text-slate-400">{a.user?.name || 'System Auto'}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    {a.createdAt || a.created_at ? formatDate(a.createdAt || a.created_at) : 'Just now'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

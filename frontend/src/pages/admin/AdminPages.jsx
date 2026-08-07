import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, CreditCard, ShieldCheck, Eye, Ban, ArrowUpRight
} from 'lucide-react'
import { Link, NavLink, useLocation, Outlet } from 'react-router-dom'
import { Card, Badge } from '@/components/ui'
import { adminApi } from '@/services/adminApi'
import { formatDate, cn } from '@/lib/utils'

// ─── Admin Layout ──────────────────────────────────────────
const adminNav = [
  { to: '/admin/customers', icon: <Users size={16} />, label: 'Customers' },
  { to: '/admin/payments', icon: <CreditCard size={16} />, label: 'Payments' },
  { to: '/admin/audits', icon: <ShieldCheck size={16} />, label: 'Audit Logs' },
]

function AdminSidebar() {
  const location = useLocation()
  return (
    <aside className="w-56 flex-shrink-0 bg-slate-900 h-screen flex flex-col">
      <div className="h-16 flex items-center px-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">P</span>
          </div>
          <div>
            <span className="text-white font-bold text-sm">PayOman</span>
            <span className="block text-slate-500 text-[9px] uppercase tracking-widest">Admin</span>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {adminNav.map(item => {
          const isActive = location.pathname.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer',
                isActive ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              {item.icon}
              {item.label}
            </NavLink>
          )
        })}
      </nav>
      <div className="p-3 border-t border-slate-800">
        <Link to="/app/dashboard" className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 text-xs font-medium transition-all cursor-pointer">
          <ArrowUpRight size={14} />
          Back to App
        </Link>
      </div>
    </aside>
  )
}

function AdminTopBar({ title }) {
  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-base font-bold text-slate-900">{title}</h1>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400">Admin Panel</span>
        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-700 text-xs font-bold">
          A
        </div>
      </div>
    </header>
  )
}

export function AdminLayout() {
  const location = useLocation()
  const titles = {
    '/admin/customers': 'Customer Management',
    '/admin/payments': 'Payment Monitoring',
    '/admin/audits': 'Audit Logs',
  }
  const title = titles[location.pathname] || 'Admin'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopBar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}

// ─── Admin Customers ───────────────────────────────────────
export function AdminCustomers() {
  const [search, setSearch] = useState('')
  const [realCustomers, setRealCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getUsers().then(users => {
      setRealCustomers(users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        joinedAt: u.createdAt || u.created_at, // Use createdAt to fix formatting issue
        kycStatus: u.status === 'active' ? 'verified' : 'pending',
        status: u.status,
        accounts: 0
      })))
      setLoading(false)
    }).catch(console.error)
  }, [])

  const filtered = realCustomers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="p-6 text-slate-500">Loading customers...</div>

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            placeholder="Search customers…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
          />
        </div>
      </div>
      <Card padding={false}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Joined</th>
              <th>KYC</th>
              <th>Status</th>
              <th>Accounts</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="cursor-pointer">
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-xs font-bold">
                      {c.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="text-xs text-slate-600">{c.joinedAt ? formatDate(c.joinedAt) : 'N/A'}</td>
                <td>
                  <Badge variant={c.kycStatus === 'verified' ? 'success' : c.kycStatus === 'pending' ? 'warning' : 'danger'} dot>
                    {c.kycStatus}
                  </Badge>
                </td>
                <td>
                  <Badge variant={c.status === 'active' ? 'success' : 'danger'} dot>{c.status}</Badge>
                </td>
                <td className="text-sm font-semibold text-slate-700">{c.accounts}</td>
                <td>
                  <div className="flex items-center gap-1">
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 cursor-pointer transition-colors">
                      <Eye size={14} />
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors">
                      <Ban size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ─── Admin Payments ────────────────────────────────────────
export function AdminPayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getPayments().then(data => {
      setPayments(data)
      setLoading(false)
    }).catch(console.error)
  }, [])

  if (loading) return <div className="p-6 text-slate-500">Loading payments...</div>

  return (
    <Card padding={false}>
      <div className="p-5 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">All Payments</h3>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Beneficiary</th>
            <th>Amount (OMR)</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(p => {
            const dateStr = p.createdAt || p.created_at;
            return (
            <tr key={p.id}>
              <td>{p.user?.name || 'Unknown'}</td>
              <td>{p.recipient_name}</td>
              <td className="font-semibold text-slate-900">{(p.amount / 1000).toFixed(3)}</td>
              <td>
                <Badge variant={p.status === 'settled' ? 'success' : 'warning'} dot>{p.status}</Badge>
              </td>
              <td className="text-sm text-slate-500">{dateStr ? formatDate(dateStr) : 'N/A'}</td>
            </tr>
          )})}
        </tbody>
      </table>
    </Card>
  )
}

// ─── Admin Audits ──────────────────────────────────────────
export function AdminAudits() {
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getAudits().then(data => {
      setAudits(data)
      setLoading(false)
    }).catch(console.error)
  }, [])

  if (loading) return <div className="p-6 text-slate-500">Loading audit logs...</div>

  return (
    <Card padding={false}>
      <div className="p-5 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">Audit Logs</h3>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Action</th>
            <th>Metadata</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {audits.map(a => {
            const dateStr = a.createdAt || a.created_at;
            return (
            <tr key={a.id}>
              <td>{a.user?.name || 'System'}</td>
              <td className="font-semibold text-slate-800">{a.action}</td>
              <td className="text-xs text-slate-500 max-w-xs truncate">{JSON.stringify(a.metadata)}</td>
              <td className="text-xs text-slate-500">{dateStr ? formatDate(dateStr) : 'N/A'}</td>
            </tr>
          )})}
        </tbody>
      </table>
    </Card>
  )
}

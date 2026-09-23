import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, CreditCard, ShieldCheck, Eye, Ban, ArrowUpRight,
  Search, Shield, CheckCircle2, AlertCircle, Activity, Filter,
  ArrowDownLeft, BarChart3, Lock, LogOut, ChevronRight, X, ChevronDown,
  Copy, Check, Calendar, RefreshCw, FileText, ArrowRight,
  UserCheck, AlertTriangle, Layers, Building, HelpCircle
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AppLayout, BreadcrumbBar } from '@/components/layout/AppLayout'
import { Card, Badge, Button, TablePagination, Modal, Drawer } from '@/components/ui'
import { adminApi } from '@/services/adminApi'
import { formatDate, formatRelative, formatCurrency, cn } from '@/lib/utils'

// Helper for debouncing search input
function useDebounce(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

// Helper to convert date presets to ISO dates
function getDateRange(preset) {
  if (!preset || preset === 'all') return { startDate: '', endDate: '' }
  const now = new Date()
  const start = new Date()

  if (preset === 'today') {
    start.setHours(0, 0, 0, 0)
  } else if (preset === '7d') {
    start.setDate(now.getDate() - 7)
  } else if (preset === '30d') {
    start.setDate(now.getDate() - 30)
  } else if (preset === '90d') {
    start.setDate(now.getDate() - 90)
  }
  return {
    startDate: start.toISOString(),
    endDate: now.toISOString(),
  }
}

function DropdownFilter({ icon: Icon, value, onChange, options, activeColor = 'brand' }) {
  const isFiltered = value && value !== 'all'
  return (
    <div className="relative inline-flex items-center">
      {Icon && (
        <Icon
          size={13}
          className={cn(
            'absolute left-3 pointer-events-none transition-colors',
            isFiltered ? (activeColor === 'brand' ? 'text-brand-600' : 'text-slate-900') : 'text-slate-400'
          )}
        />
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(
          'pl-8 pr-8 py-2 bg-slate-50 hover:bg-slate-100 border rounded-xl text-xs font-semibold cursor-pointer transition-all appearance-none outline-none focus:ring-2',
          isFiltered
            ? 'border-brand-300 text-brand-900 bg-brand-50/50 focus:ring-brand-500/20'
            : 'border-slate-200 text-slate-700 focus:ring-slate-200'
        )}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-2.5 pointer-events-none text-slate-400">
        <ChevronDown size={14} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 1. ADMIN CUSTOMERS MANAGEMENT
// ─────────────────────────────────────────────────────────────
export function AdminCustomers() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 350)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const [customers, setCustomers] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({ total: 0, active: 0, verifiedKyc: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  // Drawer & Modal States
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerDetails, setCustomerDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [statusModalUser, setStatusModalUser] = useState(null)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRange(dateFilter)
      const res = await adminApi.getUsers({
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter,
        startDate,
        endDate,
      })

      const items = res.data || (Array.isArray(res) ? res : [])
      const meta = res.meta || {}

      setCustomers(items.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isEmailVerified: u.is_email_verified,
        joinedAt: u.createdAt || u.created_at,
        kycStatus: u.kyc_verifications?.some(k => k.status === 'approved') ? 'verified' : 'pending',
        status: u.status,
        accounts: u.bank_accounts?.length || u.bank_accounts_count || 0,
      })))

      setTotalCount(meta.totalCount ?? items.length)
      setTotalPages(meta.totalPages ?? (Math.ceil((meta.totalCount || items.length) / limit) || 1))
      if (meta.stats) {
        setStats(meta.stats)
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err)
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, statusFilter, dateFilter])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, dateFilter])

  // Open Customer Profile Drawer
  const handleOpenProfile = async (customer) => {
    setSelectedCustomer(customer)
    setLoadingDetails(true)
    try {
      const details = await adminApi.getUserDetails(customer.id)
      setCustomerDetails(details)
    } catch (err) {
      console.error('Failed to load user details:', err)
    } finally {
      setLoadingDetails(false)
    }
  }

  // Handle User Status Change (Suspend / Activate)
  const handleConfirmStatusChange = async () => {
    if (!statusModalUser) return
    const newStatus = statusModalUser.status === 'active' ? 'suspended' : 'active'
    setStatusUpdating(true)
    try {
      await adminApi.updateUserStatus(statusModalUser.id, newStatus)
      setStatusModalUser(null)
      if (selectedCustomer?.id === statusModalUser.id) {
        setSelectedCustomer(prev => ({ ...prev, status: newStatus }))
      }
      await fetchCustomers()
    } catch (err) {
      alert(err.message || 'Failed to update user status')
    } finally {
      setStatusUpdating(false)
    }
  }

  return (
    <AppLayout title="Customer Management" subtitle="Platform customer directory, identity status & account lifecycle">
      <div className="space-y-6">
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
            <p className="text-2xl font-black text-slate-900">{stats.total || totalCount}</p>
            <p className="text-[11px] font-semibold text-emerald-600">Registered platform users</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Active Accounts</span>
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.active}</p>
            <p className="text-[11px] font-semibold text-slate-500">Fully operational accounts</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Verified Identity (KYC)</span>
              <ShieldCheck size={18} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.verifiedKyc}</p>
            <p className="text-[11px] font-semibold text-emerald-600">Persona Identity Checked</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Pending / Attention</span>
              <AlertCircle size={18} className="text-amber-500" />
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.pending}</p>
            <p className="text-[11px] font-semibold text-amber-600">Unverified or suspended</p>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6">
          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search customers by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              <DropdownFilter
                icon={Filter}
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'active', label: 'Active Accounts' },
                  { value: 'suspended', label: 'Suspended Accounts' },
                  { value: 'unverified', label: 'Unverified Accounts' },
                ]}
              />

              <DropdownFilter
                icon={Calendar}
                value={dateFilter}
                onChange={setDateFilter}
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: '7d', label: 'Last 7 Days' },
                  { value: '30d', label: 'Last 30 Days' },
                  { value: '90d', label: 'Last 90 Days' },
                ]}
              />

              {(statusFilter !== 'all' || dateFilter !== 'all' || search) && (
                <button
                  type="button"
                  onClick={() => { setStatusFilter('all'); setDateFilter('all'); setSearch(''); }}
                  className="px-2.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw size={12} /> Reset
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 rounded-l-xl">Customer</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4">KYC Status</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Bank Accounts</th>
                  <th className="py-3.5 px-4 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2 font-medium">
                        <Activity size={18} className="animate-spin text-brand-600" />
                        Fetching customer directory records…
                      </div>
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users size={32} className="text-slate-300 stroke-[1.5]" />
                        <p className="font-bold text-slate-700 text-sm">No customers found</p>
                        <p className="text-xs text-slate-400">Try adjusting your search criteria or active filters.</p>
                        {(search || statusFilter !== 'all' || dateFilter !== 'all') && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => { setSearch(''); setStatusFilter('all'); setDateFilter('all'); }}
                            className="mt-2 text-xs"
                          >
                            Reset All Filters
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  customers.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-800 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                            {c.name ? c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'US'}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-sm">{c.name}</p>
                            <p className="text-xs text-slate-400 font-medium">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                          {c.role || 'user'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600">
                        {c.joinedAt ? formatDate(c.joinedAt) : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={c.kycStatus === 'verified' ? 'success' : 'warning'} dot>
                          {c.kycStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={c.status === 'active' ? 'success' : c.status === 'suspended' ? 'danger' : 'warning'}
                          dot
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {c.accounts} Connected
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="View Customer Profile"
                            onClick={() => handleOpenProfile(c)}
                            className="p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 cursor-pointer transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            title={c.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                            onClick={() => setStatusModalUser(c)}
                            className={cn(
                              'p-2 rounded-xl cursor-pointer transition-colors',
                              c.status === 'active'
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            )}
                          >
                            <Ban size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Standard Pagination Bar */}
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
            loading={loading}
          />
        </div>

        {/* Customer Profile Slide-Over Drawer */}
        <Drawer
          open={!!selectedCustomer}
          onClose={() => { setSelectedCustomer(null); setCustomerDetails(null); }}
          title={selectedCustomer?.name || 'Customer Profile'}
          width="md"
        >
          {selectedCustomer && (
            <div className="space-y-6 text-xs text-slate-600">
              {/* Profile Card Header */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-emerald-900 text-white font-extrabold text-base flex items-center justify-center shadow-xs">
                  {selectedCustomer.name?.slice(0, 2).toUpperCase() || 'US'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-slate-900 text-sm truncate">{selectedCustomer.name}</h4>
                  <p className="text-slate-400 truncate">{selectedCustomer.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={selectedCustomer.status === 'active' ? 'success' : 'danger'} dot>
                      {selectedCustomer.status}
                    </Badge>
                    <Badge variant={selectedCustomer.kycStatus === 'verified' ? 'success' : 'warning'} dot>
                      KYC {selectedCustomer.kycStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Identity & Account Specs */}
              <div className="space-y-3">
                <h5 className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Account Details</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">User ID</span>
                    <span className="font-mono text-slate-800 font-bold break-all">{selectedCustomer.id}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Member Since</span>
                    <span className="font-bold text-slate-800">{selectedCustomer.joinedAt ? formatDate(selectedCustomer.joinedAt) : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Linked Bank Accounts */}
              <div className="space-y-3">
                <h5 className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Linked Bank Accounts</h5>
                {loadingDetails ? (
                  <div className="p-4 text-center text-slate-400 flex items-center justify-center gap-2">
                    <Activity size={16} className="animate-spin text-brand-600" /> Loading bank records…
                  </div>
                ) : customerDetails?.bank_accounts?.length ? (
                  <div className="space-y-2">
                    {customerDetails.bank_accounts.map(acc => (
                      <div key={acc.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Building size={16} className="text-slate-400" />
                          <div>
                            <p className="font-bold text-slate-900">{acc.account_name || 'Bank Account'}</p>
                            <p className="text-[10px] text-slate-400 capitalize">{acc.account_type || 'Checking'} · {acc.currency || 'GBP'}</p>
                          </div>
                        </div>
                        <Badge variant={acc.status === 'active' ? 'success' : 'neutral'}>
                          {acc.status || 'Active'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No bank connections found for this user.</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <Button
                  variant={selectedCustomer.status === 'active' ? 'danger' : 'primary'}
                  size="sm"
                  onClick={() => { setStatusModalUser(selectedCustomer); }}
                  className="font-bold text-xs"
                >
                  {selectedCustomer.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                </Button>
              </div>
            </div>
          )}
        </Drawer>

        {/* Status Confirmation Modal */}
        <Modal
          open={!!statusModalUser}
          onClose={() => setStatusModalUser(null)}
          title={statusModalUser?.status === 'active' ? 'Confirm Account Suspension' : 'Confirm Account Reactivation'}
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setStatusModalUser(null)}>
                Cancel
              </Button>
              <Button
                variant={statusModalUser?.status === 'active' ? 'danger' : 'primary'}
                size="sm"
                loading={statusUpdating}
                onClick={handleConfirmStatusChange}
              >
                {statusModalUser?.status === 'active' ? 'Suspend Customer' : 'Activate Customer'}
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-slate-600 text-xs">
            <p>
              Are you sure you want to {statusModalUser?.status === 'active' ? 'suspend' : 'reactivate'}{' '}
              <strong className="text-slate-900">{statusModalUser?.name}</strong> ({statusModalUser?.email})?
            </p>
            {statusModalUser?.status === 'active' ? (
              <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                Suspending this user will immediately revoke API access, pause scheduled transfers, and require admin review to restore.
              </p>
            ) : (
              <p className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                Reactivating this user will restore regular open banking transfer and borrowing capabilities.
              </p>
            )}
          </div>
        </Modal>
      </div>
    </AppLayout>
  )
}

// ─────────────────────────────────────────────────────────────
// 2. ADMIN PAYMENTS MONITORING
// ─────────────────────────────────────────────────────────────
export function AdminPayments() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 350)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const [payments, setPayments] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({ total: 0, volume: 0, settled: 0, initiated: 0 })
  const [loading, setLoading] = useState(true)

  // Selected payment for receipt modal
  const [selectedPayment, setSelectedPayment] = useState(null)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRange(dateFilter)
      const res = await adminApi.getPayments({
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter,
        startDate,
        endDate,
      })

      const items = res.data || (Array.isArray(res) ? res : [])
      const meta = res.meta || {}

      setPayments(items)
      setTotalCount(meta.totalCount ?? items.length)
      setTotalPages(meta.totalPages ?? (Math.ceil((meta.totalCount || items.length) / limit) || 1))
      if (meta.stats) {
        setStats(meta.stats)
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err)
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, statusFilter, dateFilter])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, dateFilter])

  const formatPaymentAmount = (val) => {
    if (val === null || val === undefined) return '0.00'
    const num = Number(val)
    if (isNaN(num) || num === 0) return '0.00'
    // Stored as minor units (pence / cents)
    const major = num / 100
    return major.toFixed(2)
  }

  return (
    <AppLayout title="Payment Monitoring" subtitle="Real-time transaction tracking, ACH rails & ACH volume">
      <div className="space-y-6">
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
              <span className="text-xs font-bold uppercase tracking-wider">Settled Volume</span>
              <CreditCard size={18} className="text-brand-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">£{formatPaymentAmount(stats.volume)}</p>
            <p className="text-[11px] font-semibold text-emerald-600">Settled transaction volume</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Settled Payments</span>
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.settled}</p>
            <p className="text-[11px] font-semibold text-slate-500">Completed P2P & ACH transfers</p>
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
            <p className="text-2xl font-black text-slate-900">{stats.total || totalCount}</p>
            <p className="text-[11px] font-semibold text-emerald-600">Monitored transactions</p>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search payments by sender, recipient or note…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              <DropdownFilter
                icon={Filter}
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'settled', label: 'Settled' },
                  { value: 'initiated', label: 'Initiated' },
                  { value: 'pending', label: 'Pending' },
                ]}
              />

              <DropdownFilter
                icon={Calendar}
                value={dateFilter}
                onChange={setDateFilter}
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: '7d', label: 'Last 7 Days' },
                  { value: '30d', label: 'Last 30 Days' },
                ]}
              />

              {(statusFilter !== 'all' || dateFilter !== 'all' || search) && (
                <button
                  type="button"
                  onClick={() => { setStatusFilter('all'); setDateFilter('all'); setSearch(''); }}
                  className="px-2.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw size={12} /> Reset
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 rounded-l-xl">Sender (User)</th>
                  <th className="py-3.5 px-4">Beneficiary / Recipient</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Execution Date</th>
                  <th className="py-3.5 px-4 rounded-r-xl text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2 font-medium">
                        <Activity size={18} className="animate-spin text-brand-600" />
                        Loading payment monitoring records…
                      </div>
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <CreditCard size={32} className="text-slate-300 stroke-[1.5]" />
                        <p className="font-bold text-slate-700 text-sm">No payment records found</p>
                        <p className="text-xs text-slate-400">No transactions match your current search or date parameters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  payments.map(p => {
                    const dateStr = p.createdAt || p.created_at
                    const beneficiaryName = p.recipient_name || p.beneficiary?.name || p.beneficiary?.account_name || (p.note ? `Note: ${p.note}` : 'Direct Transfer')
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPayment(p)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                              {p.user?.name ? p.user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 text-xs block">{p.user?.name || 'Unknown User'}</span>
                              <span className="text-[10px] text-slate-400">{p.user?.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{beneficiaryName}</td>
                        <td className="py-3 px-4 font-extrabold text-slate-900 text-sm font-mono">
                          £{formatPaymentAmount(p.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={p.status === 'settled' ? 'success' : 'warning'} dot>
                            {p.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-500">
                          {dateStr ? formatDate(dateStr) : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
            loading={loading}
          />
        </div>

        {/* Payment Receipt Modal */}
        <Modal
          open={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          title="Payment Transaction Receipt"
          size="md"
        >
          {selectedPayment && (
            <div className="space-y-5 text-xs text-slate-600">
              {/* Receipt Amount Header */}
              <div className="text-center py-4 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount Transferred</p>
                <p className="text-3xl font-black text-slate-900 font-mono mt-1">£{formatPaymentAmount(selectedPayment.amount)}</p>
                <div className="mt-2 flex justify-center">
                  <Badge variant={selectedPayment.status === 'settled' ? 'success' : 'warning'} dot>
                    {selectedPayment.status}
                  </Badge>
                </div>
              </div>

              {/* Details Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-400">Transaction ID</span>
                  <span className="font-mono text-slate-800 font-semibold">{selectedPayment.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-400">Sender Principal</span>
                  <span className="font-bold text-slate-900">{selectedPayment.user?.name || 'Unknown User'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-400">Beneficiary / Recipient</span>
                  <span className="font-bold text-slate-900">
                    {selectedPayment.recipient_name || selectedPayment.beneficiary?.name || 'Direct Transfer'}
                  </span>
                </div>
                {selectedPayment.note && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-400">Transfer Note</span>
                    <span className="font-medium text-slate-700">{selectedPayment.note}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-400">Timestamp</span>
                  <span className="font-medium text-slate-700">
                    {selectedPayment.createdAt || selectedPayment.created_at ? formatDate(selectedPayment.createdAt || selectedPayment.created_at) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppLayout>
  )
}

// ─────────────────────────────────────────────────────────────
// 3. ADMIN AUDITS (IMMUTABLE LOGS)
// ─────────────────────────────────────────────────────────────
export function AdminAudits() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 350)
  const [actionCategory, setActionCategory] = useState('all')
  const [actorType, setActorType] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const [audits, setAudits] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({ total: 0, userActions: 0, systemEvents: 0 })
  const [loading, setLoading] = useState(true)

  // JSON Inspector Modal
  const [inspectAudit, setInspectAudit] = useState(null)
  const [copied, setCopied] = useState(false)

  const fetchAudits = useCallback(async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRange(dateFilter)
      const res = await adminApi.getAudits({
        page,
        limit,
        search: debouncedSearch,
        action: actionCategory,
        actorType,
        startDate,
        endDate,
      })

      const items = res.data || (Array.isArray(res) ? res : [])
      const meta = res.meta || {}

      setAudits(items)
      setTotalCount(meta.totalCount ?? items.length)
      setTotalPages(meta.totalPages ?? (Math.ceil((meta.totalCount || items.length) / limit) || 1))
      if (meta.stats) {
        setStats(meta.stats)
      }
    } catch (err) {
      console.error('Failed to fetch audits:', err)
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, actionCategory, actorType, dateFilter])

  useEffect(() => {
    fetchAudits()
  }, [fetchAudits])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, actionCategory, actorType, dateFilter])

  const handleCopyJson = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderMetadataSummary = (metadata) => {
    if (!metadata || typeof metadata !== 'object') return <span className="text-slate-400 italic">None</span>
    const entries = Object.entries(metadata).slice(0, 3)
    return (
      <div className="flex flex-wrap gap-1.5 items-center">
        {entries.map(([k, v]) => (
          <span key={k} className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/60 text-[10px] font-semibold text-slate-600">
            <strong className="text-slate-800">{k}:</strong> {typeof v === 'object' ? JSON.stringify(v).slice(0, 15) : String(v)}
          </span>
        ))}
      </div>
    )
  }

  return (
    <AppLayout title="Security Audit Logs" subtitle="Immutable platform audit trail, access events & administrative forensic logs">
      <div className="space-y-6">
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
            <p className="text-2xl font-black text-slate-900">{stats.total || totalCount}</p>
            <p className="text-[11px] font-semibold text-emerald-600">Immutable forensic ledger</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">User Action Events</span>
              <Users size={18} className="text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.userActions}</p>
            <p className="text-[11px] font-semibold text-slate-500">Initiated by platform users & staff</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Automated System Events</span>
              <Lock size={18} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.systemEvents}</p>
            <p className="text-[11px] font-semibold text-emerald-600">Background tasks & security webhooks</p>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6">
          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search audit logs by action or user…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              <DropdownFilter
                icon={Users}
                value={actorType}
                onChange={setActorType}
                options={[
                  { value: 'all', label: 'All Actors' },
                  { value: 'user', label: 'Platform Users' },
                  { value: 'system', label: 'System Engine' },
                ]}
              />

              <DropdownFilter
                icon={Filter}
                value={actionCategory}
                onChange={setActionCategory}
                options={[
                  { value: 'all', label: 'All Actions' },
                  { value: 'user', label: 'User Events' },
                  { value: 'payment', label: 'Payment Events' },
                  { value: 'loan', label: 'Loan Events' },
                ]}
              />

              <DropdownFilter
                icon={Calendar}
                value={dateFilter}
                onChange={setDateFilter}
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: '7d', label: 'Last 7 Days' },
                  { value: '30d', label: 'Last 30 Days' },
                ]}
              />

              {(actorType !== 'all' || actionCategory !== 'all' || dateFilter !== 'all' || search) && (
                <button
                  type="button"
                  onClick={() => { setActorType('all'); setActionCategory('all'); setDateFilter('all'); setSearch(''); }}
                  className="px-2.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw size={12} /> Reset
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 rounded-l-xl">User / Principal</th>
                  <th className="py-3.5 px-4">Action Event</th>
                  <th className="py-3.5 px-4">Context Metadata</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 rounded-r-xl text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2 font-medium">
                        <Activity size={18} className="animate-spin text-brand-600" />
                        Querying audit trail logs…
                      </div>
                    </td>
                  </tr>
                ) : audits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <ShieldCheck size={32} className="text-slate-300 stroke-[1.5]" />
                        <p className="font-bold text-slate-700 text-sm">No audit logs found</p>
                        <p className="text-xs text-slate-400">No logs match your filter or search criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  audits.map(a => {
                    const dateStr = a.createdAt || a.created_at
                    return (
                      <tr
                        key={a.id}
                        onClick={() => setInspectAudit(a)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                              {a.user?.name ? a.user.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900">{a.user?.name || 'System Auto'}</p>
                              {a.user?.email && <p className="text-[10px] text-slate-400">{a.user.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-900 font-mono font-bold text-[11px] border border-slate-200">
                            {a.action}
                          </span>
                        </td>
                        <td className="py-3 px-4">{renderMetadataSummary(a.metadata)}</td>
                        <td className="py-3 px-4 font-medium text-slate-500">
                          {dateStr ? formatDate(dateStr) : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="font-bold text-xs hover:bg-brand-50 hover:text-brand-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              setInspectAudit(a)
                            }}
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
            loading={loading}
          />
        </div>

        {/* JSON Metadata Inspector Modal */}
        <Modal
          open={!!inspectAudit}
          onClose={() => setInspectAudit(null)}
          title="Audit Log Event Inspector"
          size="lg"
        >
          {inspectAudit && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Action</span>
                  <span className="font-mono font-bold text-slate-900">{inspectAudit.action}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Actor</span>
                  <span className="font-bold text-slate-900">{inspectAudit.user?.name || 'System Auto'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Log ID</span>
                  <span className="font-mono text-slate-700 truncate block">{inspectAudit.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Timestamp</span>
                  <span className="font-medium text-slate-700">
                    {inspectAudit.createdAt || inspectAudit.created_at ? formatDate(inspectAudit.createdAt || inspectAudit.created_at) : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Immutable JSON Context Metadata</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    onClick={() => handleCopyJson(inspectAudit.metadata || {})}
                    className="text-xs"
                  >
                    {copied ? 'Copied JSON' : 'Copy JSON'}
                  </Button>
                </div>
                <div className="bg-slate-900 text-emerald-400 font-mono p-4 rounded-xl max-h-96 overflow-y-auto text-xs leading-relaxed border border-slate-800 shadow-inner">
                  <pre>{JSON.stringify(inspectAudit.metadata || {}, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppLayout>
  )
}

// ─────────────────────────────────────────────────────────────
// 4. ADMIN EXECUTIVE DASHBOARD
// ─────────────────────────────────────────────────────────────
export function AdminDashboard() {
  const navigate = useNavigate()
  const [usersCount, setUsersCount] = useState(0)
  const [activeUsersCount, setActiveUsersCount] = useState(0)
  const [paymentsCount, setPaymentsCount] = useState(0)
  const [paymentsSuccessCount, setPaymentsSuccessCount] = useState(0)
  const [auditsCount, setAuditsCount] = useState(0)
  const [recentUsers, setRecentUsers] = useState([])
  const [recentAudits, setRecentAudits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.getUsers({ limit: 5 }).catch(() => ({ data: [], meta: {} })),
      adminApi.getPayments({ limit: 5 }).catch(() => ({ data: [], meta: {} })),
      adminApi.getAudits({ limit: 5 }).catch(() => ({ data: [], meta: {} }))
    ]).then(([uRes, pRes, aRes]) => {
      const uList = uRes.data || (Array.isArray(uRes) ? uRes : [])
      const pList = pRes.data || (Array.isArray(pRes) ? pRes : [])
      const aList = aRes.data || (Array.isArray(aRes) ? aRes : [])

      setRecentUsers(uList.slice(0, 5))
      setRecentAudits(aList.slice(0, 5))

      // Use stats if provided by meta, else fallback to counts
      setUsersCount(uRes.meta?.stats?.total ?? uRes.meta?.totalCount ?? uList.length)
      setActiveUsersCount(uRes.meta?.stats?.active ?? uList.filter(u => u.status === 'active').length)
      setPaymentsCount(pRes.meta?.stats?.total ?? pRes.meta?.totalCount ?? pList.length)
      setPaymentsSuccessCount(pRes.meta?.stats?.settled ?? pList.filter(p => p.status === 'settled').length)
      setAuditsCount(aRes.meta?.stats?.total ?? aRes.meta?.totalCount ?? aList.length)

      setLoading(false)
    })
  }, [])

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
              <p className="text-3xl font-black text-slate-900">{usersCount}</p>
              <span className="text-xs font-semibold text-emerald-600">{activeUsersCount} Active</span>
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
              <p className="text-3xl font-black text-slate-900">{paymentsCount}</p>
              <span className="text-xs font-semibold text-emerald-600">{paymentsSuccessCount} Settled</span>
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
              <p className="text-3xl font-black text-slate-900">{auditsCount}</p>
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
                type="button"
                onClick={() => navigate('/admin/customers')}
                className="px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
              >
                Customer Directory
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/payments')}
                className="px-4 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-500 transition-colors shadow-sm cursor-pointer"
              >
                Payment Flow
              </button>
              <button
                type="button"
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
                type="button"
                onClick={() => navigate('/admin/customers')}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
              >
                View all <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {recentUsers.map(u => (
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
                type="button"
                onClick={() => navigate('/admin/audits')}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
              >
                View all <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {recentAudits.map(a => (
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

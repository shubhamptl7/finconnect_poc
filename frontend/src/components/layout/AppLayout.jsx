import { useState, useCallback, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ArrowLeftRight, Users, Settings,
  Bell, Search, Menu, X, Receipt, Building2,
  HelpCircle, LogOut, BarChart3, Calculator,
  ChevronLeft, Pin, Landmark, Wallet,
  CheckCircle2, Shield, ShieldCheck, Info, CreditCard, User, Lock, Calendar,
} from 'lucide-react'
import { cn, formatRelative, getInitials, stripEmojis } from '@/lib/utils'
import { useApp } from '@/store/AppContext'
import { Badge, SearchInput } from '@/components/ui'

// ─── Logo ─────────────────────────────────────────────────
function Logo({ collapsed, isAdmin }) {
  return (
    <div className="flex items-center gap-3 px-1">
      {/* Premium Logo */}
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-emerald-900 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/30 ring-1 ring-white/20">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="overflow-hidden"
          >
            <span className="font-bold text-slate-900 text-[15px] whitespace-nowrap tracking-[-0.01em]" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>
              Fin<span className="text-brand-600">Connect</span>
            </span>
            <p className="text-[9px] text-brand-700 font-extrabold uppercase tracking-widest -mt-0.5 whitespace-nowrap">
              {isAdmin ? 'Admin Console' : 'Open Banking'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Nav Items ─────────────────────────────────────────────
const baseUserNavItems = [
  { to: '/app/dashboard', icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
  { to: '/app/banks', icon: <Building2 size={17} />, label: 'Connected Banks' },
  { to: '/app/accounts', icon: <Landmark size={17} />, label: 'Accounts' },
  { to: '/app/loans', icon: <CreditCard size={17} />, label: 'Loans' },
  { to: '/app/emi', icon: <Calendar size={17} />, label: 'Manage EMI', isEmi: true },
  { to: '/app/beneficiaries', icon: <Users size={17} />, label: 'Beneficiaries' },
  { to: '/app/payments', icon: <ArrowLeftRight size={17} />, label: 'Payments' },
  { to: '/app/transactions', icon: <Receipt size={17} />, label: 'Transaction History' },
  { to: '/app/notifications', icon: <Bell size={17} />, label: 'Notifications' },
  { to: '/app/calculators/emi', icon: <Calculator size={17} />, label: 'Calculators' },
]

const adminNavItems = [
  { to: '/admin/dashboard', icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
  { to: '/admin/loans', icon: <ShieldCheck size={17} />, label: 'Loan Applications' },
  { to: '/admin/customers', icon: <Users size={17} />, label: 'Customer Management' },
  { to: '/admin/payments', icon: <CreditCard size={17} />, label: 'Payment Monitoring' },
  { to: '/admin/audits', icon: <ShieldCheck size={17} />, label: 'Audit Logs' },
  { to: '/app/notifications', icon: <Bell size={17} />, label: 'Notifications' },
]

function SidebarNavItem({ to, icon, label, collapsed, badge }) {
  const location = useLocation()
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/') || (to.includes('calculators') && location.pathname.includes('calculators'))

  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer group relative',
        isActive
          ? 'bg-brand-50 text-brand-700'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center">
          <motion.div
            layoutId="nav-active"
            className="w-1 h-5 bg-brand-600 rounded-r-full"
          />
        </div>
      )}
      <span className={cn(
        'flex-shrink-0 transition-colors',
        isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'
      )}>
        {icon}
      </span>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="whitespace-nowrap overflow-hidden flex items-center gap-2 flex-1 min-w-0"
          >
            <span className="truncate">{label}</span>
            {badge != null && (
              <span className="ml-auto w-5 h-5 flex items-center justify-center bg-brand-600 text-white text-[9px] rounded-full font-bold flex-shrink-0">
                {badge}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </NavLink>
  )
}

// ─── Sidebar ───────────────────────────────────────────────
export function Sidebar({ collapsed, onToggle }) {
  const { user, logout, unreadCount, activeLoanApplicationId } = useApp()
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)
  const leaveTimer = useRef(null)

  const isAdmin = user?.role === 'admin'
  const activeNavItems = isAdmin ? adminNavItems : baseUserNavItems

  const visuallyCollapsed = collapsed && !isHovered
  const isPeeking = collapsed && isHovered

  const handleMouseEnter = useCallback(() => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    if (collapsed) setIsHovered(true)
  }, [collapsed])

  const handleMouseLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => setIsHovered(false), 100)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  return (
    <motion.aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{ width: visuallyCollapsed ? 68 : 240 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="flex-shrink-0 h-screen border-r border-slate-200/80 flex flex-col overflow-hidden z-20 relative bg-slate-50"
    >
      {/* Peek shadow */}
      {isPeeking && (
        <div className="absolute inset-y-0 right-0 w-px bg-brand-100 z-10" />
      )}

      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 flex-shrink-0">
        <Logo collapsed={visuallyCollapsed} isAdmin={isAdmin} />
        <button
          onClick={onToggle}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer flex-shrink-0',
            isPeeking
              ? 'text-brand-500 bg-brand-50 hover:bg-brand-100'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          )}
          aria-label={collapsed ? 'Pin sidebar open' : 'Collapse sidebar'}
        >
          {isPeeking ? (
            <Pin size={12} className="-rotate-45" />
          ) : (
            <ChevronLeft size={14} className={cn('transition-transform duration-200', collapsed && 'rotate-180')} />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden" role="navigation" aria-label="Main navigation">
        {activeNavItems.map(item => (
          <SidebarNavItem
            key={item.to}
            collapsed={visuallyCollapsed}
            badge={item.to === '/app/notifications' ? (unreadCount > 0 ? unreadCount : undefined) : undefined}
            {...item}
          />
        ))}
      </nav>

      {/* User profile */}
      <div className="p-3 border-t border-slate-100 flex-shrink-0">
        <div
          onClick={() => navigate('/app/profile')}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group',
            visuallyCollapsed && 'justify-center px-2'
          )}
          title="View profile"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-[0_0_0_2px_rgba(15,118,110,0.15)] text-white text-xs font-bold uppercase tracking-wider">
            {user?.initials || getInitials(user?.name, user?.email)}
          </div>
          <AnimatePresence>
            {!visuallyCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{user?.name || 'FinConnect User'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || ''}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!visuallyCollapsed && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer flex-shrink-0 p-1 rounded-lg hover:bg-red-50"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  )
}

// ─── Notification Panel ───────────────────────────────────
function NotificationPanel({ onClose }) {
  const { notifications, markNotificationRead, markAllRead } = useApp()
  const navigate = useNavigate()
  const unread = notifications.filter(n => !n.is_read)

  const typeIconConfig = {
    loan: { bg: 'bg-teal-50 text-teal-700 border-teal-200', text: 'text-teal-700', icon: <Landmark size={13} />, label: 'LOAN' },
    transaction: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700', icon: <ArrowLeftRight size={13} />, label: 'PAYMENT' },
    security: { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700', icon: <Shield size={13} />, label: 'SECURITY' },
    kyc: { bg: 'bg-brand-50 text-brand-700 border-brand-200', text: 'text-brand-700', icon: <CheckCircle2 size={13} />, label: 'KYC' },
    promo: { bg: 'bg-violet-50 text-violet-700 border-violet-200', text: 'text-violet-700', icon: <BarChart3 size={13} />, label: 'UPDATE' },
    default: { bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'text-slate-700', icon: <Info size={13} />, label: 'INFO' },
  }

  const handleItemClick = (n) => {
    markNotificationRead(n.id)
    onClose()
    if (n.action_url) {
      navigate(n.action_url)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
          {unread.length > 0 && (
            <span className="bg-brand-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center justify-center">
              {unread.length} new
            </span>
          )}
        </div>
        {unread.length > 0 && (
          <button onClick={markAllRead} className="text-xs text-teal-700 hover:text-teal-900 font-bold cursor-pointer transition-colors">
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="py-8 text-center">
            <Bell size={24} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-500">No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, 8).map(n => {
            const config = typeIconConfig[n.type] || typeIconConfig.default
            return (
              <button
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={cn(
                  'w-full flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left cursor-pointer group',
                  !n.is_read ? 'bg-teal-50/20' : 'bg-white opacity-85'
                )}
              >
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border shadow-2xs', config.bg)}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('text-xs font-bold truncate', !n.is_read ? 'text-slate-900' : 'text-slate-600')}>
                      {stripEmojis(n.title)}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                      {formatRelative(n.createdAt || n.created_at || new Date())}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{stripEmojis(n.content || n.message)}</p>
                  {n.action_url && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-teal-700 group-hover:underline">
                      View details →
                    </span>
                  )}
                </div>
                {!n.is_read && (
                  <span className="w-2 h-2 rounded-full bg-teal-600 flex-shrink-0 mt-2" />
                )}
              </button>
            )
          })
        )}
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl">
        <button
          onClick={() => { onClose(); navigate('/app/notifications'); }}
          className="w-full text-center text-xs text-teal-700 hover:text-teal-900 font-bold py-1 cursor-pointer transition-colors"
        >
          View all notifications →
        </button>
      </div>
    </div>
  )
}

// ─── Top Bar ───────────────────────────────────────────────
export function TopBar({ title, subtitle }) {
  const { user, notifications, unreadCount, markAllRead, logout } = useApp()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const handleLogout = async () => {
    setShowProfileMenu(false)
    await logout()
    navigate('/auth/login')
  }

  return (
    <header className="h-16 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between pl-16 lg:pl-6 pr-6 flex-shrink-0 sticky top-0 z-40">
      <div>
        <h1 className="text-[17px] font-bold text-slate-900 leading-tight" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui', letterSpacing: '-0.01em' }}>
          {title}
        </h1>
        {subtitle && <p className="text-[11px] text-slate-400 mt-px">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(v => !v)}
            className={cn(
              'relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer',
              showNotifications
                ? 'bg-brand-50 text-brand-600'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            )}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-30"
                  onClick={() => setShowNotifications(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-80 bg-white rounded-2xl border border-slate-100 shadow-[0_8px_24px_rgba(11,18,32,0.10),0_24px_64px_rgba(11,18,32,0.08)] z-40 overflow-hidden"
                >
                  <NotificationPanel onClose={() => setShowNotifications(false)} />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div
          className="relative ml-2"
          onMouseEnter={() => setShowProfileMenu(true)}
          onMouseLeave={() => setShowProfileMenu(false)}
        >
          <button
            onClick={() => navigate('/app/profile')}
            className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center shadow-[0_0_0_2px_rgba(15,118,110,0.15)] cursor-pointer overflow-hidden transition-transform hover:scale-105 text-white text-xs font-bold uppercase tracking-wider"
            aria-label="User profile"
          >
            <span>{user?.initials || getInitials(user?.name, user?.email)}</span>
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-52 bg-white rounded-xl border border-slate-100 shadow-[0_8px_24px_rgba(11,18,32,0.10)] z-50 overflow-hidden py-1"
              >
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
                  <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'FinConnect User'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || ''}</p>
                </div>
                <button
                  onClick={() => { setShowProfileMenu(false); navigate('/app/profile/update') }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors cursor-pointer flex items-center gap-2"
                >
                  <User size={14} className="text-slate-400" />
                  <span>Update Profile</span>
                </button>
                <button
                  onClick={() => { setShowProfileMenu(false); navigate('/app/profile/password') }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Lock size={14} className="text-slate-400" />
                  <span>Change Password</span>
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-2 font-medium"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}

// ─── Mobile Bottom Nav ─────────────────────────────────────
function MobileNav() {
  const { user } = useApp()
  const location = useLocation()
  const isAdmin = user?.role === 'admin'

  const userMobileItems = [
    { to: '/app/dashboard', icon: <LayoutDashboard size={20} />, label: 'Home' },
    { to: '/app/accounts', icon: <Landmark size={20} />, label: 'Accounts' },
    { to: '/app/payments', icon: <ArrowLeftRight size={20} />, label: 'Pay' },
    { to: '/app/banks', icon: <Building2 size={20} />, label: 'Banks' },
    { to: '/app/settings', icon: <Settings size={20} />, label: 'Settings' },
  ]

  const adminMobileItems = [
    { to: '/admin/customers', icon: <Users size={20} />, label: 'Customers' },
    { to: '/admin/payments', icon: <CreditCard size={20} />, label: 'Payments' },
    { to: '/admin/audits', icon: <ShieldCheck size={20} />, label: 'Audits' },
  ]

  const mobileItems = isAdmin ? adminMobileItems : userMobileItems
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-100 flex items-center justify-around px-2 py-2 safe-area-inset-bottom" style={{ boxShadow: '0 -4px 16px rgba(11,18,32,0.06)' }}>
      {mobileItems.map(item => {
        const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              'flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-150',
              isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            {item.icon}
            <span className="text-[9px] font-semibold">{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

// ─── App Layout ────────────────────────────────────────────
export function AppLayout({ children, title, subtitle }) {
  const { sidebarCollapsed, setSidebarCollapsed } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F7F8]">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(v => !v)} />
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ ease: [0.4, 0, 0.2, 1], duration: 0.25 }}
            className="fixed left-0 top-0 h-full z-40 lg:hidden"
          >
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Floating expand button when collapsed */}
        <AnimatePresence>
          {sidebarCollapsed && (
            <motion.button
              key="sidebar-open-btn"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              onClick={() => setSidebarCollapsed(false)}
              className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-4 h-10 bg-white border border-l-0 border-slate-200 rounded-r-lg items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-brand-50 hover:border-brand-200 transition-all duration-150 shadow-sm cursor-pointer"
              aria-label="Expand sidebar"
            >
              <ChevronLeft size={12} className="rotate-180" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="lg:hidden fixed top-3.5 left-4 z-20 w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 shadow-sm cursor-pointer"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        <TopBar title={title} subtitle={subtitle} />

        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="p-6 max-w-screen-xl mx-auto pb-20 lg:pb-6"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  )
}

export { BreadcrumbBar } from './BreadcrumbBar'


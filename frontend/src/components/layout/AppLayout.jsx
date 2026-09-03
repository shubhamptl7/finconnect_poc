import { useState, useCallback, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ArrowLeftRight, Users, Settings,
  Bell, Search, Menu, X, Receipt, Building2,
  HelpCircle, LogOut, BarChart3,
  ChevronLeft, Pin, Landmark, Wallet,
  CheckCircle2, Shield, Info, CreditCard, User, Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/store/AppContext'
import { Badge, SearchInput } from '@/components/ui'

// ─── Logo ─────────────────────────────────────────────────
function Logo({ collapsed }) {
  return (
    <div className="flex items-center gap-3 px-1">
      {/* Premium Logo */}
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-indigo-800 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/30 ring-1 ring-white/20">
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
              Pay<span className="text-brand-600">Oman</span>
            </span>
            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest -mt-0.5 whitespace-nowrap">Open Banking</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Nav Items ─────────────────────────────────────────────
const navItems = [
  { to: '/app/dashboard',     icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
  { to: '/app/banks',         icon: <Building2 size={17} />,       label: 'Connected Banks' },
  { to: '/app/accounts',      icon: <Landmark size={17} />,        label: 'Accounts' },
  { to: '/app/beneficiaries', icon: <Users size={17} />,           label: 'Beneficiaries' },
  { to: '/app/payments',      icon: <ArrowLeftRight size={17} />,  label: 'Payments' },
  { to: '/app/transactions',  icon: <Receipt size={17} />,         label: 'Transaction History' },
]

const bottomNavItems = [
  { to: '/app/notifications', icon: <Bell size={17} />,        label: 'Notifications' },
  { to: '/app/settings',      icon: <Settings size={17} />,    label: 'Settings' },
  { to: '/app/help',          icon: <HelpCircle size={17} />,  label: 'Help & Support' },
]

function SidebarNavItem({ to, icon, label, collapsed, badge }) {
  const location = useLocation()
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/')

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
  const { user, logout, unreadCount } = useApp()
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)
  const leaveTimer = useRef(null)

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
      className="flex-shrink-0 h-screen border-r border-slate-100 flex flex-col overflow-hidden z-20 relative bg-white"
    >
      {/* Peek shadow */}
      {isPeeking && (
        <div className="absolute inset-y-0 right-0 w-px bg-brand-100 z-10" />
      )}

      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 flex-shrink-0">
        <Logo collapsed={visuallyCollapsed} />
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
        {navItems.map(item => (
          <SidebarNavItem
            key={item.to}
            collapsed={visuallyCollapsed}
            badge={item.to === '/app/notifications' ? (unreadCount > 0 ? unreadCount : undefined) : undefined}
            {...item}
          />
        ))}

        {/* Divider */}
        <div className="my-3 h-px bg-slate-100 mx-1" />

        {bottomNavItems.map(item => (
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
        <div className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group',
          visuallyCollapsed && 'justify-center px-2'
        )}>
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-[0_0_0_2px_rgba(27,85,226,0.15)]">
            <span className="text-white text-xs font-bold">{user.initials}</span>
          </div>
          <AnimatePresence>
            {!visuallyCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{user.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!visuallyCollapsed && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleLogout}
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
  const unread = notifications.filter(n => !n.is_read)

  const typeIconConfig = {
    transaction: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <ArrowLeftRight size={13} /> },
    security:    { bg: 'bg-red-50',     text: 'text-red-600',     icon: <Shield size={13} /> },
    kyc:         { bg: 'bg-brand-50',   text: 'text-brand-600',   icon: <CheckCircle2 size={13} /> },
    promo:       { bg: 'bg-violet-50',  text: 'text-violet-600',  icon: <BarChart3 size={13} /> },
    default:     { bg: 'bg-slate-100',  text: 'text-slate-600',   icon: <Info size={13} /> },
  }

  return (
    <div>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
          {unread.length > 0 && (
            <span className="bg-brand-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {unread.length}
            </span>
          )}
        </div>
        {unread.length > 0 && (
          <button onClick={markAllRead} className="text-xs text-brand-600 hover:text-brand-800 font-medium cursor-pointer transition-colors">
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-8 text-center">
            <Bell size={24} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, 6).map(n => {
            const config = typeIconConfig[n.type] || typeIconConfig.default
            return (
              <button
                key={n.id}
                onClick={() => { markNotificationRead(n.id); onClose() }}
                className={cn(
                  'w-full flex items-start gap-3 px-5 py-4 hover:bg-slate-50 transition-colors text-left cursor-pointer border-b border-slate-50 last:border-0',
                  !n.is_read && 'bg-brand-50/30'
                )}
              >
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', config.bg, config.text)}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm font-medium text-slate-900 truncate', !n.is_read && 'font-semibold')}>{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-1" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.content || n.message}</p>
                </div>
              </button>
            )
          })
        )}
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
        <button onClick={onClose} className="w-full text-center text-xs text-brand-600 hover:text-brand-800 font-medium py-1.5 cursor-pointer transition-colors">
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
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between pl-16 lg:pl-6 pr-6 flex-shrink-0 sticky top-0 z-10">
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
            className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center shadow-[0_0_0_2px_rgba(27,85,226,0.15)] cursor-pointer overflow-hidden transition-transform hover:scale-105"
            aria-label="User profile"
          >
            <span className="text-white text-xs font-bold">{user?.initials || 'U'}</span>
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-48 bg-white rounded-xl border border-slate-100 shadow-[0_8px_24px_rgba(11,18,32,0.10)] z-50 overflow-hidden py-1"
              >
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
  const location = useLocation()
  const mobileItems = [
    { to: '/app/dashboard', icon: <LayoutDashboard size={20} />, label: 'Home' },
    { to: '/app/accounts', icon: <Landmark size={20} />, label: 'Accounts' },
    { to: '/app/payments', icon: <ArrowLeftRight size={20} />, label: 'Pay' },
    { to: '/app/banks', icon: <Building2 size={20} />, label: 'Banks' },
    { to: '/app/settings', icon: <Settings size={20} />, label: 'Settings' },
  ]
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
    <div className="flex h-screen overflow-hidden bg-surface-1">
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

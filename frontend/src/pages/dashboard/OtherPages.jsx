import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, Lock, Eye, EyeOff, Plus, ToggleLeft, ToggleRight,
  Bell, Shield, User, Smartphone, Globe, ChevronRight, Download,
  HelpCircle, MessageCircle, Phone, FileText, CheckCircle2,
  BellOff, Zap, AlertTriangle, ShieldCheck, Sparkles
} from 'lucide-react'
import { AppLayout, BreadcrumbBar } from '@/components/layout/AppLayout'
import { Card, Button, Badge, Input, Tabs } from '@/components/ui'
import { useApp } from '@/store/AppContext'
import { formatRelative, cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════
// CARDS PAGE
// ═══════════════════════════════════════════════════════════
function VirtualCard({ frozen }) {
  const [showNumber, setShowNumber] = useState(false)
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-7 text-white shadow-xl transition-all duration-300 select-none max-w-md mx-auto',
        frozen && 'opacity-65 grayscale'
      )}
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #0D9488 60%, #0F766E 100%)'
      }}
    >
      {/* Background patterns */}
      <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute left-1/3 -top-10 w-32 h-32 rounded-full bg-teal-400/20 blur-xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-start justify-between mb-10 relative z-10">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-teal-200 uppercase bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
            FinConnect Virtual Debit
          </span>
          <p className="text-xs text-slate-300 mt-1">GBP Current Account</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={frozen ? 'neutral' : 'success'} className="text-[10px] bg-emerald-500/20 text-emerald-200 border-emerald-400/30">
            {frozen ? '❄ Frozen' : '● Active'}
          </Badge>
          <div className="w-10 h-7 bg-amber-400/90 rounded-md shadow-inner border border-amber-300/40 grid grid-cols-2 gap-0.5 p-1">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-amber-900/40 rounded-sm" />)}
          </div>
        </div>
      </div>

      {/* Card Number */}
      <div className="mb-8 relative z-10 flex items-center gap-3">
        <p className="font-mono text-xl tracking-[0.2em] font-semibold text-white">
          {showNumber ? '4532  1234  5678  9012' : '••••  ••••  ••••  9012'}
        </p>
        <button
          onClick={() => setShowNumber(v => !v)}
          className="text-white/60 hover:text-white transition-colors cursor-pointer p-1"
          aria-label={showNumber ? 'Hide card number' : 'Show card number'}
        >
          {showNumber ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Card Footer */}
      <div className="flex items-end justify-between relative z-10 pt-3 border-t border-white/15">
        <div>
          <p className="text-white/50 text-[9px] uppercase tracking-widest mb-0.5">Cardholder</p>
          <p className="text-white text-sm font-bold tracking-wide">AHMED AL-BALUSHI</p>
        </div>
        <div className="text-right">
          <p className="text-white/50 text-[9px] uppercase tracking-widest mb-0.5">Expires</p>
          <p className="text-white text-sm font-mono font-semibold">12 / 28</p>
        </div>
      </div>
    </div>
  )
}

export function CardsPage() {
  const [frozen, setFrozen] = useState(false)
  const [limitOpen, setLimitOpen] = useState(false)
  const controls = [
    { label: 'Online E-Commerce Payments', desc: 'Allow online card payments & digital subscriptions', enabled: true },
    { label: 'ATM Cash Withdrawals', desc: 'Allow cash withdrawals at local and GCC ATMs', enabled: true },
    { label: 'International Roaming Use', desc: 'Allow point-of-sale transactions abroad', enabled: false },
    { label: 'Contactless Tap-to-Pay', desc: 'Enable NFC contactless payments under £20', enabled: true },
  ]
  const [toggles, setToggles] = useState(controls.map(c => c.enabled))

  return (
    <AppLayout title="Card Management" subtitle="Control digital and physical debit cards for your accounts">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb Bar */}
        <BreadcrumbBar
          items={[
            { label: 'Overview', to: '/app/dashboard' },
            { label: 'Cards' }
          ]}
          backTo="/app/dashboard"
          backLabel="Overview"
        />

        {/* Card visual */}
        <VirtualCard frozen={frozen} />

        {/* Quick actions bar */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant={frozen ? 'danger' : 'secondary'}
            icon={frozen ? <Zap size={15} /> : <Lock size={15} />}
            onClick={() => setFrozen(v => !v)}
            className="w-full justify-center py-2.5 text-xs font-bold"
          >
            {frozen ? 'Unfreeze Card' : 'Freeze Card'}
          </Button>
          <Button variant="secondary" icon={<Eye size={15} />} className="w-full justify-center py-2.5 text-xs font-bold">
            Reveal CVV
          </Button>
          <Button variant="secondary" icon={<Download size={15} />} className="w-full justify-center py-2.5 text-xs font-bold">
            Card Statement
          </Button>
        </div>

        {/* Card limits */}
        <Card className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Spending Limits</h3>
              <p className="text-xs text-slate-500">Configure daily and monthly transaction ceilings</p>
            </div>
            <Button variant="ghost" size="sm" className="text-teal-700 font-semibold" onClick={() => setLimitOpen(true)}>
              Adjust Limits
            </Button>
          </div>

          <div className="space-y-5">
            {[
              { label: 'Daily Card Limit', used: 450, max: 1000 },
              { label: 'Monthly Card Limit', used: 3200, max: 10000 },
            ].map(l => (
              <div key={l.label}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-700 font-semibold">{l.label}</span>
                  <span className="text-slate-600 font-mono font-bold">
                    £{l.used.toLocaleString()} / £{l.max.toLocaleString()}
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                  <div
                    className={cn('h-full rounded-full transition-all duration-300', l.used / l.max > 0.8 ? 'bg-amber-500' : 'bg-teal-600')}
                    style={{ width: `${(l.used / l.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Card controls */}
        <Card className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Security & Channel Controls</h3>
            <p className="text-xs text-slate-500">Enable or disable specific transaction channels instantly</p>
          </div>

          <div className="divide-y divide-slate-100">
            {controls.map((ctrl, i) => (
              <div key={ctrl.label} className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{ctrl.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{ctrl.desc}</p>
                </div>
                <button
                  onClick={() => setToggles(prev => prev.map((v, j) => j === i ? !v : v))}
                  className="cursor-pointer transition-colors p-1"
                  aria-label={toggles[i] ? `Disable ${ctrl.label}` : `Enable ${ctrl.label}`}
                >
                  {toggles[i]
                    ? <ToggleRight size={28} className="text-teal-600" />
                    : <ToggleLeft size={28} className="text-slate-300" />
                  }
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Request physical card */}
        <Card className="p-5 border border-slate-200 bg-slate-50/70 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <CreditCard size={22} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">Request Physical Metal Card</p>
              <p className="text-xs text-slate-500">Delivered by courier to your address within 3–5 business days</p>
            </div>
            <Button variant="secondary" size="sm" className="font-semibold text-xs border-slate-300">
              Order Physical
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}

// ═══════════════════════════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════════════════════════
function SettingRow({ icon, label, desc, iconBg, children }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-slate-100 last:border-0">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconBg || 'bg-slate-100 text-slate-600')}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800">{label}</p>
        {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  )
}

export function SettingsPage() {
  const { user } = useApp()
  const [tab, setTab] = useState('profile')
  const [twoFA, setTwoFA] = useState(true)
  const [biometric, setBiometric] = useState(false)
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifSMS, setNotifSMS] = useState(true)
  const [notifPush, setNotifPush] = useState(true)

  const tabs = [
    { value: 'profile', label: 'Profile Information', icon: <User size={14} /> },
    { value: 'security', label: 'Security & Access', icon: <Shield size={14} /> },
    { value: 'notifications', label: 'Notifications', icon: <Bell size={14} /> },
  ]

  return (
    <AppLayout title="Account Settings" subtitle="Configure your profile, security preferences, and system alerts">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb Bar */}
        <BreadcrumbBar
          items={[
            { label: 'Overview', to: '/app/dashboard' },
            { label: 'Settings' }
          ]}
          backTo="/app/dashboard"
          backLabel="Overview"
        />

        <Tabs tabs={tabs} active={tab} onChange={setTab} />

        {tab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
              <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-teal-800 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {user?.initials || 'AB'}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-lg">{user?.name || 'Alex Morgan'}</p>
                  <p className="text-xs text-slate-500">{user?.email || 'alex.morgan@example.com'}</p>
                  <Badge variant="success" dot className="mt-2 bg-emerald-50 text-emerald-700 border-emerald-200">
                    Verified Resident
                  </Badge>
                </div>
                <Button variant="secondary" size="sm" className="ml-auto font-semibold text-xs border-slate-200">
                  Update Avatar
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Full Name" defaultValue={user?.name || 'Alex Morgan'} />
                  <Input label="Email Address" type="email" defaultValue={user?.email || 'alex.morgan@example.com'} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Phone Number" type="tel" defaultValue={user?.phone || '+968 9123 4567'} />
                  <Input label="National ID / Civil Number" defaultValue={user?.nationalId || '78291039482'} disabled hint="Civil ID updates require customer verification" />
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold">
                  Save Changes
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {tab === 'security' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
              <SettingRow icon={<Lock size={18} className="text-amber-600" />} iconBg="bg-amber-50" label="Change Passcode" desc="Last updated 3 months ago">
                <Button variant="secondary" size="sm" className="font-semibold text-xs">Update</Button>
              </SettingRow>

              <SettingRow icon={<Smartphone size={18} className="text-teal-600" />} iconBg="bg-teal-50" label="Two-Factor Authentication (2FA)" desc="SMS OTP required for all outbound payments">
                <button onClick={() => setTwoFA(v => !v)} className="cursor-pointer p-1">
                  {twoFA ? <ToggleRight size={28} className="text-teal-600" /> : <ToggleLeft size={28} className="text-slate-300" />}
                </button>
              </SettingRow>

              <SettingRow icon={<Shield size={18} className="text-emerald-600" />} iconBg="bg-emerald-50" label="Biometric Authentication" desc="Fingerprint and Face ID support for app access">
                <button onClick={() => setBiometric(v => !v)} className="cursor-pointer p-1">
                  {biometric ? <ToggleRight size={28} className="text-teal-600" /> : <ToggleLeft size={28} className="text-slate-300" />}
                </button>
              </SettingRow>

              <SettingRow icon={<Globe size={18} className="text-slate-600" />} iconBg="bg-slate-100" label="Active Authorized Sessions" desc="Currently active on 2 recognized devices in Muscat">
                <Button variant="secondary" size="sm" className="font-semibold text-xs">Manage Devices</Button>
              </SettingRow>

              <SettingRow icon={<AlertTriangle size={18} className="text-red-500" />} iconBg="bg-red-50" label="Close Account" desc="Permanently remove your profile and archive statements">
                <Button variant="danger" size="sm" className="font-semibold text-xs">Close</Button>
              </SettingRow>
            </Card>
          </motion.div>
        )}

        {tab === 'notifications' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
              <SettingRow icon={<Bell size={18} className="text-teal-600" />} iconBg="bg-teal-50" label="Email Notifications" desc="Monthly account statements and transaction receipts">
                <button onClick={() => setNotifEmail(v => !v)} className="cursor-pointer p-1">
                  {notifEmail ? <ToggleRight size={28} className="text-teal-600" /> : <ToggleLeft size={28} className="text-slate-300" />}
                </button>
              </SettingRow>

              <SettingRow icon={<Smartphone size={18} className="text-teal-600" />} iconBg="bg-teal-50" label="SMS Transaction Alerts" desc="Instant SMS notification for debits over £10">
                <button onClick={() => setNotifSMS(v => !v)} className="cursor-pointer p-1">
                  {notifSMS ? <ToggleRight size={28} className="text-teal-600" /> : <ToggleLeft size={28} className="text-slate-300" />}
                </button>
              </SettingRow>

              <SettingRow icon={<Bell size={18} className="text-amber-600" />} iconBg="bg-amber-50" label="Push Alerts" desc="In-app status updates for open banking connections">
                <button onClick={() => setNotifPush(v => !v)} className="cursor-pointer p-1">
                  {notifPush ? <ToggleRight size={28} className="text-teal-600" /> : <ToggleLeft size={28} className="text-slate-300" />}
                </button>
              </SettingRow>
            </Card>
          </motion.div>
        )}
      </div>
    </AppLayout>
  )
}

// ═══════════════════════════════════════════════════════════
// NOTIFICATIONS PAGE
// ═══════════════════════════════════════════════════════════
export function NotificationsPage() {
  const { notifications, markNotificationRead, markAllRead } = useApp()
  const unread = notifications.filter(n => !n.read && !n.is_read)

  const iconMap = {
    transaction: <Zap size={15} className="text-emerald-600" />,
    security: <Shield size={15} className="text-red-500" />,
    kyc: <CheckCircle2 size={15} className="text-teal-600" />,
    promo: <Bell size={15} className="text-amber-600" />,
  }
  const bgMap = {
    transaction: 'bg-emerald-50 border-emerald-100',
    security: 'bg-red-50 border-red-100',
    kyc: 'bg-teal-50 border-teal-100',
    promo: 'bg-amber-50 border-amber-100',
  }

  return (
    <AppLayout title="System Notifications" subtitle={`${unread.length} unread updates`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb Bar */}
        <BreadcrumbBar
          items={[
            { label: 'Overview', to: '/app/dashboard' },
            { label: 'Notifications' }
          ]}
          backTo="/app/dashboard"
          backLabel="Overview"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activity Feed</p>
          <Button variant="ghost" size="sm" icon={<CheckCircle2 size={14} />} onClick={markAllRead} className="text-teal-700 font-semibold text-xs">
            Mark all as read
          </Button>
        </div>

        {notifications.length === 0 ? (
          <Card className="p-12 text-center bg-white border border-slate-200/80 rounded-2xl shadow-sm">
            <BellOff size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-bold text-sm">No notification messages</p>
            <p className="text-slate-400 text-xs mt-1">You are all caught up on your account activity.</p>
          </Card>
        ) : (
          notifications.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card
                hover
                onClick={() => markNotificationRead(n.id)}
                className={cn(
                  'p-4 cursor-pointer transition-all duration-200 bg-white rounded-2xl border shadow-sm',
                  !n.is_read && !n.read
                    ? 'border-l-4 border-l-teal-600 border-slate-200 bg-teal-50/10'
                    : 'border-slate-200/80 hover:bg-slate-50/50'
                )}
              >
                <div className="flex items-start gap-3.5">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border', bgMap[n.type] || 'bg-slate-50 border-slate-100')}>
                    {iconMap[n.type] || <Bell size={15} className="text-slate-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-bold', (!n.is_read && !n.read) ? 'text-slate-900' : 'text-slate-700')}>{n.title}</p>
                      {(!n.is_read && !n.read) && <span className="w-2.5 h-2.5 bg-teal-600 rounded-full flex-shrink-0 mt-1" />}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.content || n.message}</p>
                    <p className="text-[10px] font-medium text-slate-400 mt-2">{formatRelative(n.createdAt || n.time || new Date())}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </AppLayout>
  )
}

// ═══════════════════════════════════════════════════════════
// HELP PAGE
// ═══════════════════════════════════════════════════════════
export function HelpPage() {
  const faqs = [
    { q: 'How do I link a new bank account?', a: 'Navigate to Connected Accounts → Link New Bank, select your financial institution (Barclays, HSBC, Lloyds, Monzo, etc.), and complete secure authentication.' },
    { q: 'What is the processing speed for domestic GBP transfers?', a: 'Domestic payments routed through UK Faster Payments / BACS settle instantly or within 1 business hour.' },
    { q: 'How are my open banking credentials protected?', a: 'FinConnect pays use Bank-grade 256-bit encryption, strict FCA regulatory compliance, and tokenized OAuth2 connections. We never store raw online banking credentials.' },
    { q: 'How do I complete KYC verification for higher limits?', a: 'Upload a clear scan of your UK Passport or Driving Licence. Verification is processed automatically within 10 minutes.' },
    { q: 'Which foreign currencies are supported for outbound transfers?', a: 'In addition to domestic GBP, transfers to international beneficiaries support USD, EUR, AED, and SAR.' },
  ]
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <AppLayout title="Help & Customer Support" subtitle="Get assistance with your open banking connection or account operations">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb Bar */}
        <BreadcrumbBar
          items={[
            { label: 'Overview', to: '/app/dashboard' },
            { label: 'Help & Support' }
          ]}
          backTo="/app/dashboard"
          backLabel="Overview"
        />
        {/* Contact options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <MessageCircle size={22} className="text-teal-600" />, label: 'Live Chat', desc: 'Average reply time: < 2 min', bg: 'bg-teal-50 border-teal-100', action: 'Start Live Chat' },
            { icon: <Phone size={22} className="text-emerald-600" />, label: 'Customer Support', desc: '+44 800 123 4567 (Toll-Free)', bg: 'bg-emerald-50 border-emerald-100', action: 'Call Support' },
            { icon: <FileText size={22} className="text-emerald-600" />, label: 'Submit Ticket', desc: 'Response within 24 hours', bg: 'bg-emerald-50 border-emerald-100', action: 'Open Ticket' },
          ].map(c => (
            <motion.div key={c.label} whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
              <Card hover className="p-5 text-center cursor-pointer h-full bg-white border border-slate-200/80 shadow-sm rounded-2xl">
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 border', c.bg)}>
                  {c.icon}
                </div>
                <p className="text-sm font-bold text-slate-900">{c.label}</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">{c.desc}</p>
                <Button variant="secondary" size="sm" className="w-full font-semibold text-xs border-slate-200">{c.action}</Button>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <Card className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Frequently Asked Questions</h3>
            <p className="text-xs text-slate-500">Quick answers to common questions about FinConnect open banking</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-slate-200/80 rounded-xl overflow-hidden bg-slate-50/50">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-100/50 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-800 pr-4">{faq.q}</span>
                  <ChevronRight size={16} className={cn('text-slate-400 transition-transform duration-200 flex-shrink-0', openFaq === i && 'rotate-90')} />
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-white border-t border-slate-100"
                  >
                    <p className="p-4 text-xs text-slate-600 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Compliance Notice */}
        <div className="flex items-start gap-3.5 p-4 bg-slate-900 text-white rounded-2xl shadow-sm">
          <ShieldCheck size={20} className="text-teal-300 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-teal-200">Open Banking Regulatory Compliance</p>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              FinConnect operates in full accordance with UK Open Banking and FCA data security standards and guidelines.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

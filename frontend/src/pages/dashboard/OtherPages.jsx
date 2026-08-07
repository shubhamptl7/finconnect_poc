import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard, Lock, Eye, EyeOff, Plus, ToggleLeft, ToggleRight,
  Bell, Shield, User, Smartphone, Globe, ChevronRight, Download,
  HelpCircle, MessageCircle, Phone, FileText, CheckCircle2,
  BellOff, Zap, AlertTriangle
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, Button, Badge, Input, Modal, Tabs } from '@/components/ui'
import { useApp } from '@/store/AppContext'
import { notifications as allNotifications } from '@/store/mockData'
import { formatRelative, cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════
// CARDS PAGE
// ═══════════════════════════════════════════════════════════
function VirtualCard({ frozen }) {
  const [showNumber, setShowNumber] = useState(false)
  return (
    <div
      className={cn(
        'bank-card relative transition-all duration-300',
        frozen && 'opacity-60 grayscale'
      )}
    >
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-1">PayOman Virtual</p>
          <Badge variant={frozen ? 'neutral' : 'success'} className="text-[10px]">
            {frozen ? '❄ Frozen' : '● Active'}
          </Badge>
        </div>
        <div className="w-10 h-7 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-md shadow-sm" />
      </div>
      <div className="flex items-center gap-3 mb-5">
        <p className="text-white font-mono text-base tracking-[0.15em]">
          {showNumber ? '4532 1234 5678 9012' : '•••• •••• •••• 9012'}
        </p>
        <button
          onClick={() => setShowNumber(v => !v)}
          className="text-white/50 hover:text-white transition-colors cursor-pointer"
          aria-label={showNumber ? 'Hide card number' : 'Show card number'}
        >
          {showNumber ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Card Holder</p>
          <p className="text-white text-sm font-semibold">AHMED AL-BALUSHI</p>
        </div>
        <div className="text-right">
          <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Expires</p>
          <p className="text-white text-sm font-mono">12/28</p>
        </div>
      </div>
    </div>
  )
}

export function CardsPage() {
  const [frozen, setFrozen] = useState(false)
  const [limitOpen, setLimitOpen] = useState(false)
  const controls = [
    { label: 'Online Payments', desc: 'Allow e-commerce and digital transactions', enabled: true },
    { label: 'ATM Withdrawals', desc: 'Allow cash withdrawals at ATMs', enabled: true },
    { label: 'International Use', desc: 'Allow transactions outside Oman', enabled: false },
    { label: 'Contactless', desc: 'Allow tap-to-pay transactions', enabled: true },
  ]
  const [toggles, setToggles] = useState(controls.map(c => c.enabled))

  return (
    <AppLayout title="Cards" subtitle="Manage your virtual and physical cards">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Card visual */}
        <VirtualCard frozen={frozen} />

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant={frozen ? 'danger' : 'secondary'}
            icon={frozen ? <Zap size={15} /> : <Lock size={15} />}
            onClick={() => setFrozen(v => !v)}
            className="w-full"
          >
            {frozen ? 'Unfreeze' : 'Freeze'}
          </Button>
          <Button variant="secondary" icon={<Eye size={15} />} className="w-full">
            View CVV
          </Button>
          <Button variant="secondary" icon={<Download size={15} />} className="w-full">
            Statement
          </Button>
        </div>

        {/* Card limits */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Spending Limits</h3>
            <Button variant="ghost" size="sm" onClick={() => setLimitOpen(true)}>Edit</Button>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Daily Limit', used: 450, max: 1000 },
              { label: 'Monthly Limit', used: 3200, max: 10000 },
            ].map(l => (
              <div key={l.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-600 font-medium">{l.label}</span>
                  <span className="text-slate-500 tabular-nums">OMR {l.used} / {l.max}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', l.used / l.max > 0.8 ? 'bg-red-400' : 'bg-brand-500')}
                    style={{ width: `${(l.used / l.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Card controls */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Card Controls</h3>
          <div className="space-y-3">
            {controls.map((ctrl, i) => (
              <div key={ctrl.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-800">{ctrl.label}</p>
                  <p className="text-xs text-slate-400">{ctrl.desc}</p>
                </div>
                <button
                  onClick={() => setToggles(prev => prev.map((v, j) => j === i ? !v : v))}
                  className="cursor-pointer transition-colors"
                  aria-label={toggles[i] ? `Disable ${ctrl.label}` : `Enable ${ctrl.label}`}
                >
                  {toggles[i]
                    ? <ToggleRight size={26} className="text-brand-600" />
                    : <ToggleLeft size={26} className="text-slate-300" />
                  }
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Request physical card */}
        <Card className="p-5 border-dashed border-2 border-slate-200 bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center">
              <CreditCard size={20} className="text-slate-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700">Request Physical Card</p>
              <p className="text-xs text-slate-400">Delivered to your address within 5–7 business days</p>
            </div>
            <Button variant="secondary" size="sm">Request</Button>
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
    <div className="flex items-center gap-4 py-4 border-b border-slate-50 last:border-0">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', iconBg || 'bg-slate-100 text-slate-500')}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
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
    { value: 'profile', label: 'Profile', icon: <User size={14} /> },
    { value: 'security', label: 'Security', icon: <Shield size={14} /> },
    { value: 'notifications', label: 'Notifications', icon: <Bell size={14} /> },
  ]

  return (
    <AppLayout title="Settings" subtitle="Manage your account preferences">
      <div className="max-w-5xl mx-auto space-y-5">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />

        {tab === 'profile' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center text-white text-2xl font-bold shadow-glow-blue">
                  {user.initials}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{user.name}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                  <Badge variant="success" dot className="mt-1.5">KYC Verified</Badge>
                </div>
                <Button variant="secondary" size="sm" className="ml-auto">Edit Photo</Button>
              </div>
              <div className="space-y-3">
                <Input label="Full name" defaultValue={user.name} />
                <Input label="Email address" type="email" defaultValue={user.email} />
                <Input label="Phone number" type="tel" defaultValue={user.phone} />
                <Input label="National ID" defaultValue={user.nationalId} disabled hint="Contact support to update your National ID" />
              </div>
              <div className="flex justify-end mt-5">
                <Button>Save Changes</Button>
              </div>
            </Card>
          </motion.div>
        )}

        {tab === 'security' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-5">
              <SettingRow icon={<Lock size={16} className="text-red-500" />} iconBg="bg-red-50" label="Change Password" desc="Last changed 3 months ago">
                <Button variant="secondary" size="sm">Update</Button>
              </SettingRow>
              <SettingRow icon={<Smartphone size={16} className="text-brand-600" />} iconBg="bg-brand-50" label="Two-Factor Authentication" desc="SMS OTP enabled">
                <button onClick={() => setTwoFA(v => !v)} className="cursor-pointer">
                  {twoFA ? <ToggleRight size={26} className="text-brand-600" /> : <ToggleLeft size={26} className="text-slate-300" />}
                </button>
              </SettingRow>
              <SettingRow icon={<Shield size={16} className="text-violet-600" />} iconBg="bg-violet-50" label="Biometric Login" desc="Fingerprint / Face ID">
                <button onClick={() => setBiometric(v => !v)} className="cursor-pointer">
                  {biometric ? <ToggleRight size={26} className="text-brand-600" /> : <ToggleLeft size={26} className="text-slate-300" />}
                </button>
              </SettingRow>
              <SettingRow icon={<Globe size={16} className="text-slate-500" />} iconBg="bg-slate-100" label="Active Sessions" desc="2 active devices">
                <Button variant="secondary" size="sm">Manage</Button>
              </SettingRow>
              <SettingRow icon={<AlertTriangle size={16} className="text-red-500" />} iconBg="bg-red-50" label="Deactivate Account" desc="Permanently remove your account">
                <Button variant="danger" size="sm">Deactivate</Button>
              </SettingRow>
            </Card>
          </motion.div>
        )}

        {tab === 'notifications' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-5">
              <SettingRow icon={<Bell size={16} />} label="Email Notifications" desc="Receive alerts via email">
                <button onClick={() => setNotifEmail(v => !v)} className="cursor-pointer">
                  {notifEmail ? <ToggleRight size={26} className="text-brand-600" /> : <ToggleLeft size={26} className="text-slate-300" />}
                </button>
              </SettingRow>
              <SettingRow icon={<Smartphone size={16} />} label="SMS Alerts" desc="Transaction confirmations via SMS">
                <button onClick={() => setNotifSMS(v => !v)} className="cursor-pointer">
                  {notifSMS ? <ToggleRight size={26} className="text-brand-600" /> : <ToggleLeft size={26} className="text-slate-300" />}
                </button>
              </SettingRow>
              <SettingRow icon={<Bell size={16} />} label="Push Notifications" desc="In-app and browser notifications">
                <button onClick={() => setNotifPush(v => !v)} className="cursor-pointer">
                  {notifPush ? <ToggleRight size={26} className="text-brand-600" /> : <ToggleLeft size={26} className="text-slate-300" />}
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
  const unread = notifications.filter(n => !n.read)

  const iconMap = {
    transaction: <Zap size={14} className="text-emerald-600" />,
    security: <Shield size={14} className="text-red-500" />,
    kyc: <CheckCircle2 size={14} className="text-brand-600" />,
    promo: <Bell size={14} className="text-amber-500" />,
  }
  const bgMap = {
    transaction: 'bg-emerald-50',
    security: 'bg-red-50',
    kyc: 'bg-brand-50',
    promo: 'bg-amber-50',
  }

  return (
    <AppLayout title="Notifications" subtitle={`${unread.length} unread`}>
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" icon={<CheckCircle2 size={14} />} onClick={markAllRead}>
            Mark all as read
          </Button>
        </div>
        {notifications.length === 0 ? (
          <Card>
            <div className="py-16 text-center">
              <BellOff size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No notifications yet</p>
            </div>
          </Card>
        ) : (
          notifications.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card
                hover
                onClick={() => markNotificationRead(n.id)}
                className={cn(
                  'p-4 cursor-pointer transition-all duration-200',
                  !n.is_read
                    ? 'border-l-[3px] border-l-brand-500 bg-brand-50/20'
                    : 'hover:bg-slate-50/50'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', bgMap[n.type])}>
                    {iconMap[n.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-semibold', n.is_read ? 'text-slate-700' : 'text-slate-900')}>{n.title}</p>
                      {!n.is_read && <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-1" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{n.content || n.message}</p>
                    <p className="text-xs text-slate-400 mt-1.5">{formatRelative(n.createdAt || n.time)}</p>
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
    { q: 'How do I connect my bank account?', a: 'Go to Accounts → Connect Bank and select your bank from the list. You will be redirected to your bank\'s secure portal.' },
    { q: 'How long do transfers take?', a: 'Domestic transfers within Oman are typically instant or within 1 business day. International SWIFT transfers take 2–5 business days.' },
    { q: 'Is my data secure?', a: 'Yes. PayOman uses 256-bit AES encryption, two-factor authentication, and complies with CBO security regulations.' },
    { q: 'How do I update my KYC documents?', a: 'Go to Settings → Profile and contact support to update your identity documents. This is required by regulatory compliance.' },
    { q: 'What currencies are supported?', a: 'Currently PayOman supports OMR for domestic accounts. International transfers support USD, EUR, GBP, and AED.' },
  ]
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <AppLayout title="Help & Support" subtitle="We're here to help you">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Contact options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <MessageCircle size={20} className="text-brand-600" />, label: 'Live Chat', desc: 'Avg reply: 2 min', bg: 'bg-brand-50', action: 'Start Chat' },
            { icon: <Phone size={20} className="text-emerald-600" />, label: 'Phone Support', desc: '+968 800 12345', bg: 'bg-emerald-50', action: 'Call Now' },
            { icon: <FileText size={20} className="text-amber-600" />, label: 'Submit Ticket', desc: 'Response in 24h', bg: 'bg-amber-50', action: 'Open Ticket' },
          ].map(c => (
            <motion.div key={c.label} whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
              <Card hover className="p-5 text-center cursor-pointer h-full">
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3', c.bg)}>
                  {c.icon}
                </div>
                <p className="text-sm font-semibold text-slate-900">{c.label}</p>
                <p className="text-xs text-slate-400 mt-0.5 mb-3">{c.desc}</p>
                <Button variant="secondary" size="sm" className="w-full">{c.action}</Button>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <Card className="p-5">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-slate-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-semibold text-slate-800">{faq.q}</span>
                  <ChevronRight size={15} className={cn('text-slate-400 transition-transform flex-shrink-0', openFaq === i && 'rotate-90')} />
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 pb-4 text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* CBO Notice */}
        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <Shield size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-500 leading-relaxed">
            PayOman is licensed and regulated by the <strong>Central Bank of Oman (CBO)</strong>. 
            For regulatory complaints, contact the CBO directly at <span className="text-brand-600">cbo.gov.om</span>
          </p>
        </div>
      </div>
    </AppLayout>
  )
}

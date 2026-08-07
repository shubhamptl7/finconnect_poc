import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield, Zap, Globe, BarChart3, Lock, CheckCircle2,
  ArrowRight, ChevronRight, Star, Landmark, CreditCard,
  ArrowLeftRight, Bell
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

const fadeUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } }

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Scroll-aware navbar background
  if (typeof window !== 'undefined') {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    if (!scrolled) window.addEventListener('scroll', handleScroll, { passive: true })
  }

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled
        ? 'bg-white/95 backdrop-blur-xl shadow-[0_1px_0_rgba(11,18,32,0.08)]'
        : 'bg-white/80 backdrop-blur-xl border-b border-slate-100'
    )}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-[0_2px_8px_rgba(27,85,226,0.30)]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 2h5a3 3 0 0 1 0 6H3V2Z" fill="white" fillOpacity="0.9"/>
              <path d="M3 8v4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <span className="font-bold text-slate-900 text-[15px] tracking-[-0.01em]" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>
              Pay<span className="text-brand-600">Oman</span>
            </span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'How It Works', 'Security', 'About'].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">{item}</a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link to="/auth/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link to="/auth/register">
            <Button size="sm" iconRight={<ArrowRight size={14} />}>Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="pt-32 pb-24 px-6 relative overflow-hidden connection-arc-bg" style={{ background: 'linear-gradient(180deg, #F4F7FF 0%, #FFFFFF 40%, #FFFFFF 100%)' }}>
      {/* Subtle arc decoration — the connection motif */}
      <svg className="absolute top-24 right-0 opacity-[0.06] pointer-events-none hidden xl:block" width="600" height="500" viewBox="0 0 600 500" fill="none">
        <circle cx="500" cy="100" r="120" stroke="#1B55E2" strokeWidth="1"/>
        <circle cx="300" cy="300" r="80" stroke="#1B55E2" strokeWidth="0.8"/>
        <circle cx="150" cy="180" r="50" stroke="#1B55E2" strokeWidth="0.6"/>
        <line x1="500" y1="100" x2="300" y2="300" stroke="#1B55E2" strokeWidth="0.5" strokeDasharray="4 4"/>
        <line x1="300" y1="300" x2="150" y2="180" stroke="#1B55E2" strokeWidth="0.5" strokeDasharray="4 4"/>
        <circle cx="500" cy="100" r="4" fill="#1B55E2" fillOpacity="0.4"/>
        <circle cx="300" cy="300" r="4" fill="#1B55E2" fillOpacity="0.4"/>
        <circle cx="150" cy="180" r="4" fill="#1B55E2" fillOpacity="0.4"/>
      </svg>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <motion.div {...fadeUp}>
          <div className="inline-flex items-center gap-2 bg-white border border-brand-100 rounded-full px-4 py-1.5 text-xs font-semibold text-brand-700 mb-6 shadow-e1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-slow" />
            Built on CBO Open Banking Framework
          </div>
          <h1 className="font-bold text-slate-900 leading-[1.08] mb-6 heading-display"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 3.75rem)', letterSpacing: '-0.03em' }}>
            Your finances,
            <br />
            <span className="gradient-text">beautifully unified.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            PayOman connects your existing Omani bank accounts in one secure hub. View all your balances,
            initiate payments, and understand your spending — your banks stay in control, you gain full visibility.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth/register">
              <Button size="lg" iconRight={<ArrowRight size={17} />}>
                Get Started Free
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button variant="secondary" size="lg">
                Sign in to PayOman
              </Button>
            </Link>
          </div>
          <p className="text-xs text-slate-400 mt-4">No credit card required · Join the early access programme</p>
        </motion.div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-16 relative"
        >
          <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_48px_rgba(11,18,32,0.10),0_2px_8px_rgba(11,18,32,0.06)] p-6 max-w-3xl mx-auto">
            {/* Mock dashboard stats */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                { label: 'Total Balance', value: 'OMR 20,190.750', color: 'text-slate-900', sub: '+4.2% this month', accent: 'border-l-brand-600' },
                { label: 'Monthly Income', value: 'OMR 920.000', color: 'text-emerald-600', sub: '+8.2% vs last month', accent: 'border-l-emerald-500' },
                { label: 'Monthly Spend', value: 'OMR 543.750', color: 'text-slate-700', sub: '-3.1% vs last month', accent: 'border-l-red-400' },
              ].map(c => (
                <div key={c.label} className={cn('bg-slate-50 rounded-2xl p-4 border-l-4', c.accent)}>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{c.label}</p>
                  <p className={cn('text-base font-bold tabular-nums', c.color)} style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>{c.value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{c.sub}</p>
                </div>
              ))}
            </div>
            {/* Mock chart */}
            <div className="rounded-2xl h-28 flex items-end p-4 gap-1.5 overflow-hidden" style={{ background: 'linear-gradient(135deg, #F8FAFB 0%, #EEF4FF 100%)' }}>
              {[40, 65, 45, 80, 60, 90, 75, 85, 55, 70, 95, 80].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-md transition-all"
                  style={{ height: `${h}%`, background: i === 11 ? '#1B55E2' : i > 8 ? '#93B4FF' : '#DCE9FF', opacity: i === 11 ? 1 : 0.6 + i * 0.025 }} />
              ))}
            </div>
          </div>
          {/* Floating badges */}
          <div className="absolute -left-6 top-12 bg-white rounded-2xl shadow-e3 border border-slate-100 px-4 py-3 hidden md:flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center"><CheckCircle2 size={16} className="text-emerald-600" /></div>
            <div><p className="text-xs font-bold text-slate-900">Payment Initiated</p><p className="text-xs text-slate-400">OMR 450.000 sent</p></div>
          </div>
          <div className="absolute -right-6 bottom-12 bg-white rounded-2xl shadow-e3 border border-slate-100 px-4 py-3 hidden md:flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center"><Shield size={16} className="text-brand-600" /></div>
            <div><p className="text-xs font-bold text-slate-900">CBO Compliant</p><p className="text-xs text-slate-400">Open Banking API</p></div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Features() {
  const features = [
    { icon: <Landmark size={22} className="text-brand-600" />, bg: 'bg-brand-50', title: 'Account Aggregation', desc: 'Connect Bank Muscat, NBO, Ahli Bank, and more. See all your balances, accounts, and positions in one unified view.' },
    { icon: <ArrowLeftRight size={22} className="text-emerald-600" />, bg: 'bg-emerald-50', title: 'Payment Initiation', desc: 'Initiate payments to any Omani bank account directly through your connected accounts — without leaving the app.' },
    { icon: <BarChart3 size={22} className="text-violet-600" />, bg: 'bg-violet-50', title: 'Spending Insights', desc: 'Understand exactly where your money goes with automatic categorisation and clear financial summaries.' },
    { icon: <Shield size={22} className="text-red-500" />, bg: 'bg-red-50', title: 'Bank-grade Security', desc: 'We never store your banking credentials. Tokenised, encrypted connections — your bank stays in control.' },
    { icon: <Zap size={22} className="text-amber-600" />, bg: 'bg-amber-50', title: 'Consent Management', desc: 'You decide exactly what PayOman can access. Grant, review, and revoke permissions at any time.' },
    { icon: <Bell size={22} className="text-cyan-600" />, bg: 'bg-cyan-50', title: 'Real-time Alerts', desc: 'Get notified the moment transactions happen across any of your connected bank accounts.' },
  ]
  return (
    <section id="features" className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-14">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Platform Capabilities</span>
          <h2 className="text-3xl font-bold text-slate-900 mt-3 mb-4">One platform. All your banks.</h2>
          <p className="text-slate-500 max-w-xl mx-auto">PayOman is not a bank — it's your financial operating system. Your money stays with your banks. You get complete visibility and control.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }}>
              <div className="p-6 rounded-2xl border border-slate-100 hover:border-brand-100 hover:shadow-card-hover transition-all duration-200 cursor-default h-full">
                <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center mb-4', f.bg)}>{f.icon}</div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: <Landmark size={24} className="text-brand-600" />,
      bg: 'bg-brand-50',
      title: 'Connect Your Bank',
      desc: 'Securely link your existing Omani bank accounts — Bank Muscat, NBO, Ahli Bank, and more. Your credentials go directly to your bank. Never to us.',
      note: 'Supported: 7 Omani banks',
    },
    {
      number: '02',
      icon: <CheckCircle2 size={24} className="text-emerald-600" />,
      bg: 'bg-emerald-50',
      title: 'You Grant Consent',
      desc: 'You decide exactly what PayOman is allowed to see and do. Permissions are transparent, time-limited, and revocable by you at any time.',
      note: 'You stay in full control',
    },
    {
      number: '03',
      icon: <BarChart3 size={24} className="text-violet-600" />,
      bg: 'bg-violet-50',
      title: 'Manage Everything',
      desc: 'View all your balances in one dashboard, initiate payments through your banks, track transactions, and get financial insights — all in one place.',
      note: 'Your banks. Your money. Your control.',
    },
  ]
  return (
    <section id="how-it-works" className="py-20 px-6 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-14">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">How It Works</span>
          <h2 className="text-3xl font-bold text-slate-900 mt-3 mb-4">Open Banking, made simple</h2>
          <p className="text-slate-500 max-w-xl mx-auto">PayOman connects to your banks on your behalf. Your money stays where it is — your banks hold it, PayOman helps you see and manage it.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div key={step.number} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }}>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 h-full flex flex-col hover:shadow-card-hover hover:border-brand-100 transition-all duration-200">
                <div className="flex items-start justify-between mb-5">
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', step.bg)}>
                    {step.icon}
                  </div>
                  <span className="text-3xl font-bold text-slate-100 tabular-nums select-none">{step.number}</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed flex-1">{step.desc}</p>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-brand-600">{step.note}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.35 }} className="text-center mt-10">
          <Link to="/auth/register">
            <Button iconRight={<ArrowRight size={15} />}>Join the Early Access Programme</Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

function Trust() {
  const banks = ['Bank Muscat', 'NBO', 'Ahli Bank', 'OAB', 'Bank Dhofar', 'HSBC Oman', 'Sohar Int.']
  return (
    <section id="security" className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto text-center">
        <motion.div {...fadeUp}>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Security & Trust</span>
          <h2 className="text-3xl font-bold text-slate-900 mt-3 mb-4">Your banks stay in control</h2>
          <p className="text-slate-500 max-w-xl mx-auto mb-12">PayOman never holds your money and never stores your banking credentials. We connect to your banks on your behalf — securely, transparently, and only with your explicit consent.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {[
            { icon: <Lock size={24} className="text-brand-600" />, title: '256-bit AES Encryption', desc: 'All data in transit and at rest is encrypted to banking standards.' },
            { icon: <Shield size={24} className="text-emerald-600" />, title: 'CBO Open Banking Framework', desc: 'Built in alignment with the Central Bank of Oman Open Banking regulatory framework.' },
            { icon: <CheckCircle2 size={24} className="text-violet-600" />, title: 'Zero Credential Storage', desc: 'We use tokenisation. Your bank login is never visible or stored by PayOman.' },
          ].map((s, i) => (
            <motion.div key={s.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }}
              className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mx-auto mb-4">{s.icon}</div>
              <h3 className="font-semibold text-slate-900 mb-2">{s.title}</h3>
              <p className="text-sm text-slate-500">{s.desc}</p>
            </motion.div>
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">Connected Banks</p>
          <div className="flex flex-wrap justify-center gap-3">
            {banks.map(b => (
              <div key={b} className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-medium text-slate-600">{b}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-brand-700 to-brand-900 rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white, transparent 60%)' }} />
          <motion.div {...fadeUp} className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-4">Be among the first to experience Open Banking in Oman</h2>
            <p className="text-blue-100/80 mb-8">Connect your banks, take control of your finances, and manage everything from one secure platform — built for Oman.</p>
            <Link to="/auth/register">
              <Button size="lg"
                className="bg-white text-brand-700 hover:bg-brand-50 shadow-e3 border border-white/20"
                iconRight={<ArrowRight size={16} />}>
                Join Early Access
              </Button>
            </Link>
            <p className="text-blue-200/50 text-xs mt-4">No credit card required · Free to join</p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">P</span>
              </div>
              <span className="text-white font-bold">PayOman</span>
            </div>
            <p className="text-sm leading-relaxed">Oman's Open Banking Platform. Your banks. Your money. Your control.</p>
          </div>
          {[
            { title: 'Platform', links: ['How It Works', 'Features', 'Security', 'Open Banking'] },
            { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
            { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'CBO Framework'] },
          ].map(col => (
            <div key={col.title}>
              <p className="text-white text-sm font-semibold mb-3">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map(l => <li key={l}><a href="#" className="text-sm hover:text-white transition-colors cursor-pointer">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs">© 2026 PayOman. Built in alignment with CBO Open Banking Standards.</p>
          <p className="text-xs">Built with ❤ in Muscat, Oman</p>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Trust />
      <CTA />
      <Footer />
    </div>
  )
}

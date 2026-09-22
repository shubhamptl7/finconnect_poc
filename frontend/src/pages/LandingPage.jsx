import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield, Zap, Globe, BarChart3, Lock, CheckCircle2,
  ArrowRight, ChevronRight, Star, Landmark, CreditCard,
  ArrowLeftRight, Bell, ShieldCheck, ArrowUpRight, Check
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useApp } from '@/store/AppContext'
import CalculatorsDropdown from '@/components/layout/CalculatorsDropdown'

const fadeUp = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { isAuthenticated, user } = useApp()

  if (typeof window !== 'undefined') {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    if (!scrolled) window.addEventListener('scroll', handleScroll, { passive: true })
  }

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-200',
      scrolled
        ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm'
        : 'bg-[#F4F7FB]/90 backdrop-blur-md border-b border-slate-200/60'
    )}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-brand-600/20 ring-1 ring-white/30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <span className="font-extrabold text-slate-900 text-base tracking-tight" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>
              Fin<span className="text-brand-600">Connect</span>
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <a href="#features" className="hover:text-slate-900 transition-colors">Platform Capabilities</a>
          <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
          <a href="#security" className="hover:text-slate-900 transition-colors">Security Standards</a>
          <CalculatorsDropdown isScrolled={scrolled} />
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link to={user?.role === 'admin' ? '/admin/dashboard' : '/app/dashboard'}>
              <Button size="sm" iconRight={<ArrowRight size={14} />} className="shadow-sm">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/auth/login">
                <Button variant="ghost" size="sm" className="font-semibold text-slate-700">Sign in</Button>
              </Link>
              <Link to="/auth/register">
                <Button size="sm" iconRight={<ArrowRight size={14} />} className="shadow-sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

function Hero() {
  const { isAuthenticated, user } = useApp()

  return (
    <section className="pt-32 pb-20 px-6 relative overflow-hidden bg-gradient-to-b from-[#F4F7FB] via-[#F4F7FB] to-white border-b border-slate-200/60">
      <div className="max-w-6xl mx-auto text-center relative z-10">
        <motion.div {...fadeUp}>
          <div className="inline-flex items-center gap-2 bg-white border border-brand-200/80 rounded-full px-4 py-1.5 text-xs font-bold text-brand-700 mb-6 shadow-sm">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Regulated Open Banking & Faster Payments API
          </div>

          <h1 className="font-extrabold text-slate-900 leading-[1.08] mb-6 tracking-tight"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>
            Unified Banking Intelligence.
            <br />
            <span className="bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-600 bg-clip-text text-transparent">
              All your bank accounts in one place.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Securely link Barclays, HSBC, Lloyds, Monzo, and more. View balances, initiate transfers, and analyze cash flow in a single calm workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link to={user?.role === 'admin' ? '/admin/dashboard' : '/app/dashboard'}>
                <Button size="lg" iconRight={<ArrowRight size={16} />} className="w-full sm:w-auto shadow-md">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth/register">
                  <Button size="lg" iconRight={<ArrowRight size={16} />} className="w-full sm:w-auto shadow-md">
                    Create Free Account
                  </Button>
                </Link>
                <Link to="/auth/login">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    Sign In to Dashboard
                  </Button>
                </Link>
              </>
            )}
          </div>
          <p className="text-xs text-slate-400 font-medium mt-4">Zero credential storage · Read-only tokenized connection</p>
        </motion.div>

        {/* Dashboard Preview Component */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-14 max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_12px_40px_rgba(15,23,42,0.06)] p-6 sm:p-8 text-left space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs font-mono text-slate-400 ml-2">finconnect.co.uk/app/dashboard</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
                ● Live API Connection
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-200/70 border-l-4 border-l-brand-600">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aggregate Balance</p>
                <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">£14,850.25</p>
                <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">3 Banks Connected</p>
              </div>
              <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-200/70 border-l-4 border-l-emerald-500">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Income</p>
                <p className="text-xl font-extrabold text-emerald-600 font-mono mt-1">£1,420.00</p>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">+6.4% this month</p>
              </div>
              <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-200/70 border-l-4 border-l-amber-500">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Loans</p>
                <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">£4,500.00</p>
                <p className="text-[10px] font-semibold text-amber-600 mt-0.5">Next EMI: 15th Sep</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Features() {
  const list = [
    { icon: <Landmark size={22} className="text-brand-600" />, bg: 'bg-brand-50', title: 'Multi-Bank Aggregation', desc: 'Consolidate Barclays, HSBC, Lloyds, NatWest, and Monzo accounts in a single real-time position dashboard.' },
    { icon: <ArrowLeftRight size={22} className="text-emerald-600" />, bg: 'bg-emerald-50', title: 'Direct Payment Initiation', desc: 'Initiate domestic transfers across your accounts securely using tokenized payment instructions with full authorization.' },
    { icon: <BarChart3 size={22} className="text-emerald-600" />, bg: 'bg-emerald-50', title: 'Automated Cash Flow Analytics', desc: 'Categorize spending, monitor income streams, and track debt commitments automatically without manual input.' },
    { icon: <ShieldCheck size={22} className="text-emerald-600" />, bg: 'bg-emerald-50', title: 'Open Banking Compliance', desc: 'Built in strict alignment with the UK Open Banking & FCA regulatory framework and security standards.' },
    { icon: <Lock size={22} className="text-amber-600" />, bg: 'bg-amber-50', title: 'End-to-End Encryption', desc: 'Sensitive data is protected with 256-bit E2EE key pairs. Bank login credentials are never accessed or stored.' },
    { icon: <Zap size={22} className="text-purple-600" />, bg: 'bg-purple-50', title: 'Consent & Revocation Control', desc: 'Manage bank authorization permissions transparently. Revoke, update, or extend data sharing consent at any moment.' },
  ]

  return (
    <section id="features" className="py-20 px-6 bg-white border-b border-slate-200/60">
      <div className="max-w-6xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-14">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Platform Features</span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-2 mb-3">Enterprise Financial Control</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-sm">FinConnect provides a unified operating portal for your bank accounts while your funds remain safely inside your regulated banks.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((f, i) => (
            <motion.div key={f.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.06 }}>
              <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200/80 p-6 h-full hover:border-brand-300 hover:shadow-md transition-all duration-200">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', f.bg)}>{f.icon}</div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
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
    { num: '01', title: 'Select Bank', desc: 'Choose your bank from our supported institution directory (Barclays, HSBC, Lloyds, Monzo, etc.).' },
    { num: '02', title: 'Authorize Consent', desc: 'Authenticate directly with your bank portal. You explicitly choose which account data to grant access.' },
    { num: '03', title: 'Unified Dashboard', desc: 'Instantly view balances, track transaction history, calculate loan EMIs, and initiate payments.' },
  ]

  return (
    <section id="how-it-works" className="py-20 px-6 bg-[#F4F7FB] border-b border-slate-200/60">
      <div className="max-w-5xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-14">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">3-Step Process</span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-2 mb-3">Simple & Secure Setup</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-sm">Connect your accounts in under 2 minutes with no physical paperwork.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div key={s.num} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }}>
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 h-full space-y-3">
                <span className="text-2xl font-black text-brand-600 font-mono">{s.num}</span>
                <h3 className="text-base font-bold text-slate-900">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">F</div>
              <span className="text-white font-bold">FinConnect</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">Enterprise Open Banking platform interface.</p>
          </div>
          <div>
            <p className="text-white text-xs font-bold uppercase tracking-wider mb-3">Platform</p>
            <ul className="space-y-2 text-xs">
              <li><Link to="/app/dashboard" className="hover:text-white">Dashboard</Link></li>
              <li><Link to="/app/banks" className="hover:text-white">Connected Banks</Link></li>
              <li><Link to="/calculators/emi" className="hover:text-white">EMI Calculator</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white text-xs font-bold uppercase tracking-wider mb-3">Security</p>
            <ul className="space-y-2 text-xs">
              <li><a href="#security" className="hover:text-white">Open Banking Framework</a></li>
              <li><a href="#security" className="hover:text-white">Encryption</a></li>
            </ul>
          </div>
          <div>
            <p className="text-white text-xs font-bold uppercase tracking-wider mb-3">Account</p>
            <ul className="space-y-2 text-xs">
              <li><Link to="/auth/login" className="hover:text-white">Sign In</Link></li>
              <li><Link to="/auth/register" className="hover:text-white">Register</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© 2026 FinConnect. Built in alignment with Open Banking Standards.</p>
          <p>London, United Kingdom</p>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Footer />
    </div>
  )
}

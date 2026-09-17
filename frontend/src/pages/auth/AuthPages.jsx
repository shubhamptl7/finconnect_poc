import { useState, useEffect } from 'react'
import { Link, useNavigate, Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, ShieldCheck, CheckCircle2, Building2, Landmark, Check } from 'lucide-react'
import { useApp } from '@/store/AppContext'
import { Input, Button, Divider } from '@/components/ui'
import { cn } from '@/lib/utils'

// Auth Shell
export function AuthShell({ children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-[#F4F7FB] font-sans">
      {/* Left Branding Panel (5 cols) */}
      <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-10 flex-col justify-between relative overflow-hidden text-white border-r border-slate-800">
        {/* Subtle Ambient Arc Accent */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>
                Fin<span className="text-brand-400">Connect</span>
              </span>
              <p className="text-[9px] text-brand-300 font-extrabold uppercase tracking-widest -mt-0.5">Open Banking Platform</p>
            </div>
          </Link>

          <div className="space-y-3 pt-6">
            <span className="px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-bold uppercase tracking-wider border border-brand-400/20">
              Open Banking Regulated Framework
            </span>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>
              Your financial life,<br />
              <span className="text-brand-400">securely connected.</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              Link your bank accounts, monitor transactions, and initiate transfers with full consent and 256-bit encryption.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            {[
              'Barclays, HSBC, Lloyds & Monzo connectivity',
              'Regulated Open Banking security standards',
              'End-to-End E2EE transaction protection',
              'Zero bank login credential storage'
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-200">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <Check size={10} strokeWidth={3} />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-slate-800 flex items-center gap-3 text-[11px] text-slate-400">
          <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0" />
          <span>UK Open Banking Security Compliant</span>
        </div>
      </div>

      {/* Right Form Card Panel (7 cols) */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 p-8 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          {children}
        </div>
      </div>
    </div>
  )
}

// Login Page
export function LoginPage() {
  const { login } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [location] = useState(window.location.search)

  useEffect(() => {
    if (location.includes('kyc_success=true')) {
      setErrors({ success: 'Your identity has been verified! You can now log in.' })
    }
  }, [location])

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email address is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)

    try {
      const response = await login({ email: form.email, password: form.password })
      if (response?.data?.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/app/dashboard')
      }
    } catch (error) {
      if (error.code === 'USER_UNVERIFIED') {
        navigate('/auth/verify-kyc', { state: { userId: error.userId } })
      } else if (error.code === 'EMAIL_UNVERIFIED') {
        setErrors({ general: 'Please verify your email address before logging in. Check your inbox for the verification link.' })
      } else {
        setErrors({ general: error.message })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>Welcome back</h1>
        <p className="text-xs text-slate-500 mt-1">Sign in to your FinConnect Open Banking portal</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.success && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-600" />
            {errors.success}
          </div>
        )}
        {errors.general && (
          <div className="p-3 bg-rose-50 text-rose-800 text-xs font-semibold rounded-xl border border-rose-200">
            {errors.general}
          </div>
        )}

        <Input
          label="Email Address"
          type="email"
          placeholder="name@domain.om"
          icon={<Mail size={15} />}
          value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          error={errors.email}
          required
          autoComplete="email"
        />

        <Input
          label="Password"
          type={showPw ? 'text' : 'password'}
          placeholder="Enter your password"
          icon={<Lock size={15} />}
          iconRight={
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="cursor-pointer hover:text-slate-600 transition-colors"
              aria-label="Toggle password visibility"
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
          value={form.password}
          onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
          error={errors.password}
          required
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
            <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 text-brand-600 cursor-pointer" />
            <span>Remember me</span>
          </label>
          <Link to="/auth/forgot-password" className="text-brand-600 hover:text-brand-800 font-bold transition-colors">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full mt-2 shadow-sm" loading={loading} iconRight={!loading && <ArrowRight size={15} />}>
          {loading ? 'Authenticating…' : 'Sign in to FinConnect'}
        </Button>
      </form>

      <p className="text-center text-xs text-slate-500 mt-6 pt-4 border-t border-slate-100">
        Don't have an account?{' '}
        <Link to="/auth/register" className="text-brand-600 hover:text-brand-800 font-bold transition-colors">
          Create account
        </Link>
      </p>
    </AuthShell>
  )
}

// Register Page
export function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', dateOfBirth: '',
    password: '', confirmPassword: ''
  })
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})
  const { register } = useApp()
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  const validate = () => {
    const e = {}
    if (step === 0) {
      if (!form.name) e.name = 'Full name is required'
      if (!form.email) e.email = 'Email address is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    }
    if (step === 1) {
      if (!form.password) e.password = 'Password is required'
      else if (form.password.length < 8) e.password = 'Must be at least 8 characters'
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    }
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    if (step === 0) { setStep(1); return }

    setLoading(true)
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
      }
      if (form.phone) payload.phone = form.phone
      if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth

      await register(payload)
      setRegistered(true)
    } catch (error) {
      setErrors({ general: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>Create Account</h1>
        <p className="text-xs text-slate-500 mt-1">Step {step + 1} of 2 — {step === 0 ? 'Personal Info' : 'Security Setup'}</p>
        <div className="flex gap-1.5 mt-3">
          {[0, 1].map(i => (
            <div key={i} className={cn('h-1 rounded-full flex-1 transition-all', i <= step ? 'bg-brand-600' : 'bg-slate-200')} />
          ))}
        </div>
      </div>

      {registered ? (
        <div className="text-center space-y-4 py-4">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Check Your Inbox</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            We sent a verification link to <strong className="text-slate-700">{form.email}</strong>. Please verify your email to log in.
          </p>
          <Link to="/auth/login" className="block pt-2">
            <Button variant="secondary" className="w-full">Back to Sign In</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="p-3 bg-rose-50 text-rose-800 text-xs font-semibold rounded-xl border border-rose-200">
              {errors.general}
            </div>
          )}

          {step === 0 ? (
            <>
              <Input label="Full Name" placeholder="Ahmed Al-Balushi" icon={<User size={15} />} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} error={errors.name} required />
              <Input label="Email Address" type="email" placeholder="name@domain.om" icon={<Mail size={15} />} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} error={errors.email} required />
              <Input label="Phone Number (Optional)" type="tel" placeholder="+968 9123 4567" icon={<Phone size={15} />} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </>
          ) : (
            <>
              <Input
                label="Password"
                type={showPw ? 'text' : 'password'}
                placeholder="At least 8 characters"
                icon={<Lock size={15} />}
                iconRight={
                  <button type="button" onClick={() => setShowPw(v => !v)} className="cursor-pointer hover:text-slate-600 transition-colors">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                error={errors.password}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat password"
                icon={<Lock size={15} />}
                value={form.confirmPassword}
                onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                error={errors.confirmPassword}
                required
              />
            </>
          )}

          <div className="flex gap-2 pt-2">
            {step === 1 && (
              <Button type="button" variant="secondary" onClick={() => setStep(0)} className="w-1/3">
                Back
              </Button>
            )}
            <Button type="submit" className="flex-1 shadow-sm" loading={loading} iconRight={!loading && <ArrowRight size={15} />}>
              {loading ? 'Processing…' : step === 0 ? 'Continue' : 'Complete Registration'}
            </Button>
          </div>
        </form>
      )}

      {!registered && (
        <p className="text-center text-xs text-slate-500 mt-6 pt-4 border-t border-slate-100">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-brand-600 hover:text-brand-800 font-bold transition-colors">Sign in</Link>
        </p>
      )}
    </AuthShell>
  )
}

// Forgot Password Page
export function ForgotPasswordPage() {
  const { API_URL, addToast } = useApp()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      })
      const data = await response.json()
      if (response.ok) {
        setSent(true)
      } else {
        setError(data.message || 'Failed to send reset link')
        addToast?.({ type: 'danger', message: data.message || 'Failed to send reset link' })
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
      addToast?.({ type: 'danger', message: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      {sent ? (
        <div className="text-center space-y-4 py-4">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Check Your Email</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            If an account exists with email <strong className="text-slate-700">{email}</strong>, a password reset link has been sent.
          </p>
          <Link to="/auth/login" className="block pt-2">
            <Button variant="secondary" className="w-full">Back to Sign In</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>Reset Password</h1>
            <p className="text-xs text-slate-500 mt-1">Enter your registered email address to receive reset instructions</p>
          </div>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email Address" type="email" placeholder="name@example.com" icon={<Mail size={15} />} value={email} onChange={e => setEmail(e.target.value)} required />
            <Button type="submit" loading={loading} className="w-full shadow-sm" iconRight={!loading && <ArrowRight size={15} />}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6 pt-4 border-t border-slate-100">
            <Link to="/auth/login" className="text-brand-600 hover:text-brand-800 font-bold transition-colors">
              ← Back to Sign In
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  )
}

// KYC Verification Page
export function KycVerifyPage() {
  const location = useLocation()
  const { user, API_URL } = useApp()
  const userId = location.state?.userId || user?.id
  const [loading, setLoading] = useState(false)

  if (!userId) {
    return <Navigate to="/auth/login" replace />
  }

  const handleStartVerification = async () => {
    setLoading(true)
    let templateId = 'itmpl_AoVizgpBK4mgFaiH7dRjQykpb2BfoV'
    let environment = 'sandbox'

    try {
      const res = await fetch(`${API_URL}/kyc/config`, { credentials: 'include' })
      const json = await res.json()
      if (json?.data?.templateId) {
        templateId = json.data.templateId
      }
      if (json?.data?.environment) {
        environment = json.data.environment
      }
    } catch (err) {
      console.warn('Failed to fetch KYC config from backend, using fallback template:', err)
    }

    const redirectUri = encodeURIComponent(window.location.origin + '/auth/login?kyc_success=true')
    window.location.href = `https://withpersona.com/verify?template-id=${templateId}&environment=${environment}&reference-id=${userId}&redirect-uri=${redirectUri}`
  }

  return (
    <AuthShell>
      <div className="text-center space-y-4 py-4">
        <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto text-brand-600">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>Identity Verification</h1>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Required under Open Banking and KYC regulatory guidelines before accessing banking services.
        </p>

        <Button
          className="w-full mt-4 shadow-sm"
          disabled={loading}
          onClick={handleStartVerification}
        >
          {loading ? 'Initializing Verification...' : 'Begin Persona Verification'}
        </Button>
      </div>
    </AuthShell>
  )
}

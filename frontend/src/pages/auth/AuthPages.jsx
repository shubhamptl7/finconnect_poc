import { useState, useEffect } from 'react'
import { Link, useNavigate, Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { useApp } from '@/store/AppContext'
import { Input, Button, Divider } from '@/components/ui'
import { cn, sleep } from '@/lib/utils'

// Auth Brand Panel
// Uses our signature connection-arc motif — restrained, not generic
function AuthBrandPanel() {
  const features = [
    'Connect all your Omani bank accounts',
    'Bank-grade 256-bit encryption',
    'Real-time transaction monitoring',
    'Initiate payments through your banks',
  ]

  const connectedBanks = [
    { code: 'BM', name: 'Bank Muscat', color: '#1e3a8a' },
    { code: 'NBO', name: 'National Bank of Oman', color: '#065f46' },
    { code: 'AB', name: 'Ahli Bank', color: '#7c3aed' },
    { code: 'OAB', name: 'Oman Arab Bank', color: '#d97706' },
  ]

  return (
    <div
      className="relative h-full flex flex-col justify-between p-10 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0B1220 0%, #111B2E 45%, #1B2E50 100%)' }}
    >
      {/* Connection arc — the signature motif */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1B55E2" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1B55E2" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {/* Outer rings */}
        <circle cx="420" cy="120" r="160" stroke="url(#arcGrad)" strokeWidth="0.8" fill="none" />
        <circle cx="420" cy="120" r="110" stroke="url(#arcGrad)" strokeWidth="0.5" fill="none" />
        {/* Connection nodes */}
        <circle cx="300" cy="340" r="80" stroke="url(#arcGrad)" strokeWidth="0.6" fill="none" />
        {/* Arc lines representing bank connections */}
        <line x1="420" y1="120" x2="300" y2="340" stroke="#1B55E2" strokeWidth="0.5" strokeDasharray="6 4" strokeOpacity="0.2" />
        <line x1="420" y1="120" x2="150" y2="260" stroke="#1B55E2" strokeWidth="0.5" strokeDasharray="6 4" strokeOpacity="0.15" />
        <line x1="420" y1="120" x2="380" y2="420" stroke="#1B55E2" strokeWidth="0.5" strokeDasharray="6 4" strokeOpacity="0.12" />
        {/* Nodes */}
        <circle cx="420" cy="120" r="3" fill="#1B55E2" fillOpacity="0.3" />
        <circle cx="300" cy="340" r="2.5" fill="#1B55E2" fillOpacity="0.2" />
        <circle cx="150" cy="260" r="2" fill="#1B55E2" fillOpacity="0.2" />
        <circle cx="380" cy="420" r="2" fill="#1B55E2" fillOpacity="0.2" />
      </svg>

      {/* Logo */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center" style={{ boxShadow: '0 2px 12px rgba(27,85,226,0.35)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 2h5a3 3 0 0 1 0 6H3V2Z" fill="white" fillOpacity="0.9" />
              <path d="M3 8v4" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <span className="text-white font-bold text-base tracking-[-0.01em]" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>
              Pay<span style={{ color: '#93B4FF' }}>Oman</span>
            </span>
            <div className="text-blue-300/50 text-[9px] font-semibold uppercase tracking-[0.18em] mt-0.5">Open Banking Platform</div>
          </div>
        </div>

        <h2 className="font-bold text-white mb-3 leading-tight" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui', fontSize: '28px', letterSpacing: '-0.02em' }}>
          Your money,<br />
          <span style={{ color: '#93B4FF' }}>unified.</span>
        </h2>
        <p className="text-blue-100/60 text-sm leading-relaxed max-w-xs">
          Connect your existing Omani bank accounts. Monitor, initiate payments, and manage your finances with full transparency and consent.
        </p>
      </div>

      {/* Connected banks preview */}
      <div className="relative z-10 my-6">
        <p className="text-blue-200/40 text-[10px] font-semibold uppercase tracking-[0.18em] mb-3">7 Omani Banks Supported</p>
        <div className="flex flex-col gap-2">
          {connectedBanks.map(bank => (
            <div key={bank.code}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                style={{ background: bank.color }}>
                {bank.code.slice(0, 2)}
              </div>
              <span className="text-blue-100/70 text-sm">{bank.name}</span>
              <div className="ml-auto flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-emerald-400/80 text-[10px] font-medium">Connected</span>
              </div>
            </div>
          ))}
          <div className="text-center py-1">
            <span className="text-blue-200/30 text-[11px]">+ 3 more banks available</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="relative z-10 space-y-2">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <CheckCircle2 size={13} className="text-emerald-400/80 flex-shrink-0" />
            <span className="text-blue-100/60 text-sm">{f}</span>
          </div>
        ))}
        <div className="pt-4 flex items-center gap-2">
          <ShieldCheck size={12} className="text-emerald-500/60" />
          <p className="text-blue-200/30 text-[11px]">Built on CBO Open Banking Standards</p>
        </div>
      </div>
    </div>
  )
}

// Auth Shell
export function AuthShell({ children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[480px_1fr] bg-white">
      <div className="hidden lg:block">
        <AuthBrandPanel />
      </div>
      <div className="flex flex-col min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-700 to-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-slate-900">Pay<span className="text-brand-600">Oman</span></span>
          </div>
        </div>
        {/* Top accent */}
        <div className="h-0.5 bg-gradient-to-r from-brand-800 via-brand-500 to-blue-400 hidden lg:block" />
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm"
          >
            {children}
          </motion.div>
        </div>
        <footer className="p-6 text-center text-xs text-slate-400 border-t border-slate-100">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span className="text-emerald-600 font-medium">SSL Encrypted</span>
            <span className="mx-2">·</span>
            <span>Built on CBO Open Banking Standards</span>
          </div>
          <span>© 2026 PayOman. All rights reserved.</span>
        </footer>
      </div>
    </div>
  )
}

// Login
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
    if (!form.email) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
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
        navigate('/auth/verify-kyc', { state: { userId: error.userId } }) // Pass userId to KYC page
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1.5">Welcome back</h1>
        <p className="text-sm text-slate-500">Sign in to your PayOman account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.success && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 size={16} />
            {errors.success}
          </div>
        )}
        {errors.general && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {errors.general}
          </div>
        )}
        <Input
          label="Email address"
          type="email"
          placeholder="name@example.com"
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

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand-600 cursor-pointer" />
            <span className="text-sm text-slate-600">Remember me</span>
          </label>
          <Link to="/auth/forgot-password" className="text-sm text-brand-600 hover:text-brand-800 font-medium transition-colors">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={loading} iconRight={!loading && <ArrowRight size={16} />}>
          {loading ? 'Signing in…' : 'Sign in to PayOman'}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Don't have an account?{' '}
        <Link to="/auth/register" className="text-brand-600 hover:text-brand-800 font-semibold transition-colors">
          Create account
        </Link>
      </p>
    </AuthShell>
  )
}

// Register
const getPasswordStrength = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw)) score++;
  if (/[^a-zA-Z\d]/.test(pw)) score++;
  return score;
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', dateOfBirth: '',
    password: '', confirmPassword: '', agreed: false,
  })
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})
  const { register } = useApp()
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const pwScore = getPasswordStrength(form.password)

  const validate = () => {
    const e = {}
    if (step === 0) {
      if (!form.name) e.name = 'Required'
      if (!form.email) e.email = 'Required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
      
      if (form.phone) {
        if (!/^\+?[0-9\s()-]+$/.test(form.phone)) {
          e.phone = 'Invalid phone number format'
        } else if (form.phone.length < 8 || form.phone.length > 15) {
          e.phone = 'Must be 8-15 characters'
        }
      }
    }
    if (step === 1) {
      if (!form.password) e.password = 'Required'
      else if (form.password.length < 8 || form.password.length > 16) e.password = 'Must be 8-16 characters'
      else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])/.test(form.password)) e.password = 'Must contain uppercase, lowercase, number, and special character'
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    }
    return e
  }

  const next = async (e) => {
    e.preventDefault()
    setErrors({})
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    if (step < 1) { setStep(s => s + 1); return }

    setLoading(true)
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
      };
      if (form.phone) payload.phone = form.phone;
      if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;

      const response = await register(payload);
      setRegistered(true);
    } catch (error) {
      setErrors({ general: error.message })
    } finally {
      setLoading(false)
    }
  }

  const field = (key) => ({
    value: form[key],
    onChange: e => {
      let val = e.target.value
      if (key === 'phone') {
        val = val.replace(/[^\d\s+()-]/g, '')
      }
      setForm(p => ({ ...p, [key]: val }))
    },
    error: errors[key],
  })

  return (
    <AuthShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1.5">Create account</h1>
        <p className="text-sm text-slate-500">Step {step + 1} of 2 — {step === 0 ? 'Personal details' : 'Set your password'}</p>
        <div className="flex gap-1.5 mt-4">
          {[0, 1].map(i => (
            <div key={i} className={cn(
              'h-1 rounded-full flex-1 transition-all duration-300',
              i <= step ? 'bg-brand-600' : 'bg-slate-200'
            )} />
          ))}
        </div>
      </div>

      {registered ? (
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your inbox</h2>
          <p className="text-sm text-slate-500 mb-6">We've sent a verification link to <strong className="text-slate-700">{form.email}</strong>. Please verify your email to continue.</p>
          <Link to="/auth/login">
            <Button variant="secondary" className="w-full">Go to sign in</Button>
          </Link>
        </div>
      ) : (
      <div className="w-full">
      <form onSubmit={next} className="space-y-4">
        {errors.general && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {errors.general}
          </div>
        )}
        {step === 0 ? (
          <>
            <Input label="Full name" placeholder="Ahmed Al-Balushi" icon={<User size={15} />} required {...field('name')} />
            <Input label="Email address" type="email" placeholder="name@example.com" icon={<Mail size={15} />} required {...field('email')} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Phone number (Optional)" type="tel" placeholder="+968 9123 4567" icon={<Phone size={15} />} {...field('phone')} />
              <Input label="Date of birth (Optional)" type="date" {...field('dateOfBirth')} />
            </div>
          </>
        ) : (
          <>
            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              placeholder="8 to 16 characters"
              icon={<Lock size={15} />}
              iconRight={
                <button type="button" onClick={() => setShowPw(v => !v)} className="cursor-pointer hover:text-slate-600 transition-colors" aria-label="Toggle password">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
              required
              {...field('password')}
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="Repeat password"
              icon={<Lock size={15} />}
              required
              {...field('confirmPassword')}
            />

            {/* Password strength */}
            {form.password && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      pwScore >= n ? (pwScore === 1 ? 'bg-red-400' : pwScore === 2 ? 'bg-amber-400' : 'bg-emerald-400') : 'bg-slate-200'
                    )} />
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  {form.password.length < 8 ? 'Too short' :
                    pwScore === 1 ? 'Weak — add mixed case, numbers, and symbols' :
                      pwScore === 2 ? 'Good — add symbols for a strong password' :
                        'Strong'}
                </p>
              </div>
            )}

            {/* <label className={cn('flex items-start gap-3 cursor-pointer', errors.agreed && 'text-red-600')}>
              <input
                type="checkbox"
                checked={form.agreed}
                onChange={e => setForm(p => ({ ...p, agreed: e.target.checked }))}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-600 cursor-pointer"
              />
              <span className="text-sm text-slate-600">
                I agree to the{' '}
                <a href="#" className="text-brand-600 hover:underline font-medium">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-brand-600 hover:underline font-medium">Privacy Policy</a>
              </span>
            </label>
            {errors.agreed && <p className="text-xs text-red-500">{errors.agreed}</p>} */}
          </>
        )}

        <div className="flex gap-3 pt-1">
          {step > 0 && (
            <Button type="button" variant="secondary" onClick={() => setStep(s => s - 1)} className="flex-none px-4">
              Back
            </Button>
          )}
          <Button type="submit" loading={loading} iconRight={!loading && <ArrowRight size={16} />} className="flex-1">
            {loading ? 'Creating account…' : step === 0 ? 'Continue' : 'Create account'}
          </Button>
        </div>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-brand-600 hover:text-brand-800 font-semibold transition-colors">Sign in</Link>
      </p>
      </div>
      )}
    </AuthShell>
  )
}

// Forgot Password
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const { API_URL } = useApp()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setErrorMsg('')
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Failed to process request')
      }
      setSent(true)
    } catch(err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      {sent ? (
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Check your inbox</h1>
          <p className="text-sm text-slate-500 mb-6">We've sent a reset link to <strong className="text-slate-700">{email}</strong></p>
          <Link to="/auth/login">
            <Button variant="secondary" className="w-full">Back to sign in</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1.5">Reset password</h1>
            <p className="text-sm text-slate-500">Enter your email and we'll send you a reset link.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                {errorMsg}
              </div>
            )}
            <Input
              label="Email address"
              type="email"
              placeholder="name@example.com"
              icon={<Mail size={15} />}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Button type="submit" loading={loading} className="w-full" iconRight={!loading && <ArrowRight size={16} />}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            <Link to="/auth/login" className="text-brand-600 hover:text-brand-800 font-semibold transition-colors">
              ← Back to sign in
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  )
}

// KYC Verification
export function KycVerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useApp()

  const userId = location.state?.userId || user?.id

  if (!userId) {
    return <Navigate to="/auth/login" replace />
  }

  return (
    <AuthShell>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <ShieldCheck size={16} className="text-amber-600" />
          </div>
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Identity Verification</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1.5">Verify your identity</h1>
        <p className="text-sm text-slate-500 mb-6">Required by Oman's Central Bank regulations.</p>
      </div>

      <div className="min-h-[400px] w-full border rounded-xl overflow-hidden bg-white p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
          <ShieldCheck size={32} className="text-brand-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Ready to verify</h2>
        <p className="text-slate-500 mb-8 max-w-sm">
          You will be redirected to Persona's secure verification portal to complete your KYC process.
        </p>
        <Button
          className="w-full max-w-sm"
          onClick={() => {
            const redirectUri = encodeURIComponent(window.location.origin + '/auth/login?kyc_success=true');
            window.location.href = `https://withpersona.com/verify?template-id=itmpl_A7sz8n9q43th7pXtzPLoefiH7XXqW5&environment=sandbox&reference-id=${userId}&redirect-uri=${redirectUri}`;
          }}
        >
          Begin Verification
        </Button>
      </div>
    </AuthShell>
  )
}

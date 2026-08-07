import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeftRight, CheckCircle2, Clock, Shield, Zap, Users } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, Button, Input, Badge, Stepper } from '@/components/ui'
import { formatCurrency, cn } from '@/lib/utils'
import { useApp } from '@/store/AppContext'
import { usePlaidLink } from 'react-plaid-link'
import { Link, useSearchParams } from 'react-router-dom'

const STEPS = ['Details', 'Review', 'Complete']

function BeneficiaryPill({ ben, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left cursor-pointer transition-all duration-150 w-full',
        selected ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'
      )}
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {ben.initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{ben.name}</p>
        <p className="text-xs text-slate-400">{ben.bankName}</p>
      </div>
      {ben.isFavorite && <span className="text-amber-400 text-xs">★</span>}
    </button>
  )
}

export default function PaymentsPage() {
  const { addToast, bankAccounts, beneficiaries, initiatePayment, cancelPayment } = useApp()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(0)
  const [currentPaymentId, setCurrentPaymentId] = useState(null)
  const [identifierType, setIdentifierType] = useState('iban') // 'iban' | 'bacs'
  const [form, setForm] = useState({
    fromAccount: bankAccounts[0]?.id || '',
    toType: 'new',   // Default to new since we don't have saved beneficiaries yet
    beneficiaryId: '',
    recipientName: '',
    recipientIBAN: '',
    recipientBacsAccount: '',
    recipientSortCode: '',
    amount: '',
    note: '',
    scheduled: false,
    scheduleDate: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [linkToken, setLinkToken] = useState(null)

  const fromAccount = bankAccounts.find(a => a.id === form.fromAccount)

  // Plaid Link integration for Payment Authorization
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (public_token, metadata) => {
      setLoading(false)
      setStep(2)
      setCurrentPaymentId(null)
      addToast({ type: 'success', title: 'Transfer Authorized', message: 'Payment successfully authorized by bank.' })
    },
    onExit: (err, metadata) => {
      setLoading(false)
      setLinkToken(null)
      if (currentPaymentId) {
        cancelPayment(currentPaymentId)
        setCurrentPaymentId(null)
      }
      if (err) addToast({ type: 'error', title: 'Payment Failed', message: err.message })
    }
  });

  // Automatically open Plaid Link once the token is loaded
  useEffect(() => {
    if (ready && linkToken) {
      open();
    }
  }, [ready, open, linkToken]);

  // Auto-fill from beneficiary when navigated from Beneficiaries page
  useEffect(() => {
    const beneficiaryId = searchParams.get('beneficiaryId')
    if (beneficiaryId && beneficiaries.length > 0) {
      const ben = beneficiaries.find(b => b.id === beneficiaryId)
      if (ben) {
        setForm(p => ({
          ...p,
          beneficiaryId: ben.id,
          recipientName: ben.name,
          recipientIBAN: ben.iban || '',
        }))
      }
    }
  }, [searchParams, beneficiaries])

  useEffect(() => {
    if (!form.fromAccount && bankAccounts.length > 0) {
      setForm(p => ({ ...p, fromAccount: bankAccounts[0].id }))
    }
  }, [bankAccounts, form.fromAccount])

  const validate = () => {
    const e = {}
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = 'Enter a valid amount'
    if (fromAccount && (Number(form.amount) > ((fromAccount.available_balance || 0) / 1000)))
      e.amount = 'Insufficient balance'
    // Only validate manual fields if no beneficiary is selected
    if (!form.beneficiaryId) {
      if (!form.recipientName) e.recipientName = 'Required'
      
      if (identifierType === 'iban') {
        if (!form.recipientIBAN) e.recipientIBAN = 'Required'
      } else {
        const b = (form.recipientBacsAccount || '').replace(/\s|-/g, '')
        const s = (form.recipientSortCode || '').replace(/\s|-/g, '')
        if (!b) e.recipientBacsAccount = 'Required'
        else if (!/^\d{8}$/.test(b)) e.recipientBacsAccount = 'Must be 8 digits'
        
        if (!s) e.recipientSortCode = 'Required'
        else if (!/^\d{6}$/.test(s)) e.recipientSortCode = 'Must be 6 digits'
      }
    }
    return e
  }

  const next = (e) => {
    e.preventDefault()
    if (step === 0) {
      if (!form.fromAccount) {
        addToast({ type: 'error', title: 'Action Required', message: 'Please connect a bank account before making a payment.' })
        return
      }
      const errs = validate()
      if (Object.keys(errs).length) { setErrors(errs); return }
      setErrors({})
      setStep(1)
      return
    }
    if (step === 1) {
      handleConfirm()
    }
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const selectedBen = form.beneficiaryId
        ? beneficiaries.find(b => b.id === form.beneficiaryId)
        : null

      const payload = {
        amount: form.amount,
        accountId: form.fromAccount,
        note: form.note,
        ...(selectedBen
          ? { beneficiaryId: selectedBen.id }  // Use saved beneficiary
          : { 
              recipientName: form.recipientName,
              iban: identifierType === 'iban' ? form.recipientIBAN : '',
              bacsAccount: identifierType === 'bacs' ? form.recipientBacsAccount : '',
              sortCode: identifierType === 'bacs' ? form.recipientSortCode : '',
            }) // Manual
      }

      const response = await initiatePayment(payload)
      setCurrentPaymentId(response.paymentId)
      setLinkToken(response.linkToken)
    } catch (err) {
      setLoading(false)
      addToast({ type: 'error', title: 'Payment Failed', message: err.message })
    }
  }

  const reset = () => {
    setStep(0)
    setForm({
      fromAccount: bankAccounts[0]?.id || '',
      toType: 'new',
      beneficiaryId: '',
      recipientName: '',
      recipientIBAN: '',
      recipientBacsAccount: '',
      recipientSortCode: '',
      amount: '',
      note: '',
      scheduled: false,
      scheduleDate: '',
    })
    setIdentifierType('iban')
  }

  const field = (key) => ({
    value: form[key],
    onChange: e => setForm(p => ({ ...p, [key]: e.target.value })),
    error: errors[key],
  })

  const recipientLabel = form.recipientName || '—'

  return (
    <AppLayout title="Payments" subtitle="Send money to anyone, anywhere">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Stepper */}
        <Card className="p-5">
          <Stepper steps={STEPS} currentStep={step} />
        </Card>

        <AnimatePresence mode="wait">
          {/* ── Step 0: Details ─────────────────────────────── */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <form onSubmit={next}>
                <Card className="p-0 overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    
                    {/* Left Column: From & To */}
                    <div className="flex-1 p-6 space-y-6 md:border-r border-slate-100 bg-slate-50/50">
                      {/* From */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">From Account</h3>
                        <div className="grid gap-3">
                          {bankAccounts.length === 0 ? (
                            <p className="text-sm text-slate-500">No connected accounts available.</p>
                          ) : (
                            bankAccounts.map(acc => (
                              <button
                                key={acc.id}
                                type="button"
                                onClick={() => setForm(p => ({ ...p, fromAccount: acc.id }))}
                                className={cn(
                                  'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all text-left bg-white',
                                  form.fromAccount === acc.id ? 'border-brand-500 shadow-[0_0_0_4px_rgba(27,85,226,0.1)]' : 'border-slate-100 hover:border-slate-300 shadow-sm'
                                )}
                              >
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-slate-800 flex-shrink-0">
                                  {acc.connection?.bank_name?.[0] || 'B'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-semibold text-slate-800 truncate">
                                    {acc.connection?.bank_name}
                                  </p>
                                  <p className="text-[11px] text-slate-500">{acc.account_number}</p>
                                </div>
                                <p className="text-[13px] font-bold text-slate-800 tabular-nums">{formatCurrency(acc.available_balance || 0)}</p>
                              </button>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="h-px bg-slate-200" />

                      {/* To */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-slate-700">To Recipient</h3>
                          {form.beneficiaryId && (
                            <button type="button" onClick={() => setForm(p => ({ ...p, beneficiaryId: '', recipientName: '', recipientIBAN: '' }))}
                              className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer">
                              Clear
                            </button>
                          )}
                        </div>

                        {/* Saved Beneficiary Quick Pick */}
                        {beneficiaries.length > 0 && !form.beneficiaryId && (
                          <div className="mb-4">
                            <p className="text-[11px] text-slate-500 mb-2 font-medium uppercase tracking-wide">Saved contacts</p>
                            <div className="flex gap-2 flex-wrap">
                              {beneficiaries.slice(0, 4).map(b => (
                                <button key={b.id} type="button"
                                  onClick={() => setForm(p => ({ ...p, beneficiaryId: b.id, recipientName: b.name, recipientIBAN: b.iban || '' }))}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-brand-500 hover:bg-brand-50 text-left transition-all text-xs cursor-pointer">
                                  <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0',
                                    b.is_internal ? 'bg-brand-600' : 'bg-slate-700')}>
                                    {b.name?.slice(0, 1).toUpperCase()}
                                  </div>
                                  <span className="font-semibold text-slate-800">{b.nickname || b.name.split(' ')[0]}</span>
                                  {b.is_internal && <Zap size={10} className="text-emerald-500 flex-shrink-0" />}
                                </button>
                              ))}
                            </div>
                            <div className="relative my-3">
                              <div className="absolute inset-0 flex items-center"><div className="w-full h-px bg-slate-150" /></div>
                              <div className="relative flex justify-center"><span className="text-[10px] bg-slate-50 px-2 text-slate-400 uppercase tracking-wider">or enter manually</span></div>
                            </div>
                          </div>
                        )}

                        {/* Selected beneficiary pill */}
                        {form.beneficiaryId && (() => {
                          const b = beneficiaries.find(b => b.id === form.beneficiaryId)
                          return b ? (
                            <div className={cn('flex items-center gap-3 p-3 rounded-xl border-2 mb-3',
                              b.is_internal ? 'border-emerald-400 bg-emerald-50' : 'border-brand-400 bg-brand-50')}>
                              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
                                b.is_internal ? 'bg-emerald-600' : 'bg-brand-700')}>
                                {b.name?.slice(0, 1).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900">{b.name}</p>
                                <p className="text-[11px] font-mono text-slate-500 truncate">
                                  {b.iban ? b.iban : b.bacs_account ? `SC: ${b.sort_code} | Acc: ${b.bacs_account}` : ''}
                                </p>
                              </div>
                              {b.is_internal && <Badge variant="success" dot>Instant P2P</Badge>}
                            </div>
                          ) : null
                        })()}

                        {/* Manual input when no beneficiary selected */}
                        {!form.beneficiaryId && (
                          <div className="space-y-4">
                            <Input label="Recipient name" placeholder="Full name" required {...field('recipientName')} />
                            
                            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                              <button 
                                type="button"
                                className={cn('flex-1 py-1.5 text-xs font-medium rounded-md transition-colors', identifierType === 'iban' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
                                onClick={() => setIdentifierType('iban')}
                              >
                                IBAN
                              </button>
                              <button 
                                type="button"
                                className={cn('flex-1 py-1.5 text-xs font-medium rounded-md transition-colors', identifierType === 'bacs' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
                                onClick={() => setIdentifierType('bacs')}
                              >
                                UK Account
                              </button>
                            </div>

                            {identifierType === 'iban' ? (
                              <Input label="IBAN" placeholder="GB12 ABCD 1234 5612 3456 78" required {...field('recipientIBAN')} />
                            ) : (
                              <div className="grid grid-cols-[100px_1fr] gap-3">
                                <Input label="Sort Code" placeholder="12-34-56" required {...field('recipientSortCode')} />
                                <Input label="Account Number" placeholder="12345678" required {...field('recipientBacsAccount')} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Amount & Action */}
                    <div className="flex-1 p-6 flex flex-col justify-between bg-white">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-700 mb-3">Amount & Details</h3>
                          <div className="space-y-4">
                            <div className="space-y-3">
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">OMR</span>
                                <input
                                  type="number" step="0.001" min="0.001" placeholder="0.000"
                                  value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                                  className={cn(
                                    'w-full pl-14 pr-4 py-3 bg-white border rounded-xl text-xl font-bold text-slate-900 tabular-nums focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 shadow-sm transition-all',
                                    errors.amount ? 'border-red-400' : 'border-slate-200'
                                  )}
                                />
                              </div>
                              {errors.amount && <p className="text-[11px] text-red-500">{errors.amount}</p>}
                              <div className="flex gap-2 flex-wrap">
                                {[10, 50, 100, 250, 500].map(n => (
                                  <button key={n} type="button" onClick={() => setForm(p => ({ ...p, amount: String(n) }))}
                                    className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-600 rounded-lg cursor-pointer transition-colors">
                                    +{n}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <Input label="Note (optional)" placeholder="e.g. Rent payment" {...field('note')} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-5">
                        <Button type="submit" className="w-full shadow-lg shadow-brand-500/25" size="lg" iconRight={<ArrowRight size={16} />}>
                          Review Transfer
                        </Button>
                      </div>
                    </div>

                  </div>
                </Card>
              </form>
            </motion.div>
          )}

          {/* ── Step 1: Review ──────────────────────────────── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="p-6 space-y-5">
                <h3 className="text-base font-semibold text-slate-900">Review Transfer</h3>

                {/* Summary */}
                <div className="rounded-2xl p-5 space-y-3" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', border: '1px solid #e2e8f0' }}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">From</span>
                    <div className="text-right">
                      <p className="font-semibold text-slate-800">{fromAccount?.connection?.bank_name}</p>
                      <p className="text-xs text-slate-400">{fromAccount?.account_name} · {fromAccount?.account_number}</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center shadow-sm">
                      <ArrowRight size={13} className="text-brand-600" />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">To</span>
                    <div className="text-right">
                      <p className="font-semibold text-slate-800">{recipientLabel}</p>
                      {form.beneficiaryId ? (() => {
                        const b = beneficiaries.find(b => b.id === form.beneficiaryId)
                        if (b?.iban) return <p className="text-xs text-slate-400 font-mono">{b.iban}</p>
                        if (b?.bacs_account) return <p className="text-xs text-slate-400 font-mono">{b.sort_code} | {b.bacs_account}</p>
                        return null
                      })() : (
                        identifierType === 'iban' 
                          ? <p className="text-xs text-slate-400 font-mono">{form.recipientIBAN}</p>
                          : <p className="text-xs text-slate-400 font-mono">{form.recipientSortCode} | {form.recipientBacsAccount}</p>
                      )}
                    </div>
                  </div>
                  <div className="h-px bg-slate-200 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Amount</span>
                    <span className="text-2xl font-bold text-slate-900 tabular-nums stat-number">OMR {Number(form.amount).toFixed(3)}</span>
                  </div>
                  {form.note && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Note</span>
                      <span className="text-slate-700 font-medium">{form.note}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Fee</span>
                    <span className="text-emerald-600 font-semibold">Free</span>
                  </div>
                </div>

                {/* Security notice */}
                <div className="flex items-start gap-3 p-3.5 bg-blue-50 rounded-xl border border-blue-100">
                  <Shield size={15} className="text-brand-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800">
                    This transfer is protected by 256-bit encryption. Funds typically arrive within minutes for domestic transfers.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(0)} className="flex-none px-5">Back</Button>
                  <Button onClick={next} loading={loading} className="flex-1" size="lg">
                    {loading ? 'Processing…' : 'Confirm & Send'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* ── Step 2: Complete ────────────────────────────── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
              <Card className="p-10 text-center">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  {/* Ripple ring */}
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0.8 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2, repeat: Infinity, repeatDelay: 1.5 }}
                    className="absolute inset-0 rounded-full bg-emerald-200"
                  />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                    className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-glow-green relative z-10"
                  >
                    <CheckCircle2 size={36} className="text-white" strokeWidth={2} />
                  </motion.div>
                </div>
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Transfer Sent!</h3>
                  <p className="text-slate-500 text-sm mb-1">
                    <span className="font-bold text-slate-800">OMR {Number(form.amount).toFixed(3)}</span> sent to {recipientLabel}
                  </p>
                  <div className="inline-flex items-center gap-2 mt-2 mb-8 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Ref</span>
                    <span className="text-xs text-slate-600 font-mono">TXN-{Date.now().toString().slice(-8)}</span>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={reset} className="flex-1">New Transfer</Button>
                    <Link to="/app/transactions" className="flex-1">
                      <Button className="w-full">View Transactions</Button>
                    </Link>
                  </div>
                </motion.div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}

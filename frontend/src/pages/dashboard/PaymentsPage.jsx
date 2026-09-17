import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeftRight, CheckCircle2, Clock, Shield, Zap, Users, Landmark, AlertCircle, ArrowUpRight, Check, ChevronRight } from 'lucide-react'
import { AppLayout, BreadcrumbBar } from '@/components/layout/AppLayout'
import { Card, Button, Input, Badge, Stepper, Select } from '@/components/ui'
import { cn } from '@/lib/utils'
import { formatPence, formatPounds, poundsToPence } from '@/lib/currencyFormatters'
import { useApp } from '@/store/AppContext'
import { usePlaidLink } from 'react-plaid-link'
import { Link, useSearchParams } from 'react-router-dom'

const STEPS = ['Transfer Details', 'Review & Confirm', 'Authorization']

function BeneficiaryPill({ ben, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-2xl border text-left cursor-pointer transition-all duration-150 w-full',
        selected ? 'border-brand-500 bg-brand-50/70 shadow-xs' : 'border-slate-200/80 bg-slate-50/60 hover:border-slate-300'
      )}
    >
      <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0">
        {ben.name?.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-800 truncate">{ben.name}</p>
        <p className="text-[10px] text-slate-400 font-mono truncate">{ben.bank_name || ben.iban?.slice(0, 10) || 'Saved Contact'}</p>
      </div>
      {selected && <CheckCircle2 size={16} className="text-brand-600 flex-shrink-0" />}
    </button>
  )
}

export default function PaymentsPage() {
  const { addToast, bankAccounts, beneficiaries, initiatePayment, cancelPayment } = useApp()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(0)
  const [currentPaymentId, setCurrentPaymentId] = useState(null)
  const [identifierType, setIdentifierType] = useState('iban')
  const [form, setForm] = useState({
    fromAccount: bankAccounts[0]?.id || '',
    toType: 'new',
    beneficiaryId: '',
    recipientName: '',
    recipientIBAN: '',
    recipientBacsAccount: '',
    recipientSortCode: '',
    amount: '',
    note: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [linkToken, setLinkToken] = useState(null)

  const fromAccount = bankAccounts.find(a => a.id === form.fromAccount)

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: () => {
      setLoading(false)
      setStep(2)
      setCurrentPaymentId(null)
      addToast({ type: 'success', title: 'Transfer Authorized', message: 'Payment successfully authorized by bank.' })
    },
    onExit: (err) => {
      setLoading(false)
      setLinkToken(null)
      if (currentPaymentId) {
        cancelPayment(currentPaymentId)
        setCurrentPaymentId(null)
      }
      if (err) addToast({ type: 'error', title: 'Payment Failed', message: err.message })
    }
  })

  useEffect(() => {
    if (ready && linkToken) open()
  }, [ready, open, linkToken])

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
      e.amount = 'Enter a valid payment amount'
    const inputPence = poundsToPence(form.amount)
    const availPence = Number(fromAccount?.available_balance ?? fromAccount?.current_balance ?? 0)
    if (fromAccount && inputPence > availPence)
      e.amount = 'Amount exceeds available balance'
    if (!form.beneficiaryId) {
      if (!form.recipientName) e.recipientName = 'Recipient name required'
      if (identifierType === 'iban' && !form.recipientIBAN) e.recipientIBAN = 'IBAN required'
    }
    return e
  }

  const next = (e) => {
    e.preventDefault()
    if (step === 0) {
      if (!form.fromAccount) {
        addToast({ type: 'error', title: 'Connect Bank', message: 'Please link an account to pay from.' })
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
      const payload = {
        accountId: form.fromAccount,
        account_id: form.fromAccount,
        amount: Number(form.amount),
        note: form.note || undefined,
      }
      if (form.beneficiaryId) {
        payload.beneficiaryId = form.beneficiaryId
        payload.beneficiary_id = form.beneficiaryId
      } else {
        payload.recipientName = form.recipientName
        payload.recipient_name = form.recipientName
        if (identifierType === 'iban') {
          payload.iban = form.recipientIBAN
          payload.recipient_iban = form.recipientIBAN
        } else {
          payload.bacsAccount = form.recipientBacsAccount
          payload.recipient_bacs_account = form.recipientBacsAccount
          payload.sortCode = form.recipientSortCode
          payload.recipient_sort_code = form.recipientSortCode
        }
      }

      const res = await initiatePayment(payload)
      const token = res?.linkToken || res?.link_token
      const pid = res?.paymentId || res?.payment_id

      if (token) {
        setCurrentPaymentId(pid)
        setLinkToken(token)
      } else {
        setLoading(false)
        setStep(2)
        addToast({ type: 'success', title: 'Payment Initiated', message: 'Transfer request submitted to bank.' })
      }
    } catch (err) {
      setLoading(false)
      addToast({ type: 'error', title: 'Initiation Error', message: err.message })
    }
  }

  return (
    <AppLayout title="Initiate Payment" subtitle="Domestic bank transfer via Plaid Open Banking Gateway">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Breadcrumb Bar */}
        <BreadcrumbBar
          items={[
            { label: 'Overview', to: '/app/dashboard' },
            { label: 'Payments' }
          ]}
          backTo="/app/dashboard"
          backLabel="Overview"
        />

        {/* Stepper Header */}
        <Card className="p-6">
          <Stepper steps={STEPS} currentStep={step} />
        </Card>

        {/* 2-Column Split Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Form Wizard (7 cols) */}
          <div className="lg:col-span-7">
            <Card className="p-6 sm:p-8 space-y-6">
              {step === 0 && (
                <form onSubmit={next} className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      Pay From Bank Account *
                    </label>
                    <Select
                      value={form.fromAccount}
                      onChange={e => setForm(p => ({ ...p, fromAccount: e.target.value }))}
                      className="text-xs font-semibold"
                    >
                      {bankAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.connection?.bank_name} ({acc.account_number}) — Balance: {formatPence(acc.available_balance || acc.current_balance)}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Beneficiary Quick Select */}
                  {beneficiaries.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Select Saved Contact or Enter New Details
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {beneficiaries.slice(0, 4).map(ben => (
                          <BeneficiaryPill
                            key={ben.id}
                            ben={ben}
                            selected={form.beneficiaryId === ben.id}
                            onClick={() => {
                              if (form.beneficiaryId === ben.id) {
                                setForm(p => ({ ...p, beneficiaryId: '', recipientName: '', recipientIBAN: '' }))
                              } else {
                                setForm(p => ({ ...p, beneficiaryId: ben.id, recipientName: ben.name, recipientIBAN: ben.iban || '' }))
                              }
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {!form.beneficiaryId && (
                    <div className="space-y-4 pt-2">
                      <Input
                        label="Recipient Name *"
                        placeholder="Ahmed Al-Balushi"
                        value={form.recipientName}
                        onChange={e => setForm(p => ({ ...p, recipientName: e.target.value }))}
                        error={errors.recipientName}
                        required
                      />
                      <Input
                        label="Recipient IBAN *"
                        placeholder="GB29 NWBK 6016 1331 9268 19"
                        value={form.recipientIBAN}
                        onChange={e => setForm(p => ({ ...p, recipientIBAN: e.target.value }))}
                        error={errors.recipientIBAN}
                        required
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Amount (GBP) *"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                      error={errors.amount}
                      required
                    />
                    <Input
                      label="Payment Reference / Note"
                      placeholder="e.g. Rent, Invoice #402"
                      value={form.note}
                      onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                    />
                  </div>

                  <Button type="submit" className="w-full shadow-sm" iconRight={<ArrowRight size={15} />}>
                    Review Transfer Details
                  </Button>
                </form>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
                    <h4 className="font-bold text-slate-900 text-sm">Review Transfer Summary</h4>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500">From Account:</span>
                      <span className="font-bold text-slate-900">{fromAccount?.connection?.bank_name} (****{fromAccount?.account_number})</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500">Recipient Name:</span>
                      <span className="font-bold text-slate-900">{form.recipientName}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500">Destination IBAN:</span>
                      <span className="font-mono font-bold text-slate-900">{form.recipientIBAN || 'Saved Account'}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Transfer Amount:</span>
                      <span className="font-mono font-extrabold text-brand-600 text-sm">{formatPounds(form.amount)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => setStep(0)} disabled={loading}>
                      Back
                    </Button>
                    <Button className="flex-2 shadow-sm" loading={loading} onClick={handleConfirm}>
                      Authorize & Confirm Payment
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="text-center space-y-4 py-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto text-emerald-600">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Transfer Submitted</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Your payment of <strong className="text-slate-800">{formatPounds(form.amount)}</strong> to <strong className="text-slate-800">{form.recipientName}</strong> has been transmitted via Open Banking.
                  </p>
                  <Button className="mt-4" onClick={() => { setStep(0); setForm(p => ({ ...p, amount: '', note: '' })) }}>
                    Make Another Payment
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Right Side Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-5 border-l-4 border-l-brand-600">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">Plaid Payment Regulation</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Domestic Open Banking transfers are routed securely to recipient accounts. Authorization is tokenized by your bank.
              </p>
            </Card>

            {fromAccount && (
              <Card className="p-5 space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Account Limits</p>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Available Balance:</span>
                  <span className="font-mono text-slate-900">{formatPence(fromAccount.available_balance || fromAccount.current_balance)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Daily Transfer Limit:</span>
                  <span className="font-mono text-slate-900">£5,000.00</span>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

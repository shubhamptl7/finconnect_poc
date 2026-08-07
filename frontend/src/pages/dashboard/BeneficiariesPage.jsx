import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, Search, Trash2, Edit3, X, Check,
  ArrowRight, Building2, Shield, Zap,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, Button, Input, Badge, Modal } from '@/components/ui'
import { useApp } from '@/store/AppContext'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

// ─── Avatar helper ─────────────────────────────────────────
function Avatar({ name, size = 'md', internal }) {
  const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-11 h-11 text-sm', lg: 'w-14 h-14 text-base' }
  return (
    <div className={cn(
      'rounded-2xl flex items-center justify-center font-bold flex-shrink-0 relative',
      sizeMap[size],
      internal
        ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-300'
        : 'bg-gradient-to-br from-slate-600 to-slate-800 text-white'
    )}>
      {initials}
      {internal && (
        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
          <Zap size={8} className="text-white" />
        </span>
      )}
    </div>
  )
}

// ─── Add / Edit Modal ─────────────────────────────────────
function BeneficiaryModal({ open, onClose, editBeneficiary, onSave, loading }) {
  const [identifierType, setIdentifierType] = useState('iban') // 'iban' | 'bacs'
  const [form, setForm] = useState({ name: '', nickname: '', iban: '', bacs_account: '', sort_code: '', bank_name: '' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      if (editBeneficiary) {
        const type = editBeneficiary.iban ? 'iban' : 'bacs';
        setIdentifierType(type);
        setForm({
          name: editBeneficiary.name || '',
          nickname: editBeneficiary.nickname || '',
          iban: editBeneficiary.iban || '',
          bacs_account: editBeneficiary.bacs_account || '',
          sort_code: editBeneficiary.sort_code || '',
          bank_name: editBeneficiary.bank_name || ''
        })
      } else {
        setIdentifierType('iban')
        setForm({ name: '', nickname: '', iban: '', bacs_account: '', sort_code: '', bank_name: '' })
      }
      setErrors({})
    }
  }, [open, editBeneficiary])

  const field = (key) => ({
    value: form[key] || '',
    onChange: e => setForm(p => ({ ...p, [key]: e.target.value })),
    error: errors[key],
  })

  function validate() {
    const e = {}
    if (!form.name?.trim()) e.name = 'Full name is required'
    
    if (identifierType === 'iban') {
      if (!form.iban?.trim()) e.iban = 'IBAN is required'
      else if (form.iban.replace(/\s/g, '').length < 10) e.iban = 'IBAN appears too short'
    } else {
      const b = (form.bacs_account || '').replace(/\s|-/g, '')
      const s = (form.sort_code || '').replace(/\s|-/g, '')
      if (!b) e.bacs_account = 'Account Number is required'
      else if (!/^\d{8}$/.test(b)) e.bacs_account = 'Must be exactly 8 digits'
      
      if (!s) e.sort_code = 'Sort Code is required'
      else if (!/^\d{6}$/.test(s)) e.sort_code = 'Must be exactly 6 digits'
    }
    
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    
    // Clear out the unused fields to prevent mixed payloads
    const payload = { ...form }
    if (identifierType === 'iban') {
      payload.bacs_account = ''
      payload.sort_code = ''
    } else {
      payload.iban = ''
    }
    
    await onSave(payload)
  }

  return (
    <Modal open={open} onClose={onClose} title={editBeneficiary ? 'Edit Beneficiary' : 'Add New Beneficiary'}>
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {/* <div className="bg-brand-50 border border-brand-100 rounded-xl p-3 text-xs text-brand-700 leading-relaxed">
          <strong>💡 Instant P2P:</strong> If this account belongs to another PayOman user, transfers to them will be settled <strong>instantly</strong> — no bank processing needed.
        </div> */} 

        <div className="grid grid-cols-2 gap-4">
          <Input label="Full name *" placeholder="Ahmed Al-Balushi" {...field('name')} />
          <Input label="Nickname (optional)" placeholder="e.g. Landlord, Mum" {...field('nickname')} />
        </div>

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
          <Input label="IBAN *" placeholder="GB12 ABCD 1234 5612 3456 78" {...field('iban')} />
        ) : (
          <div className="grid grid-cols-[100px_1fr] gap-3">
            <Input label="Sort Code *" placeholder="12-34-56" {...field('sort_code')} />
            <Input label="Account Number *" placeholder="12345678" {...field('bacs_account')} />
          </div>
        )}

        <Input label="Bank name (optional)" placeholder="e.g. Santander UK" {...field('bank_name')} />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={loading} iconRight={<Check size={15} />}>
            {editBeneficiary ? 'Save Changes' : 'Add Beneficiary'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────
function DeleteModal({ open, onClose, onConfirm, name, loading }) {
  return (
    <Modal open={open} onClose={onClose} title="Remove Beneficiary" size="sm">
      <div className="space-y-4 mt-2">
        <p className="text-sm text-slate-600">
          Are you sure you want to remove <strong>{name}</strong>? You can always add them back.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm} loading={loading}>Remove</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Beneficiary Row Card ─────────────────────────────────
function BeneficiaryCard({ beneficiary, onEdit, onDelete, onPay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} layout>
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <Avatar name={beneficiary.name} internal={beneficiary.is_internal} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-slate-900 truncate">{beneficiary.name}</p>
              {beneficiary.nickname && (
                <span className="text-xs text-slate-400 font-medium">"{beneficiary.nickname}"</span>
              )}
              {beneficiary.is_internal && (
                <Badge variant="success" dot>PayOman P2P</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {beneficiary.iban ? (
                <p className="text-xs font-mono text-slate-500">{beneficiary.iban}</p>
              ) : beneficiary.bacs_account && beneficiary.sort_code ? (
                <p className="text-xs font-mono text-slate-500">
                  <span className="text-slate-400">SC:</span> {beneficiary.sort_code} <span className="mx-1 text-slate-300">|</span> <span className="text-slate-400">Acc:</span> {beneficiary.bacs_account}
                </p>
              ) : null}
              {beneficiary.bank_name && (
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Building2 size={10} /> {beneficiary.bank_name}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="secondary" size="sm" icon={<ArrowRight size={14} />} onClick={() => onPay(beneficiary)}>
              Pay
            </Button>
            <button onClick={() => onEdit(beneficiary)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer" title="Edit">
              <Edit3 size={14} />
            </button>
            <button onClick={() => onDelete(beneficiary)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer" title="Remove">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────
export default function BeneficiariesPage() {
  const { beneficiaries, createBeneficiary, updateBeneficiary, deleteBeneficiary, addToast } = useApp()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return beneficiaries
    return beneficiaries.filter(b =>
      b.name?.toLowerCase().includes(q) ||
      b.nickname?.toLowerCase().includes(q) ||
      b.iban?.toLowerCase().includes(q) ||
      b.bank_name?.toLowerCase().includes(q)
    )
  }, [beneficiaries, search])

  const internalCount = beneficiaries.filter(b => b.is_internal).length

  async function handleSave(formData) {
    setLoading(true)
    try {
      if (editTarget) {
        await updateBeneficiary(editTarget.id, formData)
        addToast({ type: 'success', title: 'Updated', message: `${formData.name} has been updated.` })
        setEditTarget(null)
      } else {
        const created = await createBeneficiary(formData)
        addToast({
          type: 'success',
          title: 'Beneficiary Added',
          message: created.is_internal
            ? `${formData.name} is a PayOman user — P2P transfers will be instant!`
            : `${formData.name} has been added to your contacts.`
        })
        setShowAdd(false)
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setLoading(true)
    try {
      await deleteBeneficiary(deleteTarget.id)
      addToast({ type: 'success', title: 'Removed', message: `${deleteTarget.name} has been removed.` })
      setDeleteTarget(null)
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  function handlePay(beneficiary) {
    navigate(`/app/payments?beneficiaryId=${beneficiary.id}`)
  }

  return (
    <AppLayout title="Beneficiaries" subtitle="Manage your saved payment contacts">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5 border-l-4 border-l-brand-600">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total</p>
            <p className="text-2xl font-bold text-slate-900">{beneficiaries.length}</p>
            <p className="text-xs text-slate-400 mt-1">Saved contacts</p>
          </Card>
          <Card className="p-5 border-l-4 border-l-emerald-500">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">P2P Ready</p>
            <p className="text-2xl font-bold text-emerald-700">{internalCount}</p>
            <p className="text-xs text-slate-400 mt-1">PayOman users</p>
          </Card>
          <Card className="p-5 border-l-4 border-l-slate-300">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">External</p>
            <p className="text-2xl font-bold text-slate-900">{beneficiaries.length - internalCount}</p>
            <p className="text-xs text-slate-400 mt-1">Other banks</p>
          </Card>
        </div>

        {/* Search + Add */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, IBAN or bank…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
          </div>
          <Button icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>
            Add Beneficiary
          </Button>
        </div>

        {/* P2P banner
        {internalCount > 0 && (
          <Card flat className="p-4 bg-emerald-50 border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap size={16} className="text-emerald-600" />
              </div>
              {/* <div>
                <p className="text-sm font-semibold text-emerald-900">Instant P2P Active</p>
                <p className="text-xs text-emerald-700">
                  {internalCount} beneficiar{internalCount === 1 ? 'y is' : 'ies are'} PayOman users. Transfers to them are settled instantly inside our platform — no bank processing required.
                </p>
              </div> */}
            {/* </div> */}
          {/* </Card> */}
       

        {/* List */}
        {filtered.length === 0 ? (
          <Card className="py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-slate-300" />
            </div>
            <p className="text-base font-semibold text-slate-700 mb-1">
              {search ? 'No results found' : 'No beneficiaries yet'}
            </p>
            <p className="text-sm text-slate-400 max-w-xs mx-auto mb-6">
              {search
                ? 'Try a different name, IBAN, or bank name.'
                : 'Add your first beneficiary to quickly send money without typing details each time.'}
            </p>
            {!search && (
              <Button icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>
                Add your first beneficiary
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map(b => (
                <BeneficiaryCard
                  key={b.id}
                  beneficiary={b}
                  onEdit={b => setEditTarget(b)}
                  onDelete={b => setDeleteTarget(b)}
                  onPay={handlePay}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Security note */}
        <Card flat className="p-4">
          <div className="flex items-center gap-3">
            <Shield size={15} className="text-slate-400 flex-shrink-0" />
            <p className="text-xs text-slate-500">
              Beneficiary details are encrypted and only visible to you. You can edit or remove any contact at any time.
            </p>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <BeneficiaryModal open={showAdd} onClose={() => setShowAdd(false)} onSave={handleSave} loading={loading} />
      <BeneficiaryModal open={!!editTarget} onClose={() => setEditTarget(null)} editBeneficiary={editTarget} onSave={handleSave} loading={loading} />
      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} name={deleteTarget?.name} loading={loading} />
    </AppLayout>
  )
}

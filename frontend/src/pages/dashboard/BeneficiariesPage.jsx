import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, Search, Trash2, Edit3, X, Check,
  ArrowRight, Building2, Shield, Zap, Send, Star, ArrowUpRight, ChevronRight
} from 'lucide-react'
import { AppLayout, BreadcrumbBar } from '@/components/layout/AppLayout'
import { Card, Button, Input, Badge, Modal } from '@/components/ui'
import { useApp } from '@/store/AppContext'
import { cn } from '@/lib/utils'
import { useNavigate, Link } from 'react-router-dom'

function Avatar({ name, size = 'md' }) {
  const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-11 h-11 text-sm', lg: 'w-14 h-14 text-base' }
  return (
    <div className={cn(
      'rounded-2xl flex items-center justify-center font-bold flex-shrink-0 relative bg-gradient-to-br from-brand-600 to-emerald-900 text-white shadow-md shadow-brand-600/20',
      sizeMap[size]
    )}>
      {initials}
    </div>
  )
}

function BeneficiaryModal({ open, onClose, editBeneficiary, onSave, loading }) {
  const [identifierType, setIdentifierType] = useState('iban')
  const [form, setForm] = useState({ name: '', nickname: '', iban: '', bacs_account: '', sort_code: '', bank_name: '' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      if (editBeneficiary) {
        const type = editBeneficiary.iban ? 'iban' : 'bacs'
        setIdentifierType(type)
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
      else if (!/^\d{8}$/.test(b)) e.bacs_account = 'Must be 8 digits'
      if (!s) e.sort_code = 'Sort Code is required'
      else if (!/^\d{6}$/.test(s)) e.sort_code = 'Must be 6 digits'
    }
    
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
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
    <Modal open={open} onClose={onClose} title={editBeneficiary ? 'Edit Beneficiary' : 'Add New Beneficiary'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4 mt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name *" placeholder="Ahmed Al-Balushi" {...field('name')} />
          <Input label="Nickname (Optional)" placeholder="e.g. Landlord, Business" {...field('nickname')} />
        </div>

        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          <button 
            type="button"
            className={cn('flex-1 py-1.5 text-xs font-bold rounded-lg transition-all', identifierType === 'iban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900')}
            onClick={() => setIdentifierType('iban')}
          >
            IBAN / International
          </button>
          <button 
            type="button"
            className={cn('flex-1 py-1.5 text-xs font-bold rounded-lg transition-all', identifierType === 'bacs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900')}
            onClick={() => setIdentifierType('bacs')}
          >
            Account / Sort Code
          </button>
        </div>

        {identifierType === 'iban' ? (
          <Input label="IBAN Number *" placeholder="OM68 BMUS 0012 3456 7890 1234" {...field('iban')} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Sort Code *" placeholder="12-34-56" {...field('sort_code')} />
            <Input label="Account Number *" placeholder="12345678" {...field('bacs_account')} />
          </div>
        )}

        <Input label="Bank Name (Optional)" placeholder="e.g. Bank Muscat, NBO" {...field('bank_name')} />

        <div className="flex gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1 shadow-sm" loading={loading} iconRight={<Check size={15} />}>
            {editBeneficiary ? 'Save Changes' : 'Add Beneficiary'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function BeneficiariesPage() {
  const navigate = useNavigate()
  const { beneficiaries, addBeneficiary, updateBeneficiary, deleteBeneficiary, addToast } = useApp()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBen, setEditingBen] = useState(null)
  const [loading, setLoading] = useState(false)

  const filtered = useMemo(() => {
    return beneficiaries.filter(b => {
      const q = search.toLowerCase()
      return (
        b.name?.toLowerCase().includes(q) ||
        b.nickname?.toLowerCase().includes(q) ||
        b.bank_name?.toLowerCase().includes(q) ||
        b.iban?.toLowerCase().includes(q)
      )
    })
  }, [beneficiaries, search])

  async function handleSave(formData) {
    setLoading(true)
    try {
      if (editingBen) {
        await updateBeneficiary(editingBen.id, formData)
        addToast({ type: 'success', title: 'Beneficiary Updated', message: `${formData.name} details saved.` })
      } else {
        await addBeneficiary(formData)
        addToast({ type: 'success', title: 'Beneficiary Added', message: `${formData.name} added to your saved contacts.` })
      }
      setModalOpen(false)
      setEditingBen(null)
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message || 'Failed to save beneficiary' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Remove ${name} from saved beneficiaries?`)) return
    try {
      await deleteBeneficiary(id)
      addToast({ type: 'info', title: 'Beneficiary Removed', message: `${name} deleted.` })
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message })
    }
  }

  return (
    <AppLayout title="Saved Beneficiaries" subtitle="Manage recipient account profiles for fast domestic & Open Banking payments">
      <BeneficiaryModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingBen(null) }}
        editBeneficiary={editingBen}
        onSave={handleSave}
        loading={loading}
      />

      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Navigation Breadcrumb Bar */}
        <BreadcrumbBar
          items={[
            { label: 'Payments', to: '/app/payments' },
            { label: 'Saved Beneficiaries' }
          ]}
          backTo="/app/payments"
          backLabel="Payments"
        />

        {/* Metric Header */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs border-l-4 border-l-brand-600">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Beneficiaries</p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">{beneficiaries.length}</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Saved Contacts</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs border-l-4 border-l-emerald-500">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Accounts</p>
            <p className="text-2xl font-black text-emerald-600 font-mono mt-1">
              {beneficiaries.length}
            </p>
            <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">Verified Banking Formats</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Recipient</p>
              <p className="text-xs font-bold text-slate-800 mt-1">Add Contact Profile</p>
            </div>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => { setEditingBen(null); setModalOpen(true) }}>
              Add Contact
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search beneficiary by name, IBAN, or bank…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
            />
          </div>
          <Button icon={<Plus size={15} />} onClick={() => { setEditingBen(null); setModalOpen(true) }}>
            Add Beneficiary
          </Button>
        </div>

        {/* Beneficiaries Grid */}
        {filtered.length === 0 ? (
          <Card className="p-12 text-center text-slate-400 space-y-3">
            <Users size={32} className="mx-auto text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">No beneficiaries found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">Add a saved beneficiary to initiate fast payments without re-entering account details.</p>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => { setEditingBen(null); setModalOpen(true) }}>
              Add First Beneficiary
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(ben => (
              <motion.div key={ben.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="p-5 hover:border-brand-300 transition-all flex flex-col justify-between h-full space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={ben.name} size="md" />
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{ben.name}</h4>
                        {ben.nickname && <p className="text-[11px] font-semibold text-slate-400">{ben.nickname}</p>}
                      </div>
                    </div>
                    <Badge variant="neutral" size="sm">{ben.bank_name || 'Bank'}</Badge>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs font-mono font-semibold text-slate-700 break-all">
                    {ben.iban || `${ben.sort_code} - ${ben.bacs_account}`}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingBen(ben); setModalOpen(true) }}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Edit Details"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(ben.id, ben.name)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Beneficiary"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <Button
                      size="sm"
                      iconRight={<ArrowUpRight size={14} />}
                      onClick={() => navigate(`/app/payments?beneficiaryId=${ben.id}`)}
                    >
                      Send Payment
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Plus, RefreshCw, CheckCircle2, AlertTriangle,
  Clock, Shield, ChevronRight, Link2, Unlink, MoreHorizontal,
  Landmark, Globe, Info, X, PlugZap, WifiOff, ShieldCheck, Check
} from 'lucide-react'
import { AppLayout, BreadcrumbBar } from '@/components/layout/AppLayout'
import { Card, Button, Badge, Modal, Alert } from '@/components/ui'
import { formatDate, cn } from '@/lib/utils'
import { useApp } from '@/store/AppContext'
import ConnectBankButton from '@/components/ConnectBankButton'

const permissionLabels = {
  balance:      'View account balances',
  transactions: 'Access transaction history',
  payments:     'Initiate domestic payments',
}

const mapConnections = (connections) => connections.map((conn) => ({
  id: conn.id,
  bankName: conn.bank_name,
  bankCode: conn.bank_name.substring(0, 4).toUpperCase(),
  type: 'Personal Banking',
  accountNumber: '****',
  color: '#0f172a',
  lastSync: 'Just now',
  connectionHealth: conn.status === 'active' ? 'good' : 'error',
  permissions: ['balance', 'transactions', 'payments'],
  consentExpiry: '90 days from connection',
  connectedAt: conn.created_at || conn.createdAt || new Date(),
}))

function BankConnectionRow({ bank, onDisconnect }) {
  const [expanded, setExpanded] = useState(false)
  const health = bank.connectionHealth

  const healthConfig = {
    good:      { badge: 'success', label: 'Active Sync', icon: <CheckCircle2 size={13} />, dot: true },
    attention: { badge: 'warning', label: 'Consent Expiry Near', icon: <AlertTriangle size={13} />, dot: false },
    error:     { badge: 'danger',  label: 'Disconnected', icon: <WifiOff size={13} />, dot: false },
  }[health] || { badge: 'neutral', label: 'Unknown', dot: false }

  return (
    <Card className="p-0 overflow-hidden hover:border-brand-200 transition-all">
      <div
        className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50/70 transition-colors"
        onClick={() => setExpanded(v => !v)}
        role="button"
        tabIndex={0}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0 shadow-sm"
          style={{ background: bank.color }}
        >
          {bank.bankCode.slice(0, 2)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-base font-bold text-slate-900">{bank.bankName}</p>
            <Badge variant="info" size="sm">Open Banking</Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
            <span>{bank.type}</span>
            <span>·</span>
            <div className="flex items-center gap-1">
              <Clock size={11} />
              <span>Synced {bank.lastSync}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Badge variant={healthConfig.badge} dot={healthConfig.dot}>{healthConfig.label}</Badge>
          <ChevronRight size={16} className={cn('text-slate-400 transition-transform duration-200', expanded && 'rotate-90')} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-100 bg-[#F8FAFC]/50"
          >
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Permissions Authorized</p>
                  <div className="space-y-2">
                    {bank.permissions.map(p => (
                      <div key={p} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        {permissionLabels[p] || p}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Connection Details</p>
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Framework:</span>
                      <span className="font-semibold text-slate-800">Open Banking API</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Authorized:</span>
                      <span className="font-semibold text-slate-800">{formatDate(bank.connectedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Consent Validity:</span>
                      <span className="font-semibold text-slate-800">{bank.consentExpiry}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Connection Controls</p>
                  <div className="space-y-2">
                    <Button variant="secondary" size="sm" icon={<RefreshCw size={13} />} className="w-full justify-center">
                      Re-sync Connection
                    </Button>
                    <Button
                      variant="ghost" size="sm" icon={<Unlink size={13} />}
                      className="w-full justify-center text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => onDisconnect(bank)}
                    >
                      Revoke & Disconnect
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

export default function ConnectedBanksPage() {
  const [disconnectTarget, setDisconnectTarget] = useState(null)
  const { addToast, bankConnections, disconnectBankConnection } = useApp()
  const connectedBanks = mapConnections(bankConnections)

  const confirmDisconnect = async () => {
    if (!disconnectTarget) return
    const success = await disconnectBankConnection(disconnectTarget.id)
    if (success) {
      addToast({ type: 'info', title: 'Bank Disconnected', message: `${disconnectTarget.bankName} connection revoked.` })
    } else {
      addToast({ type: 'danger', title: 'Disconnect Failed', message: `Could not revoke ${disconnectTarget.bankName} connection.` })
    }
    setDisconnectTarget(null)
  }

  return (
    <AppLayout title="Connected Banks" subtitle="Manage your Open Banking authorizations">
      {/* Modal */}
      <Modal
        open={!!disconnectTarget}
        onClose={() => setDisconnectTarget(null)}
        title="Revoke Bank Connection"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDisconnectTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDisconnect} icon={<Unlink size={15} />}>Revoke Consent</Button>
          </>
        }
      >
        <div className="text-center py-2 space-y-2">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-600">
            <Unlink size={22} />
          </div>
          <p className="text-sm font-bold text-slate-800">
            Disconnect {disconnectTarget?.bankName}?
          </p>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Live balance sync will cease immediately. You can re-authorize access at any time.
          </p>
        </div>
      </Modal>

      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Navigation Breadcrumb Bar */}
        <BreadcrumbBar
          items={[
            { label: 'Accounts', to: '/app/accounts' },
            { label: 'Connected Banks' }
          ]}
          backTo="/app/accounts"
          backLabel="Accounts"
        />

        {/* Top Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs border-l-4 border-l-brand-600">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authorized Banks</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{connectedBanks.length}</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Active API Tokens</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs border-l-4 border-l-emerald-500">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Sync Health</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">100% Operational</p>
            <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">Gateway Online</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs border-l-4 border-l-emerald-600">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security Standard</p>
            <p className="text-2xl font-black text-emerald-950 mt-1">256-Bit E2EE</p>
            <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">Zero-Knowledge Encrypted</p>
          </div>
        </div>

        {/* Compliance Notice */}
        <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200/80 text-brand-900 text-xs flex items-start gap-3">
          <ShieldCheck size={18} className="text-brand-600 mt-0.5 flex-shrink-0" />
          <div className="leading-relaxed">
            <span className="font-bold">Regulated Open Banking Architecture: </span>
            FinConnect operates under UK Open Banking and FCA regulatory frameworks. Your bank login credentials remain 100% private to your bank.
          </div>
        </div>

        {/* Directory */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Connected Financial Institutions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage live banking consent & data sync authorizations</p>
            </div>
            <ConnectBankButton size="sm" className="shadow-xs" />
          </div>

          <div className="space-y-3">
            {connectedBanks.map((bank, i) => (
              <BankConnectionRow key={bank.id} bank={bank} onDisconnect={setDisconnectTarget} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

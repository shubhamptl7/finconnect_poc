import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Plus, RefreshCw, CheckCircle2, AlertTriangle,
  Clock, Shield, ChevronRight, Link2, Unlink, MoreHorizontal,
  Landmark, Globe, Info, X, PlugZap, WifiOff,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, Button, Badge, Modal, Alert } from '@/components/ui'
import { formatDate, cn } from '@/lib/utils'
import { useApp } from '@/store/AppContext'
import ConnectBankButton from '@/components/ConnectBankButton'

// ─── Bank Connection Status ────────────────────────────────
const permissionLabels = {
  balance:      'View balances',
  transactions: 'View transactions',
  payments:     'Initiate payments',
}

// Map real API connections to UI format
const mapConnections = (connections) => connections.map((conn) => ({
  id: conn.id,
  bankName: conn.bank_name,
  bankCode: conn.bank_name.substring(0, 4).toUpperCase(),
  type: 'Personal',
  accountNumber: '****', // We show exact accounts on the Accounts page
  color: '#0f172a', // Default color, you could map bank names to colors
  lastSync: 'Just now',
  connectionHealth: conn.status === 'active' ? 'good' : 'error',
  permissions: ['balance', 'transactions', 'payments'],
  consentExpiry: '90 days from connection',
  connectedAt: conn.created_at,
}))


// ─── Bank Card Row ─────────────────────────────────────────
function BankConnectionRow({ bank, onDisconnect }) {
  const [expanded, setExpanded] = useState(false)
  const health = bank.connectionHealth

  const healthConfig = {
    good:      { badge: 'success', label: 'Connected',  icon: <CheckCircle2 size={13} />, dot: true },
    attention: { badge: 'warning', label: 'Needs attention', icon: <AlertTriangle size={13} />, dot: false },
    error:     { badge: 'danger',  label: 'Disconnected', icon: <WifiOff size={13} />, dot: false },
  }[health] || { badge: 'neutral', label: 'Unknown', dot: false }

  return (
    <Card className="p-0 overflow-hidden">
      <div
        className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setExpanded(v => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}
      >
        {/* Bank logo */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: bank.color }}
        >
          {bank.bankCode.slice(0, 2)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">{bank.bankName}</p>
            {bank.isPrimary && (
              <Badge variant="info" size="sm">Primary</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-slate-500">{bank.type} · {bank.accountNumber}</p>
            <span className="text-slate-300">·</span>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock size={10} />
              <span>Synced {bank.lastSync}</span>
            </div>
          </div>
        </div>

        {/* Status + balance */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Badge variant={healthConfig.badge} dot={healthConfig.dot}>{healthConfig.label}</Badge>
          <ChevronRight size={15} className={cn('text-slate-400 transition-transform duration-200', expanded && 'rotate-90')} />
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                {/* Permissions */}
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Permissions Granted</p>
                  <div className="space-y-1.5">
                    {bank.permissions.map(p => (
                      <div key={p} className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        {permissionLabels[p] || p}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connection info */}
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Connection Details</p>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex gap-2">
                      <span className="text-slate-400">Provider</span>
                      <span className="font-medium">CBO Open Banking</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-400">Connected</span>
                      <span className="font-medium">{formatDate(bank.connectedAt)}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-400">Consent expiry</span>
                      <span className="font-medium">{bank.consentExpiry}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Actions</p>
                  <div className="flex flex-col gap-2">
                    <Button variant="secondary" size="sm" icon={<RefreshCw size={13} />} className="w-full justify-start">
                      Sync now
                    </Button>
                    <Button variant="ghost" size="sm" icon={<Unlink size={13} />}
                      className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => onDisconnect(bank)}
                    >
                      Disconnect bank
                    </Button>
                  </div>
                </div>
              </div>

              {health === 'attention' && (
                <Alert variant="warning" className="mt-4">
                  This connection needs re-authorisation. Your consent may have expired.{' '}
                  <button className="font-semibold underline cursor-pointer">Re-authorise →</button>
                </Alert>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

// ─── Disconnect Confirm ────────────────────────────────────
function DisconnectModal({ bank, open, onClose, onConfirm }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Disconnect Bank"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} icon={<Unlink size={15} />}>
            Disconnect
          </Button>
        </>
      }
    >
      <div className="text-center py-2">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Unlink size={24} className="text-red-500" />
        </div>
        <p className="text-sm text-slate-700 mb-2">
          Are you sure you want to disconnect <strong>{bank?.bankName}</strong>?
        </p>
        <p className="text-xs text-slate-500">
          Your transaction history will be preserved, but live data will no longer sync. You can reconnect at any time.
        </p>
      </div>
    </Modal>
  )
}

// ─── Connected Banks Page ──────────────────────────────────
export default function ConnectedBanksPage() {
  const [disconnectTarget, setDisconnectTarget] = useState(null)
  const { addToast, bankConnections } = useApp()
  
  const connectedBanks = mapConnections(bankConnections);

  const handleDisconnect = (bank) => setDisconnectTarget(bank)
  const confirmDisconnect = () => {
    addToast({ type: 'info', title: 'Bank disconnected', message: `${disconnectTarget?.bankName} has been removed.` })
    setDisconnectTarget(null)
  }

  return (
    <AppLayout
      title="Connected Banks"
      subtitle="Manage your Open Banking connections"
    >
      <DisconnectModal
        bank={disconnectTarget}
        open={!!disconnectTarget}
        onClose={() => setDisconnectTarget(null)}
        onConfirm={confirmDisconnect}
      />

      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5 border-l-4 border-l-brand-600">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Connected</p>
            <p className="text-2xl font-bold text-slate-900 number-lg">{connectedBanks.length}</p>
            <p className="text-xs text-slate-500 mt-1">Banks linked</p>
          </Card>
          <Card className="p-5 border-l-4 border-l-emerald-500">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">All Active</p>
            <p className="text-2xl font-bold text-slate-900 number-lg">
              {connectedBanks.filter(b => b.connectionHealth === 'good').length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Syncing normally</p>
          </Card>
          <Card className="p-5 border-l-4 border-l-amber-400">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Attention</p>
            <p className="text-2xl font-bold text-slate-900 number-lg">
              {connectedBanks.filter(b => b.connectionHealth === 'attention').length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Need review</p>
          </Card>
        </div>

        {/* Info about Open Banking */}
        <Alert variant="info">
          <strong>How Open Banking connections work: </strong>
          PayOman connects to your banks using the CBO Open Banking framework. We receive read-only access to your account data. 
          You authorise each connection separately and can revoke access at any time.
        </Alert>

        {/* Bank list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>
              Your Connections
            </h2>
            <ConnectBankButton />
          </div>

          <div className="space-y-3">
            {connectedBanks.map((bank, i) => (
              <motion.div
                key={bank.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <BankConnectionRow bank={bank} onDisconnect={handleDisconnect} />
              </motion.div>
            ))}
          </div>
        </div>



        {/* CBO badge */}
        <Card flat className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield size={18} className="text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Built on CBO Open Banking Standards</p>
              <p className="text-xs text-slate-500 mt-0.5">
                All connections are established through the Central Bank of Oman's regulated Open Banking framework. Your data is encrypted in transit and at rest.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from '@/store/AppContext'
import { ToastContainer } from '@/components/ui'
import RecoveryCodeScreen from '@/components/RecoveryCodeScreen'

// Pages
import LandingPage from '@/pages/LandingPage'
import { LoginPage, RegisterPage, ForgotPasswordPage, KycVerifyPage } from '@/pages/auth/AuthPages'
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import ConnectedBanksPage from '@/pages/dashboard/ConnectedBanksPage'
import AccountsPage from '@/pages/dashboard/AccountsPage'
import TransactionsPage from '@/pages/dashboard/TransactionsPage'
import PaymentsPage from '@/pages/dashboard/PaymentsPage'
import BeneficiariesPage from '@/pages/dashboard/BeneficiariesPage'
import { CardsPage, SettingsPage, NotificationsPage, HelpPage } from '@/pages/dashboard/OtherPages'
import { MyProfile, UpdateProfile, ChangePassword } from '@/pages/profile/ProfilePages'
import {
  AdminLayout, AdminCustomers, AdminPayments, AdminAudits
} from '@/pages/admin/AdminPages'

// ─── Protected Route ────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitializing } = useApp()
  
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  return children
}

// ─── Toast Layer ─────────────────────────────────────────────
function ToastLayer() {
  const { toasts, removeToast } = useApp()
  return <ToastContainer toasts={toasts} onClose={removeToast} />
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/auth/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/auth/verify-kyc" element={<KycVerifyPage />} />

          {/* App (protected) */}
          <Route path="/app" element={
            <ProtectedRoute>
              <Navigate to="/app/dashboard" replace />
            </ProtectedRoute>
          } />
          <Route path="/app/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/app/accounts" element={<ProtectedRoute><AccountsPage /></ProtectedRoute>} />
          <Route path="/app/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
          <Route path="/app/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
          <Route path="/app/banks" element={<ProtectedRoute><ConnectedBanksPage /></ProtectedRoute>} />
          <Route path="/app/beneficiaries" element={<ProtectedRoute><BeneficiariesPage /></ProtectedRoute>} />
          <Route path="/app/cards" element={<ProtectedRoute><CardsPage /></ProtectedRoute>} />
          <Route path="/app/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/app/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/app/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
          <Route path="/app/profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
          <Route path="/app/profile/update" element={<ProtectedRoute><UpdateProfile /></ProtectedRoute>} />
          <Route path="/app/profile/password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/customers" replace />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="audits" element={<AdminAudits />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <RecoveryCodeScreen />
        <ToastLayer />
      </BrowserRouter>
    </AppProvider>
  )
}

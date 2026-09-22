import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from '@/store/AppContext'
import { ToastContainer } from '@/components/ui'
import RecoveryCodeScreen from '@/components/RecoveryCodeScreen'

// Pages
import LandingPage from '@/pages/LandingPage'
import EmiCalculatorPage from '@/pages/calculators/EmiCalculatorPage'
import EligibilityCalculatorPage from '@/pages/calculators/EligibilityCalculatorPage'
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
import LoansPage from '@/pages/dashboard/loans/LoansPage'
import LoanEligibilityPage from '@/pages/dashboard/loans/LoanEligibilityPage'
import LoanApplicationPage from '@/pages/dashboard/loans/LoanApplicationPage'
import LoanApplicationStatusPage from '@/pages/dashboard/loans/LoanApplicationStatusPage'
import LoanOfferPage from '@/pages/dashboard/loans/LoanOfferPage'
import LoanServicingPage from '@/pages/dashboard/loans/LoanServicingPage'
import ActiveLoanRedirect from '@/pages/dashboard/loans/ActiveLoanRedirect'
import { AdminLoanReviewPage } from '@/pages/admin/AdminLoanReviewPage'
import {
  AdminDashboard, AdminCustomers, AdminPayments, AdminAudits
} from '@/pages/admin/AdminPages'

// ─── Shared Protected Route (Both Users & Admins) ────────────────
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

// ─── User Only Protected Route (User Banking Features) ───────────
function UserOnlyProtectedRoute({ children }) {
  const { user, isAuthenticated, isInitializing } = useApp()
  
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  // Strict role check: Admin cannot access user-side financial banking pages
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />

  return children
}

// ─── Admin Protected Route (Admin Portal Features) ───────────────
function AdminProtectedRoute({ children }) {
  const { user, isAuthenticated, isInitializing } = useApp()
  
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  // Strict role check: Non-admin users cannot access admin-side management pages
  if (user?.role !== 'admin') return <Navigate to="/app/dashboard" replace />

  return children
}

// ─── Guest / Public Only Route (Login, Register, Forgot Password, Reset Password) ───
function PublicOnlyRoute({ children }) {
  const { user, isAuthenticated, isInitializing } = useApp()
  
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    )
  }
  
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/app/dashboard'} replace />
  }

  return children
}

// ─── KYC Route (Only accessible if unverified or during signup) ───
function KycRoute({ children }) {
  const { user, isAuthenticated, isInitializing } = useApp()

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  // If already authenticated and KYC verified, redirect to dashboard
  if (isAuthenticated && user?.status === 'active') {
    return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/app/dashboard'} replace />
  }

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
          {/* Public Marketing */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/calculators/emi" element={<EmiCalculatorPage />} />
          <Route path="/calculators/eligibility" element={<EligibilityCalculatorPage />} />

          {/* Auth (Guest Only - Authenticated users are redirected to their dashboard) */}
          <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
          <Route path="/auth/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/auth/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
          <Route path="/auth/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
          <Route path="/auth/reset-password/:token" element={<PublicOnlyRoute><ResetPasswordPage /></PublicOnlyRoute>} />
          <Route path="/auth/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/auth/verify-kyc" element={<KycRoute><KycVerifyPage /></KycRoute>} />

          {/* In-App Calculators (Protected for authenticated users) */}
          <Route path="/app/calculators/emi" element={<UserOnlyProtectedRoute><EmiCalculatorPage /></UserOnlyProtectedRoute>} />
          <Route path="/app/calculators/eligibility" element={<UserOnlyProtectedRoute><EligibilityCalculatorPage /></UserOnlyProtectedRoute>} />

          {/* User Financial Banking Routes (User Only) */}
          <Route path="/app" element={
            <UserOnlyProtectedRoute>
              <Navigate to="/app/dashboard" replace />
            </UserOnlyProtectedRoute>
          } />
          <Route path="/app/dashboard" element={<UserOnlyProtectedRoute><DashboardPage /></UserOnlyProtectedRoute>} />
          <Route path="/app/accounts" element={<UserOnlyProtectedRoute><AccountsPage /></UserOnlyProtectedRoute>} />
          <Route path="/app/transactions" element={<UserOnlyProtectedRoute><TransactionsPage /></UserOnlyProtectedRoute>} />
          <Route path="/app/payments" element={<UserOnlyProtectedRoute><PaymentsPage /></UserOnlyProtectedRoute>} />
          <Route path="/app/banks" element={<UserOnlyProtectedRoute><ConnectedBanksPage /></UserOnlyProtectedRoute>} />
          <Route path="/app/beneficiaries" element={<UserOnlyProtectedRoute><BeneficiariesPage /></UserOnlyProtectedRoute>} />
          <Route path="/app/cards" element={<UserOnlyProtectedRoute><CardsPage /></UserOnlyProtectedRoute>} />

          {/* Loan Module Routes */}
          <Route path="/app/loans" element={<UserOnlyProtectedRoute><LoansPage /></UserOnlyProtectedRoute>} />
          <Route path="/app/loans/eligibility" element={<UserOnlyProtectedRoute><LoanEligibilityPage /></UserOnlyProtectedRoute>} />
          <Route path="/app/loans/apply" element={<UserOnlyProtectedRoute><LoanApplicationPage /></UserOnlyProtectedRoute>} />
          <Route path="/app/loans/status/:id" element={<UserOnlyProtectedRoute><LoanApplicationStatusPage /></UserOnlyProtectedRoute>} />
          <Route path="/app/loans/offer/:id" element={<UserOnlyProtectedRoute><LoanOfferPage /></UserOnlyProtectedRoute>} />
          <Route path="/app/emi/:id" element={<UserOnlyProtectedRoute><LoanServicingPage /></UserOnlyProtectedRoute>} />
          <Route path="/app/emi" element={<UserOnlyProtectedRoute><LoanServicingPage /></UserOnlyProtectedRoute>} />

          {/* Shared Account & Utility Routes (Accessible to Users & Admins) */}
          <Route path="/app/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/app/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/app/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
          <Route path="/app/profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
          <Route path="/app/profile/update" element={<ProtectedRoute><UpdateProfile /></ProtectedRoute>} />
          <Route path="/app/profile/password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

          {/* Admin Portal Routes (Admin Only) */}
          <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
          <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
          <Route path="/admin/loans" element={<AdminProtectedRoute><AdminLoanReviewPage /></AdminProtectedRoute>} />
          <Route path="/admin/customers" element={<AdminProtectedRoute><AdminCustomers /></AdminProtectedRoute>} />
          <Route path="/admin/payments" element={<AdminProtectedRoute><AdminPayments /></AdminProtectedRoute>} />
          <Route path="/admin/audits" element={<AdminProtectedRoute><AdminAudits /></AdminProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <RecoveryCodeScreen />
        <ToastLayer />
      </BrowserRouter>
    </AppProvider>
  )
}

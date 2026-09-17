import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { loanApi } from '@/services/loanApi'
import { AppLayout } from '@/components/layout/AppLayout'

export default function ActiveLoanRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    const findActiveLoan = async () => {
      try {
        const apps = await loanApi.getApplications()
        const activeApp = apps.find(app => ['LOAN_CREATED', 'DISBURSED', 'ACTIVE', 'CLOSED', 'COMPLETED'].includes(app.status))
        
        if (activeApp) {
          navigate(`/app/emi/${activeApp.id}`, { replace: true })
        } else {
          // Open EMI servicing page directly even if no active loan exists yet
          navigate('/app/emi', { replace: true })
        }
      } catch (error) {
        navigate('/app/emi', { replace: true })
      }
    }
    findActiveLoan()
  }, [navigate])

  return (
    <AppLayout title="Manage EMI" subtitle="Locating your active loans...">
      <div className="p-12 text-center text-slate-500 flex justify-center items-center gap-2">
        <Activity size={18} className="animate-spin text-teal-600" /> Redirecting to your active loan...
      </div>
    </AppLayout>
  )
}

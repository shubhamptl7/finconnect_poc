import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { AuthShell } from './AuthPages'; // reuse the layout wrapper

export function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { API_URL, addToast } = useApp();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [errorMsg, setErrorMsg] = useState('');
  
  // Prevent strict mode double-firing from sending token twice
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    async function verify() {
      try {
        const response = await fetch(`${API_URL}/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const data = await response.json();
        
        if (response.ok) {
          setStatus('success');
          addToast({ type: 'success', message: 'Email verified successfully!' });
          setTimeout(() => {
            // Once verified, we can send them to login to actually start their session
            navigate('/auth/login', { replace: true });
          }, 3000);
        } else {
          setStatus('error');
          setErrorMsg(data.message || 'Verification failed');
        }
      } catch (err) {
        setStatus('error');
        setErrorMsg('Network error occurred while verifying');
      }
    }

    verify();
  }, [token, API_URL, navigate, addToast]);

  return (
    <AuthShell>
      <div className="text-center py-8">
        {status === 'verifying' && (
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <h2 className="text-xl font-semibold text-slate-800">Verifying your email...</h2>
            <p className="text-slate-500">Please wait a moment.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Email Verified!</h2>
            <p className="text-slate-500 mb-4">Your account is now secure. Redirecting you to login...</p>
            <button onClick={() => navigate('/auth/login')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Go to Login Now
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
              <XCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Verification Failed</h2>
            <p className="text-slate-500">{errorMsg}</p>
            <button onClick={() => navigate('/auth/login')} className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
              Return to Login
            </button>
          </div>
        )}
      </div>
    </AuthShell>
  );
}

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { Lock, Loader2, ArrowLeft } from 'lucide-react';
import { AuthShell } from './AuthPages';
import { Input } from '@/components/ui';

export function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { API_URL, addToast } = useApp();
  
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.newPassword) e.newPassword = 'Required';
    else if (form.newPassword.length < 8 || form.newPassword.length > 16) e.newPassword = 'Must be 8-16 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])/.test(form.newPassword)) {
      e.newPassword = 'Must contain uppercase, lowercase, number, and special character';
    }
    
    if (form.newPassword !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: form.newPassword, confirmPassword: form.confirmPassword })
      });
      const data = await response.json();
      
      if (response.ok) {
        addToast({ type: 'success', message: 'Password reset successful! You can now log in.' });
        navigate('/auth/login', { replace: true });
      } else {
        setErrors({ submit: data.message || 'Failed to reset password' });
      }
    } catch (err) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1.5">Set new password</h1>
        <p className="text-sm text-slate-500">Please enter a strong password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.submit && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
            {errors.submit}
          </div>
        )}

        <Input
          label="New Password"
          type={showPw ? 'text' : 'password'}
          placeholder="8 to 16 characters"
          icon={<Lock size={15} />}
          value={form.newPassword}
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          error={errors.newPassword}
          iconRight={
            <button type="button" onClick={() => setShowPw(v => !v)} className="cursor-pointer hover:text-slate-600 transition-colors">
              {showPw ? 'Hide' : 'Show'}
            </button>
          }
        />
        
        <Input
          label="Confirm Password"
          type={showPw ? 'text' : 'password'}
          placeholder="Retype new password"
          icon={<Lock size={15} />}
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          error={errors.confirmPassword}
        />

        <button 
          type="submit" 
          disabled={loading}
          className="w-full mt-4 bg-blue-600 text-white rounded-xl py-3.5 font-medium hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : 'Reset Password'}
        </button>
        
        <div className="mt-6 text-center">
          <button 
            type="button" 
            onClick={() => navigate('/auth/login')}
            className="inline-flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Login
          </button>
        </div>
      </form>
    </AuthShell>
  );
}

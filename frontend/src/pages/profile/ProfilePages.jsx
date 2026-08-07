import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Calendar, Shield, Lock, Key, AlertTriangle, ChevronRight, Activity, Camera, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useApp } from '@/store/AppContext'
import { Card, Button, Input, Badge } from '@/components/ui'
import { AppLayout } from '@/components/layout/AppLayout'
import { cn, formatRelative } from '@/lib/utils'

export function MyProfile() {
  const { user } = useApp()
  const navigate = useNavigate()

  return (
    <AppLayout title="My Profile" subtitle="Manage your personal information and account settings">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Main Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 border-b border-slate-100 bg-slate-50/50">
              <div className="w-24 h-24 rounded-full bg-brand-600 flex items-center justify-center text-white text-3xl font-bold shadow-sm flex-shrink-0">
                {user?.initials || 'U'}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 leading-tight" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>{user?.name}</h3>
                <p className="text-base text-slate-500 font-medium mt-1">{user?.email}</p>
                <div className="mt-4 flex gap-2">
                  <Badge variant={user?.status === 'active' ? 'success' : 'warning'} dot>
                    {user?.status === 'active' ? 'Active Account' : user?.status}
                  </Badge>
                  <Badge variant="neutral">Personal Plan</Badge>
                </div>
              </div>
              <Button onClick={() => navigate('/app/profile/update')} className="w-full sm:w-auto mt-4 sm:mt-0">
                Edit Profile
              </Button>
            </div>

            <div className="p-6 sm:p-8">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-6">Personal Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1.5"><Phone size={14} /> Phone Number</p>
                  <p className="text-sm font-semibold text-slate-900">{user?.phone_number || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1.5"><Calendar size={14} /> Date of Birth</p>
                  <p className="text-sm font-semibold text-slate-900">{user?.date_of_birth || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Security & Settings */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <Shield size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>Security</h3>
                <p className="text-xs text-slate-500">Protect your account</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/app/profile/password')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50 hover:shadow-sm transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Key size={16} className="text-slate-400 group-hover:text-brand-600 transition-colors" />
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-brand-700 transition-colors">Change Password</span>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
              </button>
            </div>
          </Card>

          <Card className="p-6 bg-slate-50 border-none shadow-none">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Account verified</p>
                <p className="text-xs text-slate-500 mt-1">Your identity has been verified. You have full access to all features.</p>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </AppLayout>
  )
}

export function UpdateProfile() {
  const { user, updateProfile, addToast } = useApp()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone_number: user?.phone_number || '',
    date_of_birth: user?.date_of_birth || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  const handleChange = (e) => {
    let value = e.target.value
    if (e.target.name === 'phone_number') {
      value = value.replace(/[^\d\s+()-]/g, '')
    }
    setFormData(prev => ({ ...prev, [e.target.name]: value }))
    // Clear validation error when user types
    if (validationErrors[e.target.name]) {
      setValidationErrors(prev => ({ ...prev, [e.target.name]: null }))
    }
  }

  const validateForm = () => {
    const errors = {}

    // Name validation
    if (!formData.name.trim()) {
      errors.name = "Full name is required"
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters long"
    } else if (!/^[a-zA-Z\s]*$/.test(formData.name)) {
      errors.name = "Name can only contain letters and spaces"
    }

    // Phone validation (optional but if provided must be valid)
    if (formData.phone_number) {
      if (!/^\+?[0-9\s()-]+$/.test(formData.phone_number)) {
        errors.phone_number = "Please enter a valid phone number"
      } else if (formData.phone_number.length < 8 || formData.phone_number.length > 15) {
        errors.phone_number = "Phone number must be between 8 and 15 characters"
      }
    }

    // DOB validation (optional but if provided must be past date)
    if (formData.date_of_birth) {
      const dob = new Date(formData.date_of_birth)
      const today = new Date()
      if (dob > today) {
        errors.date_of_birth = "Date of birth cannot be in the future"
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      await updateProfile(formData)
      addToast({ type: 'success', title: 'Profile Updated', message: 'Your personal information has been updated successfully.' })
      navigate('/app/profile')
    } catch (err) {
      setError(err.message || 'Failed to update profile')
      addToast({ type: 'error', title: 'Update Failed', message: err.message || 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout title="Update Profile" subtitle="Make changes to your personal information">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-1">
          <Button variant="ghost" size="sm" className="mb-6 -ml-3" onClick={() => navigate('/app/profile')} icon={<ArrowLeft size={16} />}>
            Back to Profile
          </Button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>Personal Information</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Update your personal details. Make sure your name matches your government ID to avoid issues with bank transfers.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-6 sm:p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                  <AlertTriangle size={16} /> {error}
                </div>
              )}
              <div className="space-y-5">
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  icon={<User size={16} />}
                  placeholder="Your full name"
                  required
                  error={validationErrors.name}
                />

                <div>
                  <Input
                    label="Email Address"
                    className="text-slate-500 bg-slate-100"
                    defaultValue={user?.email}
                    icon={<Mail size={16} />}
                    disabled
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                    <AlertTriangle size={12} className="text-slate-400" /> Email address cannot be changed.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Phone Number"
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    icon={<Phone size={16} />}
                    placeholder="+968 1234 5678"
                    error={validationErrors.phone_number}
                  />

                  <Input
                    label="Date of Birth"
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    icon={<Calendar size={16} />}
                    error={validationErrors.date_of_birth}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => navigate('/app/profile')} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

export function ChangePassword() {
  const { changePassword, addToast } = useApp()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (validationErrors[e.target.name]) {
      setValidationErrors(prev => ({ ...prev, [e.target.name]: null }))
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.currentPassword) {
      errors.currentPassword = "Current password is required"
    }

    if (!formData.newPassword) {
      errors.newPassword = "New password is required"
    } else if (formData.newPassword.length < 8 || formData.newPassword.length > 16) {
      errors.newPassword = "Password must be between 8 and 16 characters long"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])/.test(formData.newPassword)) {
      errors.newPassword = "Password must contain uppercase, lowercase, number, and special character"
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password"
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      })
      addToast({ type: 'success', title: 'Password Changed', message: 'Your password was updated successfully.' })
      navigate('/app/profile')
    } catch (err) {
      setError(err.message || 'Failed to change password')
      addToast({ type: 'error', title: 'Failed', message: err.message || 'Failed to change password' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout title="Change Password" subtitle="Update your security credentials">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-1">
          <Button variant="ghost" size="sm" className="mb-6 -ml-3" onClick={() => navigate('/app/profile')} icon={<ArrowLeft size={16} />}>
            Back to Profile
          </Button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: 'Geist, IBM Plex Sans, system-ui' }}>Account Security</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Ensure your account is using a long, random password to stay secure. It's recommended to use a password manager.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-6 sm:p-8">
            <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100 mb-6">
              <Shield size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Secure your account</p>
                <p className="text-xs text-amber-700 mt-1">Use a password that is at least 8 characters long and contains a mix of letters, numbers, and symbols.</p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                  <AlertTriangle size={16} /> {error}
                </div>
              )}
              <Input
                label="Current Password"
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                icon={<Key size={16} />}
                placeholder="Enter current password"
                required
                error={validationErrors.currentPassword}
              />

              <div className="pt-2">
                <Input
                  label="New Password"
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  icon={<Lock size={16} />}
                  placeholder="Enter new password"
                  required
                  error={validationErrors.newPassword}
                />
              </div>

              <Input
                label="Confirm New Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                icon={<Lock size={16} />}
                placeholder="Confirm new password"
                required
                error={validationErrors.confirmPassword}
              />

              <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => navigate('/app/profile')} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  Update Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

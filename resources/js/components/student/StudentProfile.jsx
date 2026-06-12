import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle, AlertCircle, X } from 'lucide-react';
import StudentDashboardLayout from './StudentDashboardLayout';

export default function StudentProfile({ student, onLogout, onNavigate, currentPath, onStudentUpdate }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', student_number: '', course: '', year_level: '', section: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });

  useEffect(() => {
    fetch('/student/api/profile', { credentials: 'same-origin' })
      .then(res => res.json())
      .then(data => {
        const s = data.student;
        setProfile(s);
        setForm({ first_name: s.first_name || '', last_name: s.last_name || '', email: s.email || '', student_number: s.student_number || '', course: s.course || '', year_level: s.year_level || '', section: s.section || '' });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors({});
    setMessage(null);
  };

  const handlePasswordChange = (e) => {
    setPasswordForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors({});
    setMessage(null);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setErrors({});
    fetch('/student/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') },
      credentials: 'same-origin',
      body: JSON.stringify(form),
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 422) { setErrors(data.errors || {}); throw new Error('Validation failed'); }
          throw new Error(data.message || 'Failed to update profile');
        }
        return data;
      })
      .then(data => {
        setProfile(data.student);
        setMessage({ type: 'success', text: data.message });
        if (onStudentUpdate) onStudentUpdate(data.student);
      })
      .catch(err => {
        if (err.message === 'Validation failed') return;
        setMessage({ type: 'error', text: err.message });
      })
      .finally(() => setSaving(false));
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setSavingPassword(true);
    setMessage(null);
    setErrors({});
    fetch('/student/profile/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') },
      credentials: 'same-origin',
      body: JSON.stringify(passwordForm),
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 422) { setErrors(data.errors || {}); throw new Error('Validation failed'); }
          throw new Error(data.message || 'Failed to update password');
        }
        return data;
      })
      .then(data => {
        setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);
        setMessage({ type: 'success', text: data.message });
        closePasswordModal();
      })
      .catch(err => {
        if (err.message === 'Validation failed') return;
        setMessage({ type: 'error', text: err.message });
      })
      .finally(() => setSavingPassword(false));
  };

  if (loading) {
    return (
      <StudentDashboardLayout title="My Profile" subtitle="Manage your account" student={student} onLogout={onLogout} onNavigate={onNavigate} currentPath={currentPath}>
        <div className="max-w-container-max mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-28 bg-surface-container-high rounded-2xl" />
            <div className="h-64 bg-surface-container-high rounded-2xl" />
            <div className="h-40 bg-surface-container-high rounded-2xl" />
            <div className="h-52 bg-surface-container-high rounded-2xl" />
          </div>
        </div>
      </StudentDashboardLayout>
    );
  }

  const s = profile || student;
  const initials = `${s?.first_name?.charAt(0) || ''}${s?.last_name?.charAt(0) || ''}`;

  const inputClass = 'w-full px-4 py-2 sm:py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md';
  const inputErrorClass = 'border-error/50 focus:border-error focus:ring-error/30';
  const labelClass = 'text-label-sm text-on-surface-variant font-medium';

  return (
    <StudentDashboardLayout title="My Profile" subtitle="Manage your account" student={student} onLogout={onLogout} onNavigate={onNavigate} currentPath={currentPath}>
      <div className="max-w-container-max mx-auto space-y-6">
        {message && (
          <div className={'flex items-center gap-2 p-3 sm:p-4 rounded-xl border ' + (message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700')}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <p className="text-body-sm font-medium">{message.text}</p>
          </div>
        )}

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 sm:p-7 shadow-sm">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary text-on-primary flex items-center justify-center text-lg sm:text-xl font-bold shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-on-surface">{s?.last_name}, {s?.first_name}</h2>
              <p className="text-body-md text-on-surface-variant">{s?.student_number}</p>

            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 sm:p-7 shadow-sm">
          <h3 className="text-base sm:text-lg font-bold text-on-surface mb-4">Personal Information</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First Name</label>
                <input name="first_name" type="text" value={form.first_name} onChange={handleChange} className={inputClass + (errors.first_name ? ' ' + inputErrorClass : '')} />
                {errors.first_name && <p className="text-body-xs text-error mt-1">{errors.first_name[0]}</p>}
              </div>
              <div>
                <label className={labelClass}>Last Name</label>
                <input name="last_name" type="text" value={form.last_name} onChange={handleChange} className={inputClass + (errors.last_name ? ' ' + inputErrorClass : '')} />
                {errors.last_name && <p className="text-body-xs text-error mt-1">{errors.last_name[0]}</p>}
              </div>
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass + (errors.email ? ' ' + inputErrorClass : '')} />
              {errors.email && <p className="text-body-xs text-error mt-1">{errors.email[0]}</p>}
            </div>
            <div>
              <label className={labelClass}>Student Number</label>
              <input name="student_number" type="text" value={form.student_number} onChange={handleChange} className={inputClass + (errors.student_number ? ' ' + inputErrorClass : '')} />
              {errors.student_number && <p className="text-body-xs text-error mt-1">{errors.student_number[0]}</p>}
            </div>
            <div className="pt-2">
              <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-bold text-label-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer">
                {saving ? 'Saving...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 sm:p-7 shadow-sm">
          <h3 className="text-base sm:text-lg font-bold text-on-surface mb-4">Security</h3>
          <button type="button" onClick={() => setShowPasswordModal(true)} className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-bold text-label-sm hover:opacity-90 transition-all cursor-pointer">
            Change Password
          </button>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-3 py-6" onClick={closePasswordModal}>
          <div className="w-[92%] max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden relative">
              <button type="button" onClick={closePasswordModal} className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer z-10 rounded-full">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="p-6 sm:p-8">
                <h3 className="text-base sm:text-lg font-bold text-on-surface mb-6">Change Password</h3>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className={labelClass}>Current Password</label>
                    <div className="relative">
                      <input name="current_password" type={showCurrent ? 'text' : 'password'} value={passwordForm.current_password} onChange={handlePasswordChange} className={inputClass + ' pr-10' + (errors.current_password ? ' ' + inputErrorClass : '')} autoComplete="off" />
                      <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer">
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.current_password && <p className="text-body-xs text-error mt-1">{errors.current_password[0]}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>New Password</label>
                    <div className="relative">
                      <input name="new_password" type={showNew ? 'text' : 'password'} value={passwordForm.new_password} onChange={handlePasswordChange} className={inputClass + ' pr-10' + (errors.new_password ? ' ' + inputErrorClass : '')} placeholder="Min. 8 characters" autoComplete="new-password" />
                      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer">
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.new_password && <p className="text-body-xs text-error mt-1">{errors.new_password[0]}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Confirm New Password</label>
                    <div className="relative">
                      <input name="new_password_confirmation" type={showConfirm ? 'text' : 'password'} value={passwordForm.new_password_confirmation} onChange={handlePasswordChange} className={inputClass + ' pr-10' + (errors.new_password_confirmation ? ' ' + inputErrorClass : '')} placeholder="Repeat your password" autoComplete="off" />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.new_password_confirmation && <p className="text-body-xs text-error mt-1">{errors.new_password_confirmation[0]}</p>}
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button type="submit" disabled={savingPassword} className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-bold text-label-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer">
                      {savingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                    <button type="button" onClick={closePasswordModal} className="px-5 py-2.5 rounded-lg font-bold text-label-sm text-on-surface-variant bg-surface-container-high hover:bg-surface-container-higher transition-colors cursor-pointer">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </StudentDashboardLayout>
  );
}

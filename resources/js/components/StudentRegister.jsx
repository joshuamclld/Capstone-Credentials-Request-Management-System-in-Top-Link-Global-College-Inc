import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import StudentAuthLayout from './student/StudentAuthLayout';
import StudentAuthWindow from './student/StudentAuthWindow';

export default function StudentRegister({ onNavigate }) {
  const [form, setForm] = useState({
    student_number: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getCsrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.student_number || !form.first_name || !form.last_name || !form.email || !form.password) {
      setError('Please fill in all fields.'); return;
    }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (form.password !== form.password_confirmation) { setError('Passwords do not match.'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/student/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) { const msgs = Object.values(data.errors).flat(); setError(msgs[0] || 'Validation failed.'); }
        else setError(data.message || 'Registration failed.');
        setLoading(false);
        return;
      }
      onNavigate(`/student/verify-otp?student_id=${data.student_id}`);
    } catch { setError('Network error. Please check your connection.'); }
    setLoading(false);
  };

  return (
    <StudentAuthLayout onNavigate={onNavigate}>
      <StudentAuthWindow title="Create Student Account" subtitle="Register using your student email and student number." wide>
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-error/10 border border-error/30">
            <p className="text-body-sm text-error flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-label-md font-bold text-on-surface mb-1.5">Student Number</label>
            <input type="text" value={form.student_number} onChange={set('student_number')}
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md"
              placeholder="e.g., 2024-00001" autoFocus />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-1.5">First Name</label>
              <input type="text" value={form.first_name} onChange={set('first_name')}
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md"
                placeholder="Juan" />
            </div>
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-1.5">Last Name</label>
              <input type="text" value={form.last_name} onChange={set('last_name')}
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md"
                placeholder="Dela Cruz" />
            </div>
          </div>

          <div>
            <label className="block text-label-md font-bold text-on-surface mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={set('email')}
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md"
              placeholder="juan@example.com" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={set('password')}
                  className="w-full px-4 py-3 pr-12 bg-surface-container-lowest border border-outline rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md"
                  placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-1.5">Confirm Password</label>
              <div className="relative">
                <input type={showConfirmPassword ? 'text' : 'password'} value={form.password_confirmation} onChange={set('password_confirmation')}
                  className="w-full px-4 py-3 pr-12 bg-surface-container-lowest border border-outline rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md"
                  placeholder="Repeat your password" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-label-md text-label-md font-bold text-on-primary bg-primary hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-body-sm text-on-surface-variant mt-6">
          Already have an account?{' '}
          <button type="button" onClick={() => onNavigate('/student/login')} className="text-primary font-bold hover:underline cursor-pointer">Login</button>
        </p>
      </StudentAuthWindow>
    </StudentAuthLayout>
  );
}

import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import StudentAuthLayout from './student/StudentAuthLayout';
import StudentAuthWindow from './student/StudentAuthWindow';

export default function StudentLogin({ onNavigate, onLoginSuccess }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getCsrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!login.trim() || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
        body: JSON.stringify({ login: login.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needs_verification) { onNavigate(`/student/verify-otp?student_id=${data.student_id}`); return; }
        setError(data.message || 'Login failed.');
        setLoading(false);
        return;
      }
      if (onLoginSuccess) onLoginSuccess(data.student);
      onNavigate('/track');
    } catch { setError('Network error. Please check your connection.'); }
    setLoading(false);
  };

  return (
    <StudentAuthLayout onNavigate={onNavigate}>
      <StudentAuthWindow title="Student Login" subtitle="Login to manage your credential requests.">
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-error/10 border border-error/30">
            <p className="text-body-sm text-error flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-label-md font-bold text-on-surface mb-1.5">Student Number or Email</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md"
              placeholder="e.g., 2024-00001 or email@example.com"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-label-md font-bold text-on-surface mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-surface-container-lowest border border-outline rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md"
                placeholder="Enter your password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-label-md text-label-md font-bold text-on-primary bg-primary hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-body-sm text-on-surface-variant mt-6">
          Don't have an account?{' '}
          <button type="button" onClick={() => onNavigate('/student/register')} className="text-primary font-bold hover:underline cursor-pointer">Register</button>
        </p>

        <p className="text-center text-body-sm text-on-surface-variant mt-3">
          <button type="button" onClick={() => onNavigate('/track')} className="text-primary font-bold hover:underline cursor-pointer">Track Request without Login</button>
        </p>
      </StudentAuthWindow>
    </StudentAuthLayout>
  );
}

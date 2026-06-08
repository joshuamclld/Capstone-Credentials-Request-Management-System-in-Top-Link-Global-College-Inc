import React, { useState, useEffect } from 'react';
import { AlertCircle, Eye, EyeOff, X } from 'lucide-react';

function LoginForm({ onSuccess, onSwitchToRegister, onClose }) {
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
        if (data.needs_verification) { onClose(); onSuccess(null, data.student_id); return; }
        setError(data.message || 'Login failed.');
        setLoading(false);
        return;
      }
      onSuccess(data.student);
    } catch { setError('Network error. Please check your connection.'); }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/30">
          <p className="text-body-sm text-error flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</p>
        </div>
      )}
      <div>
        <label className="block text-label-md font-bold text-on-surface mb-1.5">Student Number or Email</label>
        <input type="text" value={login} onChange={(e) => setLogin(e.target.value)}
          className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
          placeholder="e.g., 2024-00001 or email@example.com" autoFocus />
      </div>
      <div>
        <label className="block text-label-md font-bold text-on-surface mb-1.5">Password</label>
        <div className="relative">
          <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 pr-12 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
            placeholder="Enter your password" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer">
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>
      <button type="submit" disabled={loading} className="w-full py-4 rounded-lg bg-primary text-on-primary font-bold hover:opacity-90 shadow-lg transition-all cursor-pointer disabled:opacity-50">
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      <p className="text-center text-body-sm text-on-surface-variant">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitchToRegister} className="text-primary font-bold hover:underline cursor-pointer">Register</button>
      </p>
    </form>
  );
}

function RegisterForm({ onRegistered, onSwitchToLogin }) {
  const [form, setForm] = useState({
    student_number: '', first_name: '', last_name: '', email: '', password: '', password_confirmation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getCsrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

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
      onRegistered(data.student_id);
    } catch { setError('Network error. Please check your connection.'); }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/30">
          <p className="text-body-sm text-error flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</p>
        </div>
      )}
      <div>
        <label className="block text-label-md font-bold text-on-surface mb-1.5">Student Number</label>
        <input type="text" value={form.student_number} onChange={set('student_number')}
          className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
          placeholder="e.g., 2024-00001" autoFocus />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-label-md font-bold text-on-surface mb-1.5">First Name</label>
          <input type="text" value={form.first_name} onChange={set('first_name')}
            className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md" placeholder="Juan" />
        </div>
        <div>
          <label className="block text-label-md font-bold text-on-surface mb-1.5">Last Name</label>
          <input type="text" value={form.last_name} onChange={set('last_name')}
            className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md" placeholder="Dela Cruz" />
        </div>
      </div>
      <div>
        <label className="block text-label-md font-bold text-on-surface mb-1.5">Email</label>
        <input type="email" value={form.email} onChange={set('email')}
          className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md" placeholder="juan@example.com" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-label-md font-bold text-on-surface mb-1.5">Password</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={set('password')}
              className="w-full px-4 py-3 pr-12 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md" placeholder="Min. 8 characters" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-label-md font-bold text-on-surface mb-1.5">Confirm Password</label>
          <input type="password" value={form.password_confirmation} onChange={set('password_confirmation')}
            className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md" placeholder="Repeat your password" />
        </div>
      </div>
      <button type="submit" disabled={loading} className="w-full py-4 rounded-lg bg-primary text-on-primary font-bold hover:opacity-90 shadow-lg transition-all cursor-pointer disabled:opacity-50">
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
      <p className="text-center text-body-sm text-on-surface-variant">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="text-primary font-bold hover:underline cursor-pointer">Sign In</button>
      </p>
    </form>
  );
}

function OtpForm({ studentId, onVerified }) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) { const t = setTimeout(() => setCooldown(cooldown - 1), 1000); return () => clearTimeout(t); }
  }, [cooldown]);

  const getCsrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) { setError('Please enter a valid 6-digit OTP.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/student/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
        body: JSON.stringify({ student_id: studentId, otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Verification failed.'); setLoading(false); return; }
      onVerified(data.student);
    } catch { setError('Network error. Please check your connection.'); }
    setLoading(false);
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    setError('');
    try {
      const res = await fetch('/student/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
        body: JSON.stringify({ student_id: studentId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed to resend OTP.'); setResending(false); return; }
      setCooldown(60);
    } catch { setError('Network error. Please check your connection.'); }
    setResending(false);
  };

  return (
    <form onSubmit={handleVerify} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/30">
          <p className="text-body-sm text-error flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</p>
        </div>
      )}
      <div>
        <label className="block text-label-md font-bold text-on-surface mb-1.5">OTP Code</label>
        <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md text-center text-2xl tracking-widest"
          placeholder="000000" maxLength={6} autoFocus />
        <p className="text-body-sm text-on-surface-variant mt-2 text-center">Expires in 10 minutes.</p>
      </div>
      <button type="submit" disabled={loading || otp.length !== 6} className="w-full py-4 rounded-lg bg-primary text-on-primary font-bold hover:opacity-90 shadow-lg transition-all cursor-pointer disabled:opacity-50">
        {loading ? 'Verifying...' : 'Verify Email'}
      </button>
      <div className="text-center">
        <button type="button" onClick={handleResend} disabled={resending || cooldown > 0}
          className="text-primary font-bold hover:underline cursor-pointer disabled:opacity-50 text-body-sm">
          {cooldown > 0 ? `Resend OTP (${cooldown}s)` : resending ? 'Resending...' : 'Resend OTP'}
        </button>
      </div>
    </form>
  );
}

export default function StudentAuthModal({ isOpen, defaultTab, onClose, onLoginSuccess }) {
  const [tab, setTab] = useState(defaultTab || 'login');
  const [otpStudentId, setOtpStudentId] = useState(null);

  useEffect(() => { if (defaultTab) setTab(defaultTab); }, [defaultTab]);

  useEffect(() => {
    if (!isOpen) { setTab('login'); setOtpStudentId(null); }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleLoginSuccess = (student) => {
    onLoginSuccess(student);
    onClose();
  };

  const handleLoginNeedsOtp = (student, studentId) => {
    setOtpStudentId(studentId);
    setTab('otp');
  };

  const handleRegistered = (studentId) => {
    setOtpStudentId(studentId);
    setTab('otp');
  };

  const handleOtpVerified = (student) => {
    onLoginSuccess(student);
    onClose();
  };

  if (!isOpen) return null;

  const isLogin = tab === 'login';
  const isRegister = tab === 'register';
  const isOtp = tab === 'otp';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-8" onClick={handleBackdropClick}>
      <div className="animate-[scaleIn_0.2s_ease-out] w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden relative">
          <button onClick={onClose} className="absolute top-5 right-5 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer z-10">
            <X className="w-5 h-5" />
          </button>
          <div className="p-6 md:p-8">
            {!isOtp && (
              <div className="flex gap-1 mb-6 bg-surface-container-high rounded-lg p-1 w-fit mx-auto">
                  <button onClick={() => setTab('login')}
                  className={`px-6 py-2.5 rounded-lg font-label-md text-label-md font-bold transition-all cursor-pointer ${isLogin ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
                  Sign In
                </button>
                <button onClick={() => setTab('register')}
                  className={`px-6 py-2.5 rounded-lg font-label-md text-label-md font-bold transition-all cursor-pointer ${isRegister ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
                  Register
                </button>
              </div>
            )}

            {isLogin && (
              <div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-1">Sign In</h2>
                <p className="text-body-md text-on-surface-variant mb-6">Sign in to manage your credential requests.</p>
                <LoginForm onSuccess={handleLoginSuccess} onSwitchToRegister={() => setTab('register')} onClose={onClose} />
              </div>
            )}

            {isRegister && (
              <div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-1">Create Student Account</h2>
                <p className="text-body-md text-on-surface-variant mb-6">Register to request and manage school credentials securely.</p>
                <RegisterForm onRegistered={handleRegistered} onSwitchToLogin={() => setTab('login')} />
              </div>
            )}

            {isOtp && (
              <div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-1">Verify Email</h2>
                <p className="text-body-md text-on-surface-variant mb-6">Enter the verification code sent to your email.</p>
                <OtpForm studentId={otpStudentId} onVerified={handleOtpVerified} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

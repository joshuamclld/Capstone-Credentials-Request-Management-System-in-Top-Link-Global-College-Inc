import React, { useState, useEffect } from 'react';
import { AlertCircle, Eye, EyeOff, X } from 'lucide-react';

function LoginForm({ onSuccess, onSwitchToRegister, onClose, onForgotPassword }) {
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
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      {error && (
        <div className="p-2.5 sm:p-3 rounded-lg bg-error/10 border border-error/30">
          <p className="text-body-sm text-error flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</p>
        </div>
      )}
      <div>
        <label className="block text-label-md font-bold text-on-surface mb-1">Student Number or Email</label>
        <input type="text" value={login} onChange={(e) => setLogin(e.target.value)}
          className="w-full px-4 py-2 sm:py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
          placeholder="e.g., 2024-00001 or email@example.com" autoFocus />
      </div>
      <div>
        <label className="block text-label-md font-bold text-on-surface mb-1">Password</label>
        <div className="relative">
          <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 sm:py-3 pr-12 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
            placeholder="Enter your password" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer">
            {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>
      <div className="flex justify-end -mt-2 sm:-mt-1">
        <button type="button" onClick={onForgotPassword} className="text-label-sm text-primary/70 hover:text-primary font-medium hover:underline cursor-pointer transition-colors">
          Forgot Password?
        </button>
      </div>
      <button type="submit" disabled={loading} className="w-full py-2.5 sm:py-4 rounded-lg bg-primary text-on-primary font-bold hover:opacity-90 shadow-lg transition-all cursor-pointer disabled:opacity-50">
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      {error && (
        <div className="p-2.5 sm:p-3 rounded-lg bg-error/10 border border-error/30">
          <p className="text-body-sm text-error"><AlertCircle className="w-4 h-4 inline-block mr-1" />{error}</p>
        </div>
      )}
      <div>
        <label className="block text-label-md font-bold text-on-surface mb-1">Student Number</label>
        <input type="text" value={form.student_number} onChange={set('student_number')}
          className="w-full px-4 py-2 sm:py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
          placeholder="e.g., 2024-00001" autoFocus />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-label-md font-bold text-on-surface mb-1">First Name</label>
          <input type="text" value={form.first_name} onChange={set('first_name')}
            className="w-full px-4 py-2 sm:py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md" placeholder="Juan" />
        </div>
        <div>
          <label className="block text-label-md font-bold text-on-surface mb-1">Last Name</label>
          <input type="text" value={form.last_name} onChange={set('last_name')}
            className="w-full px-4 py-2 sm:py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md" placeholder="Dela Cruz" />
        </div>
      </div>
      <div>
        <label className="block text-label-md font-bold text-on-surface mb-1">Email</label>
        <input type="email" value={form.email} onChange={set('email')}
          className="w-full px-4 py-2 sm:py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md" placeholder="juan@example.com" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-label-md font-bold text-on-surface mb-1">Password</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={set('password')}
              className="w-full px-4 py-2 sm:py-3 pr-12 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md" placeholder="Min. 8 characters" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer">
              {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-label-md font-bold text-on-surface mb-1">Confirm Password</label>
          <div className="relative">
            <input type={showConfirmPassword ? 'text' : 'password'} value={form.password_confirmation} onChange={set('password_confirmation')}
              className="w-full px-4 py-2 sm:py-3 pr-12 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md" placeholder="Repeat your password" />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer">
              {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </div>
      <button type="submit" disabled={loading} className="w-full py-2.5 sm:py-4 rounded-lg bg-primary text-on-primary font-bold hover:opacity-90 shadow-lg transition-all cursor-pointer disabled:opacity-50">
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
    <form onSubmit={handleVerify} className="space-y-3 sm:space-y-4">
      {error && (
        <div className="p-2.5 sm:p-3 rounded-lg bg-error/10 border border-error/30">
          <p className="text-body-sm text-error flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</p>
        </div>
      )}
      <div>
        <label className="block text-label-md font-bold text-on-surface mb-1">OTP Code</label>
        <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="w-full px-4 py-2 sm:py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md text-center text-2xl tracking-widest"
          placeholder="000000" maxLength={6} autoFocus />
        <p className="text-body-sm text-on-surface-variant mt-1.5 text-center">Expires in 10 minutes.</p>
      </div>
      <button type="submit" disabled={loading || otp.length !== 6} className="w-full py-2.5 sm:py-4 rounded-lg bg-primary text-on-primary font-bold hover:opacity-90 shadow-lg transition-all cursor-pointer disabled:opacity-50">
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

function ForgotPasswordForm({ onOtpSent, onBackToLogin }) {
  const [login, setLogin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getCsrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!login.trim()) { setError('Please enter your student number or email.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/student/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
        body: JSON.stringify({ login: login.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Request failed.'); setLoading(false); return; }
      onOtpSent(data.student_id, login.trim());
    } catch { setError('Network error. Please check your connection.'); }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      {error && (
        <div className="p-2.5 sm:p-3 rounded-lg bg-error/10 border border-error/30">
          <p className="text-body-sm text-error flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</p>
        </div>
      )}
      <div>
        <label className="block text-label-md font-bold text-on-surface mb-1">Student Number or Email</label>
        <input type="text" value={login} onChange={(e) => setLogin(e.target.value)}
          className="w-full px-4 py-2 sm:py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
          placeholder="e.g., 2024-00001 or email@example.com" autoFocus />
      </div>
      <button type="submit" disabled={loading} className="w-full py-2.5 sm:py-4 rounded-lg bg-primary text-on-primary font-bold hover:opacity-90 shadow-lg transition-all cursor-pointer disabled:opacity-50">
        {loading ? 'Sending...' : 'Send Verification Code'}
      </button>
      <p className="text-center text-body-sm text-on-surface-variant">
        Remember your password?{' '}
        <button type="button" onClick={onBackToLogin} className="text-primary font-bold hover:underline cursor-pointer">Sign In</button>
      </p>
    </form>
  );
}

function ForgotOtpForm({ studentId, login, onVerified, onBack }) {
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
      const res = await fetch('/student/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
        body: JSON.stringify({ student_id: studentId, otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Verification failed.'); setLoading(false); return; }
      onVerified();
    } catch { setError('Network error. Please check your connection.'); }
    setLoading(false);
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    setError('');
    try {
      const res = await fetch('/student/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
        body: JSON.stringify({ login }),
      });
      setResending(false);
    } catch { setResending(false); }
    setCooldown(60);
  };

  return (
    <form onSubmit={handleVerify} className="space-y-3 sm:space-y-4">
      {error && (
        <div className="p-2.5 sm:p-3 rounded-lg bg-error/10 border border-error/30">
          <p className="text-body-sm text-error flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</p>
        </div>
      )}
      <div>
        <label className="block text-label-md font-bold text-on-surface mb-1">OTP Code</label>
        <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="w-full px-4 py-2 sm:py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md text-center text-2xl tracking-widest"
          placeholder="000000" maxLength={6} autoFocus />
        <p className="text-body-sm text-on-surface-variant mt-1.5 text-center">Expires in 10 minutes.</p>
      </div>
      <button type="submit" disabled={loading || otp.length !== 6} className="w-full py-2.5 sm:py-4 rounded-lg bg-primary text-on-primary font-bold hover:opacity-90 shadow-lg transition-all cursor-pointer disabled:opacity-50">
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>
      <div className="text-center">
        <button type="button" onClick={handleResend} disabled={resending || cooldown > 0}
          className="text-primary font-bold hover:underline cursor-pointer disabled:opacity-50 text-body-sm">
          {cooldown > 0 ? `Resend OTP (${cooldown}s)` : resending ? 'Resending...' : 'Resend OTP'}
        </button>
      </div>
      <p className="text-center text-body-sm text-on-surface-variant">
        <button type="button" onClick={onBack} className="text-primary font-bold hover:underline cursor-pointer">Back</button>
      </p>
    </form>
  );
}

function ResetPasswordForm({ studentId, onSuccess, onCancel }) {
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getCsrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !passwordConfirmation) { setError('Please fill in all fields.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== passwordConfirmation) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/student/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
        body: JSON.stringify({
          student_id: studentId,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) { const msgs = Object.values(data.errors).flat(); setError(msgs[0] || 'Validation failed.'); }
        else setError(data.message || 'Reset failed.');
        setLoading(false);
        return;
      }
      onSuccess(data.student);
    } catch { setError('Network error. Please check your connection.'); }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      {error && (
        <div className="p-2.5 sm:p-3 rounded-lg bg-error/10 border border-error/30">
          <p className="text-body-sm text-error flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</p>
        </div>
      )}
      <div>
        <label className="block text-label-md font-bold text-on-surface mb-1">New Password</label>
        <div className="relative">
          <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 sm:py-3 pr-12 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
            placeholder="Min. 8 characters" autoFocus />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer">
            {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-label-md font-bold text-on-surface mb-1">Confirm New Password</label>
        <div className="relative">
          <input type={showConfirm ? 'text' : 'password'} value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)}
            className="w-full px-4 py-2 sm:py-3 pr-12 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
            placeholder="Repeat your new password" />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer">
            {showConfirm ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>
      <button type="submit" disabled={loading} className="w-full py-2.5 sm:py-4 rounded-lg bg-primary text-on-primary font-bold hover:opacity-90 shadow-lg transition-all cursor-pointer disabled:opacity-50">
        {loading ? 'Updating...' : 'Update Password'}
      </button>
      <p className="text-center text-body-sm text-on-surface-variant">
        <button type="button" onClick={onCancel} className="text-primary font-bold hover:underline cursor-pointer">Cancel</button>
      </p>
    </form>
  );
}

export default function StudentAuthModal({ isOpen, defaultTab, onClose, onLoginSuccess }) {
  const [tab, setTab] = useState(defaultTab || 'login');
  const [otpStudentId, setOtpStudentId] = useState(null);
  const [forgotStudentId, setForgotStudentId] = useState(null);
  const [forgotLogin, setForgotLogin] = useState('');

  useEffect(() => { if (defaultTab) setTab(defaultTab); }, [defaultTab]);

  useEffect(() => {
    if (!isOpen) { setTab('login'); setOtpStudentId(null); setForgotStudentId(null); setForgotLogin(''); }
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

  const handleForgotPassword = () => { setTab('forgot'); };

  const handleForgotOtpSent = (studentId, login) => {
    setForgotStudentId(studentId);
    setForgotLogin(login);
    setTab('forgot-otp');
  };

  const handleForgotOtpVerified = () => { setTab('reset'); };

  const handleResetSuccess = (student) => {
    onLoginSuccess(student);
    onClose();
  };

  const handleBackToLogin = () => { setTab('login'); };

  if (!isOpen) return null;

  const isLogin = tab === 'login';
  const isRegister = tab === 'register';
  const isOtp = tab === 'otp';
  const isForgot = tab === 'forgot';
  const isForgotOtp = tab === 'forgot-otp';
  const isReset = tab === 'reset';
  const showTabs = isLogin || isRegister;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-3 py-6" onClick={handleBackdropClick}>
      <div className="animate-[scaleIn_0.2s_ease-out] w-[92%] max-w-sm sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden relative">
          <button onClick={onClose} className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer z-10 rounded-full">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="p-4 sm:p-8">
            {showTabs && (
              <div className="flex gap-1 mb-3 sm:mb-4 bg-surface-container-high rounded-lg p-0.5 w-fit mx-auto">
                <button onClick={() => setTab('login')}
                  className={`px-5 sm:px-6 py-2 rounded-lg font-label-md text-label-md font-bold transition-all cursor-pointer ${isLogin ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
                  Sign In
                </button>
                <button onClick={() => setTab('register')}
                  className={`px-5 sm:px-6 py-2 rounded-lg font-label-md text-label-md font-bold transition-all cursor-pointer ${isRegister ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
                  Register
                </button>
              </div>
            )}

            {isLogin && (
              <div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-0.5">Sign In</h2>
                <p className="text-body-md text-on-surface-variant mb-3 sm:mb-4">Sign in to manage your credential requests.</p>
                <LoginForm onSuccess={handleLoginSuccess} onSwitchToRegister={() => setTab('register')} onClose={onClose} onForgotPassword={handleForgotPassword} />
              </div>
            )}

            {isRegister && (
              <div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-0.5">Create Student Account</h2>
                <p className="text-body-md text-on-surface-variant mb-3 sm:mb-4">Register to request and manage school credentials securely.</p>
                <RegisterForm onRegistered={handleRegistered} onSwitchToLogin={() => setTab('login')} />
              </div>
            )}

            {isOtp && (
              <div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-0.5">Verify Email</h2>
                <p className="text-body-md text-on-surface-variant mb-3 sm:mb-4">Enter the verification code sent to your email.</p>
                <OtpForm studentId={otpStudentId} onVerified={handleOtpVerified} />
              </div>
            )}

            {isForgot && (
              <div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-0.5">Forgot Password</h2>
                <p className="text-body-md text-on-surface-variant mb-3 sm:mb-4">Enter your account details to receive a verification code.</p>
                <ForgotPasswordForm onOtpSent={handleForgotOtpSent} onBackToLogin={handleBackToLogin} />
              </div>
            )}

            {isForgotOtp && (
              <div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-0.5">Verify OTP</h2>
                <p className="text-body-md text-on-surface-variant mb-3 sm:mb-4">Enter the verification code sent to your email.</p>
                <ForgotOtpForm studentId={forgotStudentId} login={forgotLogin} onVerified={handleForgotOtpVerified} onBack={handleBackToLogin} />
              </div>
            )}

            {isReset && (
              <div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-0.5">Reset Password</h2>
                <p className="text-body-md text-on-surface-variant mb-3 sm:mb-4">Choose a new password for your account.</p>
                <ResetPasswordForm studentId={forgotStudentId} onSuccess={handleResetSuccess} onCancel={handleBackToLogin} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

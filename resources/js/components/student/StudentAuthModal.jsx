import React, { useState, useEffect } from 'react';
import { AlertCircle, Eye, EyeOff, X, CheckCircle2 } from 'lucide-react';

function LoginForm({ onSuccess, onClose, onForgotPassword }) {
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
    </form>
  );
}

function ForgotPasswordForm({ onBackToLogin, onLoginSuccess }) {
  const [step, setStep] = useState('login');
  const [login, setLogin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const getCsrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const handleLookup = async (e) => {
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
      if (!res.ok) {
        setError(data.message || 'Account not found.');
        setLoading(false);
        return;
      }
      setStudentId(data.student_id);
      setStudentName(data.student_name);
      setStep('reset');
    } catch { setError('Network error.'); }
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) { setError('Please fill in all fields.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/student/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
        body: JSON.stringify({ student_id: studentId, password, password_confirmation: confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Reset failed.');
        setLoading(false);
        return;
      }
      onLoginSuccess(data.student);
    } catch { setError('Network error.'); }
    setLoading(false);
  };

  if (step === 'reset') {
    return (
      <form onSubmit={handleReset} className="space-y-3 sm:space-y-4">
        {error && (
          <div className="p-2.5 sm:p-3 rounded-lg bg-error/10 border border-error/30">
            <p className="text-body-sm text-error flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</p>
          </div>
        )}
        <div className="bg-primary/10 rounded-lg px-4 py-3 text-center">
          <p className="text-sm text-primary font-bold">{studentName}</p>
        </div>
        <div>
          <label className="block text-label-md font-bold text-on-surface mb-1">New Password</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 sm:py-3 pr-12 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
              placeholder="Enter new password" autoFocus />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer">
              {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-label-md font-bold text-on-surface mb-1">Confirm Password</label>
          <div className="relative">
            <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 sm:py-3 pr-12 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
              placeholder="Confirm new password" />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant cursor-pointer">
              {showConfirm ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full py-2.5 sm:py-4 rounded-lg bg-primary text-on-primary font-bold hover:opacity-90 shadow-lg transition-all cursor-pointer disabled:opacity-50">
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
        <button type="button" onClick={() => { setStep('login'); setError(''); }} className="w-full py-2.5 sm:py-4 rounded-lg border border-outline-variant text-on-surface font-bold hover:bg-surface-container-high transition-all cursor-pointer">
          Back
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleLookup} className="space-y-3 sm:space-y-4">
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
        {loading ? 'Looking up...' : 'Continue'}
      </button>
      <button type="button" onClick={onBackToLogin} className="w-full py-2.5 sm:py-4 rounded-lg border border-outline-variant text-on-surface font-bold hover:bg-surface-container-high transition-all cursor-pointer">
        Back to Sign In
      </button>
    </form>
  );
}

export default function StudentAuthModal({ isOpen, onClose, onLoginSuccess, defaultTab }) {
  const [tab, setTab] = useState(defaultTab || 'login');

  useEffect(() => {
    if (isOpen && defaultTab) setTab(defaultTab);
  }, [isOpen, defaultTab]);

  useEffect(() => {
    if (!isOpen) { setTab('login'); }
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

  const handleForgotPassword = () => { setTab('forgot'); };
  const handleBackToLogin = () => { setTab('login'); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-3 py-6" onClick={handleBackdropClick}>
      <div className="animate-[scaleIn_0.2s_ease-out] w-[92%] max-w-sm sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden relative">
          <button onClick={onClose} className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer z-10 rounded-full">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="p-4 sm:p-8">

            {tab === 'login' && (
              <div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-0.5">Sign In</h2>
                <p className="text-body-md text-on-surface-variant mb-3 sm:mb-4">Sign in to manage your credential requests.</p>
                <LoginForm onSuccess={handleLoginSuccess} onClose={onClose} onForgotPassword={handleForgotPassword} />
              </div>
            )}

            {tab === 'forgot' && (
              <div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-0.5">Forgot Password</h2>
                <p className="text-body-md text-on-surface-variant mb-3 sm:mb-4">Enter your student number or email to reset your password.</p>
                <ForgotPasswordForm onBackToLogin={handleBackToLogin} onLoginSuccess={handleLoginSuccess} />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

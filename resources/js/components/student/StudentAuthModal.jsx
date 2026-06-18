import React, { useState, useEffect } from 'react';
import { AlertCircle, Eye, EyeOff, X } from 'lucide-react';

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

export default function StudentAuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [tab, setTab] = useState('login');
  const [forgotStudentId, setForgotStudentId] = useState(null);
  const [forgotLogin, setForgotLogin] = useState('');

  useEffect(() => {
    if (!isOpen) { setTab('login'); setForgotStudentId(null); setForgotLogin(''); }
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
  const isForgot = tab === 'forgot';
  const isForgotOtp = tab === 'forgot-otp';
  const isReset = tab === 'reset';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-3 py-6" onClick={handleBackdropClick}>
      <div className="animate-[scaleIn_0.2s_ease-out] w-[92%] max-w-sm sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden relative">
          <button onClick={onClose} className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer z-10 rounded-full">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="p-4 sm:p-8">

            {isLogin && (
              <div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-0.5">Sign In</h2>
                <p className="text-body-md text-on-surface-variant mb-3 sm:mb-4">Sign in to manage your credential requests.</p>
                <LoginForm onSuccess={handleLoginSuccess} onClose={onClose} onForgotPassword={handleForgotPassword} />
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

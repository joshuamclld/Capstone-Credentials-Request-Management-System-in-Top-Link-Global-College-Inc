import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import StudentAuthLayout from './student/StudentAuthLayout';
import StudentAuthWindow from './student/StudentAuthWindow';

export default function StudentOtpVerify({ onNavigate, onLoginSuccess }) {
  const [otp, setOtp] = useState('');
  const [studentId, setStudentId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('student_id');
    if (sid) setStudentId(sid);
  }, []);

  useEffect(() => {
    if (cooldown > 0) { const t = setTimeout(() => setCooldown(cooldown - 1), 1000); return () => clearTimeout(t); }
  }, [cooldown]);

  const getCsrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) { setError('Please enter a valid 6-digit OTP.'); return; }
    if (!studentId) { setError('Session expired. Please register again.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/student/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
        body: JSON.stringify({ student_id: Number(studentId), otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Verification failed.'); setLoading(false); return; }
      if (onLoginSuccess) onLoginSuccess(data.student);
    } catch { setError('Network error. Please check your connection.'); }
    setLoading(false);
  };

  const handleResend = async () => {
    if (!studentId || cooldown > 0) return;
    setResending(true);
    setError('');
    try {
      const res = await fetch('/student/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
        body: JSON.stringify({ student_id: Number(studentId) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed to resend OTP.'); setResending(false); return; }
      setCooldown(60);
    } catch { setError('Network error. Please check your connection.'); }
    setResending(false);
  };

  const handleOtpChange = (e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));

  return (
    <StudentAuthLayout onNavigate={onNavigate}>
      <StudentAuthWindow title="Verify Email" subtitle="Enter the verification code sent to your email.">
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-error/10 border border-error/30">
            <p className="text-body-sm text-error flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</p>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="block text-label-md font-bold text-on-surface mb-1.5">OTP Code</label>
            <input
              type="text"
              value={otp}
              onChange={handleOtpChange}
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-center text-2xl tracking-widest"
              placeholder="000000"
              maxLength={6}
              autoFocus
            />
            <p className="text-body-sm text-on-surface-variant mt-2 text-center">Expires in 10 minutes.</p>
          </div>

          <button type="submit" disabled={loading || otp.length !== 6} className="w-full py-3 rounded-xl font-label-md text-label-md font-bold text-on-primary bg-primary hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50">
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="text-center mt-5">
          <button type="button" onClick={handleResend} disabled={resending || cooldown > 0}
            className="text-primary font-bold hover:underline cursor-pointer disabled:opacity-50 text-body-sm">
            {cooldown > 0 ? `Resend OTP (${cooldown}s)` : resending ? 'Resending...' : 'Resend OTP'}
          </button>
        </div>
      </StudentAuthWindow>
    </StudentAuthLayout>
  );
}

import React, { useState, useEffect } from 'react';
import { RefreshCw, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import { cashierSidebarItems } from '../config/sidebarItems';
import ProtectedImage from '../../ui/ProtectedImage';

export default function CashierSettings({ user, onLogout, onNavigate }) {
  const [qrUrl, setQrUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineEnabled, setOnlineEnabled] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchQr = () => {
    fetch('/admin/payment-qr')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.qr_url) setQrUrl(data.qr_url);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchOnlineStatus = () => {
    fetch('/admin/cashier/online-payment-status')
      .then(res => res.json())
      .then(data => {
        if (data.success) setOnlineEnabled(data.enabled);
      })
      .catch(() => {});
  };

  useEffect(() => { fetchQr(); fetchOnlineStatus(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append('qr_image', file);
    try {
      const res = await fetch('/admin/payment-qr', {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ type: 'error', text: data.message || 'Upload failed.' });
      } else {
        setQrUrl(data.qr_url);
        setMessage({ type: 'success', text: 'Payment QR updated.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error.' });
    }
    setUploading(false);
  };

  const handleToggle = async () => {
    setToggling(true);
    setMessage(null);
    const newVal = !onlineEnabled;
    try {
      const res = await fetch('/admin/cashier/online-payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') },
        body: JSON.stringify({ enabled: newVal }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ type: 'error', text: data.message || 'Update failed.' });
      } else {
        setOnlineEnabled(data.enabled);
        setMessage({ type: 'success', text: data.enabled ? 'Online payment is now available to students.' : 'Online payment is now disabled.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error.' });
    }
    setToggling(false);
  };

  return (
    <DashboardLayout title="Payment Settings" subtitle="Manage online payment settings and the school's payment QR code." sidebarItems={cashierSidebarItems} currentUser={user} roleLabel="Cashier / Accounting" onLogout={onLogout} onNavigate={onNavigate}>
      <div className="max-w-lg mx-auto space-y-5">
        {message && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <p>{message.text}</p>
          </div>
        )}

        {/* Online Payment Toggle */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">Online Payment Toggle</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enable or disable the online payment option for students.</p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
              <div>
                <span className="text-sm font-bold text-slate-900">Online Payment</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${onlineEnabled ? 'bg-emerald-500' : 'bg-red-400'}`} />
                  <span className={`text-xs font-semibold ${onlineEnabled ? 'text-emerald-700' : 'text-red-600'}`}>
                    {onlineEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={onlineEnabled}
                onClick={handleToggle}
                disabled={toggling}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2 ${onlineEnabled ? 'bg-emerald-700' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${onlineEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Payment QR Code */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">Payment QR Code</h2>
            <p className="text-xs text-slate-500 mt-0.5">Upload a QR code image (GCash / Maya) that students scan when they select online payment.</p>
          </div>
          <div className="p-6 space-y-4">
            {loading ? (
              <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
            ) : qrUrl ? (
              <div className="space-y-3">
                <div className="flex justify-center p-4 bg-white border border-slate-200 rounded-xl">
                  <ProtectedImage src={qrUrl} alt="Payment QR" className="w-48 h-48 object-contain" />
                </div>
                <p className="text-xs text-emerald-700 font-medium text-center">Current QR code</p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-sm text-slate-500">No QR code uploaded yet.</p>
              </div>
            )}

            <div>
              <label className="block">
                <span className="text-xs font-medium text-slate-600 block mb-1.5">Upload New QR:</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer disabled:opacity-50"
                />
              </label>
              {uploading && <p className="text-xs text-emerald-700 mt-2 flex items-center gap-1.5"><RefreshCw className="w-3 h-3 animate-spin" /> Uploading...</p>}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

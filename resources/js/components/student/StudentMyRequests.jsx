import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import StudentDashboardLayout from './StudentDashboardLayout';
import { getRequestStatusConfig, getPaymentStatusConfig } from '../../utils/statusConfig';

export default function StudentMyRequests({ student, onLogout, onNavigate, currentPath }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelError, setCancelError] = useState('');
  const [claiming, setClaiming] = useState(null);

  const getCsrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  useEffect(() => {
    fetch('/student/api/requests', {
      headers: { 'Accept': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setRequests(data.requests);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Re-fetch when tab gains focus
  useEffect(() => {
    const onFocus = () => {
      fetch('/student/api/requests', {
        headers: { 'Accept': 'application/json' },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) setRequests(data.requests);
        })
        .catch(() => {});
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleCancelClick = (req) => {
    setCancelError('');
    setCancelModal(req);
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal) return;
    setCancelling(cancelModal.tracking_number);
    setCancelError('');
    try {
      const res = await fetch(`/requests/${encodeURIComponent(cancelModal.tracking_number)}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrf(),
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setCancelError(data.message || 'Failed to cancel request.');
        setCancelling(null);
        return;
      }
      setRequests(prev => prev.map(r =>
        r.tracking_number === cancelModal.tracking_number ? { ...r, status: 'Cancelled' } : r
      ));
      setCancelModal(null);
    } catch {
      setCancelError('Network error.');
    }
    setCancelling(null);
  };

  const handleClaim = async (req) => {
    if (claiming) return;
    setClaiming(req.tracking_number);
    try {
      const res = await fetch(`/requests/${encodeURIComponent(req.tracking_number)}/claim`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrf(),
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(prev => prev.map(r =>
          r.tracking_number === req.tracking_number ? { ...r, status: 'Claimed' } : r
        ));
      }
    } catch {
      // ignore
    }
    setClaiming(null);
  };

  const canCancel = (req) => {
    if (req.status !== 'Pending') return false;
    if (req.payment_method === 'online' && req.payment_status === 'paid') return false;
    return true;
  };

  return (
    <>
      <StudentDashboardLayout title="My Requests" subtitle="View and manage all your credential requests." student={student} onLogout={onLogout} onNavigate={onNavigate} currentPath={currentPath}>
        <div className="max-w-container-max mx-auto">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-surface-container-high rounded-xl animate-pulse" />)}
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-10 text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-3">inbox</span>
              <p className="text-body-lg text-on-surface-variant mb-2">No requests found.</p>
              <button onClick={() => onNavigate('/request')} className="text-label-sm font-bold text-primary hover:underline cursor-pointer">
                Submit your first request
              </button>
            </div>
          ) : (
            <>
              <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tracking No.</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Documents</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {requests.map(req => (
                        <tr key={req.tracking_number} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs font-medium text-emerald-700">{req.tracking_number}</td>
                          <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate" title={(req.documents || []).join(', ')}>{(req.documents || []).join(', ')}</td>
                          <td className="px-4 py-3"><span className={`text-xs font-bold px-2.5 py-1 rounded border ${getRequestStatusConfig(req.status).className}`}>{req.status}</span></td>
                          <td className="px-4 py-3"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getPaymentStatusConfig(req.payment_status).className}`}>{getPaymentStatusConfig(req.payment_status).label}</span></td>
                          <td className="px-4 py-3 text-xs text-slate-500">{req.created_at}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">₱{Number(req.total_fee).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => onNavigate(`/student/requests/${req.tracking_number}`)}
                                className="px-2.5 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                              >
                                View
                              </button>
                              {canCancel(req) && (
                                <button
                                  onClick={() => handleCancelClick(req)}
                                  disabled={cancelling === req.tracking_number}
                                  className="px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                                >
                                  {cancelling === req.tracking_number ? '...' : 'Cancel'}
                                </button>
                              )}
                              {req.status === 'Ready for Release' && (
                                <button
                                  onClick={() => handleClaim(req)}
                                  disabled={claiming === req.tracking_number}
                                  className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                                >
                                  {claiming === req.tracking_number ? '...' : 'Claim'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="md:hidden space-y-3">
                {requests.map(req => (
                  <div key={req.tracking_number} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="text-xs font-bold text-emerald-700 font-mono leading-tight">{req.tracking_number}</div>
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getRequestStatusConfig(req.status).className}`}>{req.status}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getPaymentStatusConfig(req.payment_status).className}`}>{getPaymentStatusConfig(req.payment_status).label}</span>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 mb-2.5">{(req.documents || []).join(', ')}</div>
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500">Date</span>
                        <span className="text-xs text-slate-800 text-right">{req.created_at}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500">Fee</span>
                        <span className="text-xs font-medium text-emerald-700 text-right">₱{Number(req.total_fee).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100">
                      <button
                        onClick={() => onNavigate(`/student/requests/${req.tracking_number}`)}
                        className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
                      >
                        View Details
                      </button>
                      {canCancel(req) && (
                        <button
                          onClick={() => handleCancelClick(req)}
                          disabled={cancelling === req.tracking_number}
                          className="flex-1 py-2.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {cancelling === req.tracking_number ? '...' : 'Cancel'}
                        </button>
                      )}
                      {req.status === 'Ready for Release' && (
                        <button
                          onClick={() => handleClaim(req)}
                          disabled={claiming === req.tracking_number}
                          className="flex-1 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {claiming === req.tracking_number ? '...' : 'Claim'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </StudentDashboardLayout>

      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={() => !cancelling && setCancelModal(null)}>
          <div className="bg-surface rounded-2xl shadow-xl border border-outline-variant w-full max-w-md p-4 sm:p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-headline-sm font-bold text-on-surface mb-2">Confirm Cancellation</h3>
            <p className="text-body-sm sm:text-body-md text-on-surface-variant mb-4 sm:mb-6">Are you sure you want to cancel this request? This action cannot be undone.</p>

            {cancelError && (
              <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/30">
                <p className="text-body-sm text-error flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {cancelError}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setCancelModal(null)}
                disabled={cancelling}
                className="px-5 py-2.5 rounded-lg font-label-md text-label-md font-bold text-on-surface-variant bg-surface-container-high hover:bg-surface-container-higher transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="px-5 py-2.5 rounded-lg font-label-md text-label-md font-bold text-on-primary bg-red-600 hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

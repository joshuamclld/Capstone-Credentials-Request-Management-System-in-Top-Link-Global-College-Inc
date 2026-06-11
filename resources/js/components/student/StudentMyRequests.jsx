import React, { useState, useEffect } from 'react';
import { AlertCircle, XCircle } from 'lucide-react';
import StudentDashboardLayout from './StudentDashboardLayout';

const STATUS_BADGES = {
  'Pending': 'bg-amber-100 text-amber-800 border-amber-300',
  'Processing': 'bg-blue-100 text-blue-800 border-blue-300',
  'Ready for Release': 'bg-purple-100 text-purple-800 border-purple-300',
  'Claimed': 'bg-slate-200 text-slate-700 border-slate-300',
  'Cancelled': 'bg-red-100 text-red-800 border-red-200',
};

const PAYMENT_BADGES = {
  unpaid: 'bg-red-50 text-red-700 border-red-200',
  pending_payment: 'bg-amber-50 text-amber-700 border-amber-200',
  pending_verification: 'bg-orange-50 text-orange-700 border-orange-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function StudentMyRequests({ student, onLogout, onNavigate, currentPath }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelError, setCancelError] = useState('');
  const [continueLoading, setContinueLoading] = useState(null);
  const [continueError, setContinueError] = useState('');

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

  // Re-fetch when tab gains focus (e.g. returning from PayMongo) and auto-sync payments
  useEffect(() => {
    const onFocus = () => {
      fetch('/student/api/requests', {
        headers: { 'Accept': 'application/json' },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setRequests(data.requests);
            // Auto-sync unpaid online requests with checkout IDs
            data.requests.forEach(req => {
              if (req.payment_method === 'online' && req.payment_status !== 'paid' && req.paymongo_checkout_id) {
                fetch(`/requests/${encodeURIComponent(req.tracking_number)}/verify-payment`, {
                  headers: { 'Accept': 'application/json' },
                })
                  .then(res => res.json())
                  .then(syncData => {
                    if (syncData.success && syncData.payment_status === 'paid') {
                      setRequests(prev => prev.map(r =>
                        r.tracking_number === req.tracking_number ? { ...r, payment_status: 'paid' } : r
                      ));
                    }
                  })
                  .catch(() => {});
              }
            });
          }
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

  const handleContinuePayment = async (req) => {
    if (continueLoading) return;
    setContinueLoading(req.tracking_number);
    setContinueError('');
    try {
      const res = await fetch(`/requests/${encodeURIComponent(req.tracking_number)}/continue-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrf(),
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setContinueError(data.message || 'Failed to initiate payment.');
        setContinueLoading(null);
        return;
      }
      if (data.already_paid) {
        setRequests(prev => prev.map(r =>
          r.tracking_number === req.tracking_number ? { ...r, payment_status: 'paid' } : r
        ));
        setContinueLoading(null);
        return;
      }
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }
      setContinueError('No checkout URL returned.');
      setContinueLoading(null);
    } catch {
      setContinueError('Network error. Please try again.');
      setContinueLoading(null);
    }
  };

  const canCancel = (req) => {
    if (req.status !== 'Pending') return false;
    if (req.payment_method === 'online' && req.payment_status === 'paid') return false;
    return true;
  };

  const showContinuePayment = (req) => {
    return req.payment_method === 'online'
      && req.payment_status !== 'paid'
      && req.status !== 'Cancelled';
  };

  return (
    <>
      <StudentDashboardLayout title="My Requests" subtitle="View and manage all your credential requests." student={student} onLogout={onLogout} onNavigate={onNavigate} currentPath={currentPath}>
        <div className="max-w-container-max mx-auto">
          {continueError && (
            <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/30">
              <p className="text-body-sm text-error">{continueError}</p>
            </div>
          )}
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
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.tracking_number} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 sm:p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="font-bold text-body-md text-on-surface truncate">{req.documents.join(', ')}</p>
                      <p className="text-label-sm text-on-surface-variant">{req.tracking_number}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-label-sm font-bold px-2.5 py-1 rounded-full border ${STATUS_BADGES[req.status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                        {req.status}
                      </span>
                      <span className={`text-label-sm font-bold px-2.5 py-1 rounded-full border ${PAYMENT_BADGES[req.payment_status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                        {{ unpaid: 'Unpaid', pending_payment: 'Pending Payment', pending_verification: 'Pending Verification', paid: 'Paid' }[req.payment_status] || req.payment_status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-body-sm">
                    <div>
                      <span className="text-on-surface-variant">Date:</span>
                      <span className="font-medium text-on-surface ml-1">{req.created_at}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant">Fee:</span>
                      <span className="font-medium text-primary ml-1">₱{Number(req.total_fee).toFixed(2)}</span>
                    </div>
                    {req.semesters && req.semesters.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-on-surface-variant">Semesters:</span>
                        <span className="font-medium text-on-surface ml-1">{req.semesters.join(', ')}</span>
                      </div>
                    )}
                    {req.pages && (
                      <div>
                        <span className="text-on-surface-variant">Pages:</span>
                        <span className="font-medium text-on-surface ml-1">{req.pages}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-outline-variant flex-nowrap">
                    <button
                      onClick={() => onNavigate(`/student/requests/${req.tracking_number}`)}
                      className="px-3 sm:px-4 py-2 sm:py-2 rounded-lg bg-primary text-on-primary font-bold text-label-sm hover:opacity-90 transition-all cursor-pointer whitespace-nowrap"
                    >
                      View Details
                    </button>
                    {canCancel(req) && (
                      <button
                        onClick={() => handleCancelClick(req)}
                        disabled={cancelling === req.tracking_number}
                        className="px-3 sm:px-4 py-2 sm:py-2 rounded-lg text-red-700 bg-red-50 border border-red-200 font-bold text-label-sm hover:bg-red-100 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                      >
                        {cancelling === req.tracking_number ? 'Cancelling...' : 'Cancel Request'}
                      </button>
                    )}
                    {showContinuePayment(req) && (
                      <button
                        onClick={() => handleContinuePayment(req)}
                        disabled={continueLoading === req.tracking_number}
                        className="px-3 sm:px-4 py-2 sm:py-2 rounded-lg text-amber-700 bg-amber-50 border border-amber-200 font-bold text-label-sm hover:bg-amber-100 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                      >
                        {continueLoading === req.tracking_number ? 'Processing...' : 'Continue Payment'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
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

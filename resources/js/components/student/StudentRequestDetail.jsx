import React, { useState, useEffect } from 'react';
import { FileText, BadgeCheck, Clock, PackageCheck, CheckCheck, AlertCircle, XCircle, ArrowLeft } from 'lucide-react';
import StudentDashboardLayout from './StudentDashboardLayout';

const STATUS_LABELS = {
  'Pending': { label: 'Pending', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
  'Processing': { label: 'Processing', bg: 'bg-blue-100 text-blue-800 border-blue-300' },
  'Ready for Release': { label: 'Ready for Release', bg: 'bg-purple-100 text-purple-800 border-purple-300' },
  'Claimed': { label: 'Claimed', bg: 'bg-slate-200 text-slate-700 border-slate-300' },
  'Cancelled': { label: 'Cancelled', bg: 'bg-red-100 text-red-800 border-red-200' },
};

const PAYMENT_LABELS = {
  unpaid: { label: 'Unpaid', bg: 'bg-red-50 text-red-700 border-red-200' },
  pending_payment: { label: 'Pending Payment', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  pending_verification: { label: 'Pending Verification', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
  paid: { label: 'Paid', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const TIMELINE_ICONS = [FileText, BadgeCheck, Clock, PackageCheck, CheckCheck, XCircle];

function getBadge(status, payment_status) {
  if (status === 'Cancelled') return STATUS_LABELS['Cancelled'];
  if (status === 'Pending' && payment_status === 'paid') return { label: 'Paid — Awaiting Processing', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  if (status === 'Pending') return STATUS_LABELS['Pending'];
  if (status === 'Processing') return STATUS_LABELS['Processing'];
  if (status === 'Ready for Release') return STATUS_LABELS['Ready for Release'];
  if (status === 'Claimed') return STATUS_LABELS['Claimed'];
  return STATUS_LABELS['Pending'];
}

function buildTimeline(status, payment_status) {
  if (status === 'Cancelled') {
    return [
      { step: 'Request Submitted', desc: 'Your application was successfully received.', done: true, active: false },
      { step: 'Cancelled', desc: 'This request has been cancelled.', done: true, active: true },
    ];
  }

  const checks = [
    () => true,
    () => payment_status === 'paid',
    () => ['Processing', 'Ready for Release', 'Claimed'].includes(status),
    () => ['Ready for Release', 'Claimed'].includes(status),
    () => status === 'Claimed',
  ];

  const steps = [
    { step: 'Request Submitted', desc: 'Your application was successfully received by the Registrar\'s Office.', key: 'submitted' },
    { step: 'Payment Verified', desc: 'Your processing fee has been confirmed.', key: 'payment' },
    { step: 'Currently Processing', desc: 'The Registrar is now preparing and verifying your academic records.', key: 'processing' },
    { step: 'Ready for Release', desc: 'Your document is prepared and certified, ready for release.', key: 'ready' },
    { step: 'Claimed', desc: 'Document released to student.', key: 'claimed' },
  ];

  const activeIndex = (() => {
    const idx = checks.findIndex((check) => !check());
    return idx === -1 ? steps.length - 1 : idx;
  })();

  return steps.map((s, i) => ({
    ...s,
    done: checks[i](),
    active: i === activeIndex,
  }));
}

export default function StudentRequestDetail({ student, onLogout, onNavigate, currentPath, trackingNumber }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelModalError, setCancelModalError] = useState('');
  const [continueLoading, setContinueLoading] = useState(false);

  const getCsrfToken = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const fetchRequest = React.useCallback(() => {
    if (!trackingNumber) return Promise.resolve(null);
    return fetch(`/requests/${encodeURIComponent(trackingNumber)}`, {
      headers: { 'Accept': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRequest(data.request);
          return data.request;
        }
        return null;
      })
      .catch(() => null);
  }, [trackingNumber]);

  const syncPayment = React.useCallback((req) => {
    if (!req || req.payment_status === 'paid' || !req.paymongo_checkout_id) return;
    fetch(`/requests/${encodeURIComponent(trackingNumber)}/verify-payment`, {
      headers: { 'Accept': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.payment_status === 'paid') {
          setRequest(prev => prev ? { ...prev, payment_status: 'paid' } : prev);
        }
      })
      .catch(() => {});
  }, [trackingNumber]);

  useEffect(() => {
    if (!trackingNumber) return;
    setLoading(true);
    setError('');
    fetchRequest().then(req => {
      setLoading(false);
      if (req) syncPayment(req);
      else setError('Request not found.');
    });
  }, [trackingNumber]);

  // Re-fetch when tab gains focus (e.g. returning from PayMongo)
  useEffect(() => {
    const onFocus = () => {
      if (!trackingNumber) return;
      fetchRequest().then(req => { if (req) syncPayment(req); });
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [trackingNumber]);

  const handleCancelClick = () => {
    setCancelModalError('');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!request) return;
    setCancelling(true);
    setCancelModalError('');
    try {
      const res = await fetch(`/requests/${encodeURIComponent(request.tracking_number)}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setCancelModalError(data.message || 'Failed to cancel request.');
        setCancelling(false);
        return;
      }
      setShowCancelModal(false);
      const searchRes = await fetch(`/requests/${encodeURIComponent(request.tracking_number)}`, {
        headers: { 'Accept': 'application/json' },
      });
      const searchData = await searchRes.json();
      if (searchData.success) setRequest(searchData.request);
    } catch {
      setCancelModalError('Network error.');
    }
    setCancelling(false);
  };

  const handleCancelModalClose = () => {
    if (cancelling) return;
    setShowCancelModal(false);
    setCancelModalError('');
  };

  const handleContinuePayment = async () => {
    if (!request || continueLoading) return;
    setContinueLoading(true);
    try {
      const res = await fetch(`/requests/${encodeURIComponent(request.tracking_number)}/continue-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setContinueLoading(false);
        return;
      }
      if (data.already_paid) {
        // Re-fetch request to sync with server state
        const refetch = await fetch(`/requests/${encodeURIComponent(request.tracking_number)}`, {
          headers: { 'Accept': 'application/json' },
        });
        const refetchData = await refetch.json();
        if (refetchData.success) setRequest(refetchData.request);
        setContinueLoading(false);
        return;
      }
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }
    } catch {
      // ignore
    }
    setContinueLoading(false);
  };

  const timeline = request ? buildTimeline(request.status, request.payment_status) : [];

  return (
    <StudentDashboardLayout title="Request Details" subtitle={trackingNumber || ''} student={student} onLogout={onLogout} onNavigate={onNavigate} currentPath={currentPath}>
      <div className="max-w-container-max mx-auto">
        <button
          onClick={() => onNavigate('/student/requests')}
          className="flex items-center gap-2 text-label-sm font-bold text-primary hover:underline mb-4 sm:mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Requests
        </button>

        {loading ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-6 bg-surface-container-high rounded animate-pulse" />)}
            </div>
          </div>
        ) : error ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-error" />
              <p className="text-body-md text-error">{error}</p>
            </div>
            <button onClick={() => onNavigate('/student/requests')} className="text-label-sm font-bold text-primary hover:underline cursor-pointer">
              Back to My Requests
            </button>
          </div>
        ) : request ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop animate-fade-in-up">
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 sm:p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Reference Number</span>
                    <h3 className="font-headline-sm text-headline-sm text-primary mt-1">{request.tracking_number}</h3>
                  </div>
                  {(() => {
                    const s = getBadge(request.status, request.payment_status);
                    return (
                      <span className={`${s.bg} px-3 py-1.5 rounded-full text-xs font-bold border shrink-0`}>
                        {s.label}
                      </span>
                    );
                  })()}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between border-b border-outline-variant pb-2">
                    <span className="text-on-surface-variant font-medium">Student:</span>
                    <span className="font-bold text-on-surface">{request.student_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-outline-variant pb-2">
                    <span className="text-on-surface-variant font-medium">Document(s):</span>
                    <span className="font-bold text-on-surface text-right">{(request.documents || []).join(', ')}</span>
                  </div>
                  {request.semesters && request.semesters.length > 0 && (
                    <div className="flex justify-between border-b border-outline-variant pb-2">
                      <span className="text-on-surface-variant font-medium">Semester(s):</span>
                      <span className="font-bold text-on-surface text-right">{request.semesters.join(', ')}</span>
                    </div>
                  )}
                  {request.pages && (
                    <div className="flex justify-between border-b border-outline-variant pb-2">
                      <span className="text-on-surface-variant font-medium">Pages:</span>
                      <span className="font-bold text-on-surface text-right">{request.pages}</span>
                    </div>
                  )}
                  {request.year_level && (
                    <div className="flex justify-between border-b border-outline-variant pb-2">
                      <span className="text-on-surface-variant font-medium">Year Level:</span>
                      <span className="font-bold text-on-surface text-right">{request.year_level}</span>
                    </div>
                  )}
                  {request.section && (
                    <div className="flex justify-between border-b border-outline-variant pb-2">
                      <span className="text-on-surface-variant font-medium">Section:</span>
                      <span className="font-bold text-on-surface text-right">{request.section}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-b border-outline-variant pb-2">
                    <span className="text-on-surface-variant font-medium">Request Date:</span>
                    <span className="font-bold text-on-surface">{request.created_at}</span>
                  </div>
                  <div className="flex justify-between border-b border-outline-variant pb-2">
                    <span className="text-on-surface-variant font-medium">Processing Time:</span>
                    <span className="font-bold text-on-surface">{request.processing_days} Working Day(s)</span>
                  </div>
                  {request.remarks && (
                    <div className="flex justify-between border-b border-outline-variant pb-2">
                      <span className="text-on-surface-variant font-medium">Remarks:</span>
                      <span className="font-bold text-on-surface text-right">{request.remarks}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-b border-outline-variant pb-2">
                    <span className="text-on-surface-variant font-medium">Payment Method:</span>
                    <span className="font-bold text-on-surface">{request.payment_method === 'cash' ? 'Cash Payment' : request.payment_method === 'online' ? 'Online Payment' : request.payment_method}</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-on-surface-variant font-medium">Payment Status:</span>
                    {(() => {
                      const p = PAYMENT_LABELS[request.payment_status];
                      return p ? <span className={`${p.bg} px-2 py-0.5 rounded text-xs font-bold border`}>{p.label}</span>
                        : <span className="font-bold text-on-surface">{request.payment_status}</span>;
                    })()}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t-2 border-primary/20 flex justify-between items-center">
                  <span className="font-headline-sm text-lg font-bold text-on-surface">Total Processing Fee:</span>
                  <span className="text-2xl font-bold text-primary">₱ {(Number(request.total_fee) || 0).toFixed(2)}</span>
                </div>

                <div className="mt-6 pt-4 border-t border-outline-variant flex gap-2 justify-end flex-nowrap">
                  {request.status === 'Pending' && request.payment_status !== 'paid' && (
                    <button
                      onClick={handleCancelClick}
                      disabled={cancelling}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <XCircle className="w-4 h-4" />
                      {cancelling ? 'Cancelling...' : 'Cancel Request'}
                    </button>
                  )}
                  {request.payment_method === 'online' && request.payment_status !== 'paid' && request.status !== 'Cancelled' && (
                    <button
                      onClick={() => handleContinuePayment(request)}
                      disabled={continueLoading}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {continueLoading ? 'Processing...' : 'Continue Payment'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-surface-container-high border border-outline-variant rounded-2xl p-4 sm:p-6 h-full">
                <div className="mb-4 sm:mb-6">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">Request Journey</h3>
                  <p className="text-label-md text-on-surface-variant">
                    Reference: <span className="font-bold text-primary">{request.tracking_number}</span>
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  {timeline.map((item, index) => {
                    const isLast = index === timeline.length - 1;
                    const IconComponent = TIMELINE_ICONS[index];
                    return (
                      <div key={item.key || index} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.done
                              ? request.status === 'Cancelled' && index === timeline.length - 1
                                ? 'bg-red-500 text-white shadow-sm'
                                : 'bg-primary text-on-primary shadow-sm'
                              : item.active
                                ? 'bg-primary/10 text-primary ring-4 ring-primary/20'
                                : 'bg-surface-container-low text-on-surface-variant border border-outline-variant'
                            }`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          {!isLast && (
                            <div className={`w-px grow min-h-[24px] ${item.done
                                ? request.status === 'Cancelled'
                                  ? 'bg-red-300'
                                  : 'bg-primary/30'
                                : 'border-l border-dashed border-outline-variant'
                              }`}></div>
                          )}
                        </div>

                        <div className={`pb-4 pt-0.5 ${!item.done && !item.active ? 'opacity-40' : ''}`}>
                          <p className={`text-sm font-bold leading-tight ${item.done
                              ? request.status === 'Cancelled' && index === timeline.length - 1
                                ? 'text-red-600'
                                : 'text-primary'
                              : item.active ? 'text-primary' : 'text-on-surface'
                            }`}>
                            {item.step}
                          </p>
                          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={handleCancelModalClose}>
          <div className="bg-surface rounded-2xl shadow-xl border border-outline-variant w-full max-w-md p-4 sm:p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-headline-sm font-bold text-on-surface mb-2">Confirm Cancellation</h3>
            <p className="text-body-sm sm:text-body-md text-on-surface-variant mb-4 sm:mb-6">Are you sure you want to cancel this request? This action cannot be undone.</p>

            {cancelModalError && (
              <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/30">
                <p className="text-body-sm text-error flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {cancelModalError}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelModalClose}
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
    </StudentDashboardLayout>
  );
}

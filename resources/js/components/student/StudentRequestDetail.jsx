import React, { useState, useEffect, useCallback } from 'react';
import { FileText, BadgeCheck, Clock, PackageCheck, CheckCheck, AlertCircle, XCircle, ArrowLeft } from 'lucide-react';
import StudentDashboardLayout from './StudentDashboardLayout';
import RegistrarRemarksCard from './RegistrarRemarksCard';
import { getPaymentStatusConfig, getBadge, buildTimeline } from '../../utils/statusConfig';
import ProtectedImage from '../ui/ProtectedImage';

const TIMELINE_ICONS = [FileText, BadgeCheck, Clock, PackageCheck, CheckCheck, XCircle];

export default function StudentRequestDetail({ student, onLogout, onNavigate, currentPath, trackingNumber }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelModalError, setCancelModalError] = useState('');
  const [proofUploading, setProofUploading] = useState(false);
  const [proofError, setProofError] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState(null);
  const [showConfirmUpload, setShowConfirmUpload] = useState(false);
  const [proofModalUrl, setProofModalUrl] = useState(null);
  const [paymentQrUrl, setPaymentQrUrl] = useState(null);

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

  useEffect(() => {
    if (!trackingNumber) return;
    setLoading(true);
    setError('');
    fetchRequest().then(req => {
      setLoading(false);
      if (!req) setError('Request not found.');
    });

    const interval = setInterval(fetchRequest, 10000);
    return () => clearInterval(interval);
  }, [trackingNumber, fetchRequest]);

  useEffect(() => {
    if (!request || request.payment_method !== 'online') return;
    fetch('/admin/payment-qr')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.qr_url) setPaymentQrUrl(data.qr_url);
      })
      .catch(() => {});
  }, [request]);

  const handleUploadProof = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setProofError('File too large. Maximum size is 10MB.');
      return;
    }
    setPendingFile(file);
    setPendingPreviewUrl(URL.createObjectURL(file));
    setShowConfirmUpload(true);
  };

  const closeConfirmUpload = () => {
    setShowConfirmUpload(false);
    setPendingFile(null);
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingPreviewUrl(null);
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    setShowConfirmUpload(false);
    setProofUploading(true);
    setProofError('');
    const formData = new FormData();
    formData.append('proof', pendingFile);
    try {
      const res = await fetch(`/student/api/requests/${encodeURIComponent(trackingNumber)}/upload-proof`, {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': getCsrfToken() },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setProofError(data.message || 'Upload failed.');
      } else {
        setRequest(prev => prev ? { ...prev, payment_proof: data.proof_url } : prev);
      }
    } catch (err) {
      setProofError('Upload failed. Please check the file size (max 10MB) and try again.');
    }
    setProofUploading(false);
    setPendingFile(null);
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingPreviewUrl(null);
  };

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
                      <span className={`${s.bg} px-3 py-1.5 rounded text-xs font-bold border shrink-0`}>
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
                    <span className="text-on-surface-variant font-medium">Date of Birth:</span>
                    <span className="font-bold text-on-surface text-right">{request.date_of_birth ? request.date_of_birth.slice(0, 10) : '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-outline-variant pb-2">
                    <span className="text-on-surface-variant font-medium">Gender:</span>
                    <span className="font-bold text-on-surface text-right">{request.gender || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-outline-variant pb-2">
                    <span className="text-on-surface-variant font-medium">Emergency Contact:</span>
                    <span className="font-bold text-on-surface text-right">{request.emergency_contact_person || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-outline-variant pb-2">
                    <span className="text-on-surface-variant font-medium">Emergency Contact No.:</span>
                    <span className="font-bold text-on-surface text-right">{request.emergency_contact_number || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-outline-variant pb-2">
                    <span className="text-on-surface-variant font-medium">Complete Address:</span>
                    <span className="font-bold text-on-surface text-right">{request.complete_address || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-outline-variant pb-2">
                    <span className="text-on-surface-variant font-medium">Request Date:</span>
                    <span className="font-bold text-on-surface">{request.created_at}</span>
                  </div>
                  <div className="flex justify-between border-b border-outline-variant pb-2">
                    <span className="text-on-surface-variant font-medium">Processing Time:</span>
                    <span className="font-bold text-on-surface">{request.processing_days} Working Day(s)</span>
                  </div>
                  <div className="flex justify-between border-b border-outline-variant pb-2">
                    <span className="text-on-surface-variant font-medium">Payment Method:</span>
                    <span className="font-bold text-on-surface">{request.payment_method === 'cash' ? 'Cash Payment' : request.payment_method === 'online' ? 'Online Payment' : request.payment_method}</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-on-surface-variant font-medium">Payment Status:</span>
                    {(() => {
                      const p = getPaymentStatusConfig(request.payment_status);
                      return p ? <span className={`${p.className} px-2 py-0.5 rounded text-xs font-bold border`}>{p.label}</span>
                        : <span className="font-bold text-on-surface">{request.payment_status}</span>;
                    })()}
                  </div>
                  <div className="flex justify-between border-b border-outline-variant pb-2">
                    <span className="text-on-surface-variant font-medium">Release:</span>
                    <span className="font-bold text-on-surface">Pick up at Registrar</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t-2 border-primary/20 flex justify-between items-center">
                  <span className="font-headline-sm text-lg font-bold text-on-surface">Total Processing Fee:</span>
                  <span className="text-2xl font-bold text-primary">₱ {(Number(request.total_fee) || 0).toFixed(2)}</span>
                </div>

                <div className="mt-6 pt-4 border-t border-outline-variant flex flex-col sm:flex-row gap-2 sm:justify-end">
                  {request.status === 'Pending' && request.payment_status !== 'paid' && (
                    <button
                      onClick={handleCancelClick}
                      disabled={cancelling}
                      className="flex items-center justify-center sm:justify-start gap-2 px-4 py-3 sm:py-2 text-sm font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <XCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      {cancelling ? 'Cancelling...' : 'Cancel Request'}
                    </button>
                  )}
                </div>

                {request.payment_method === 'online' && request.payment_status !== 'paid' && request.status !== 'Cancelled' && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-bold text-amber-800 mb-2">Upload Payment Proof</p>
                    {paymentQrUrl && (
                      <div className="flex justify-center mb-3 p-3 bg-white border border-amber-200 rounded-lg">
                        <ProtectedImage src={paymentQrUrl} alt="Scan to pay" className="w-40 h-40 object-contain" />
                      </div>
                    )}
                    <p className="text-xs text-amber-700 mb-3">Scan the QR code using GCash or Maya, then upload your payment screenshot below.</p>
                    {request.payment_proof ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-700 font-medium">&#10003; Proof uploaded</span>
                        <button onClick={() => setProofModalUrl(request.payment_proof)} className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">View</button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadProof}
                          disabled={proofUploading}
                          className="w-full text-xs text-slate-600 file:mr-3 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Max file size: 10MB</p>
                        {proofUploading && <p className="text-xs text-amber-700 mt-1">Uploading...</p>}
                        {proofError && <p className="text-xs text-red-600 mt-1">{proofError}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <RegistrarRemarksCard remarks={request.remarks} />
            </div>

            <div className="lg:col-span-5 self-start">
              <div className="bg-surface-container-high border border-outline-variant rounded-2xl p-4 sm:p-6">
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

      {showConfirmUpload && pendingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={closeConfirmUpload}>
          <div className="bg-surface rounded-2xl shadow-xl border border-outline-variant w-full max-w-md p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-headline-sm font-bold text-on-surface mb-2">Upload Payment Proof</h3>
            {pendingPreviewUrl && (
              <div className="mb-3 rounded-xl overflow-hidden border border-outline-variant bg-surface-container-low">
                <img src={pendingPreviewUrl} alt="Preview" className="w-full max-h-48 object-contain" />
              </div>
            )}
            <p className="text-body-sm sm:text-body-md text-on-surface-variant mb-4">
              Are you sure you want to upload <strong className="text-on-surface">{pendingFile.name}</strong> ({(pendingFile.size / 1024 / 1024).toFixed(1)}MB) as your payment proof?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeConfirmUpload}
                className="px-5 py-2.5 rounded-lg font-label-md text-label-md font-bold text-on-surface-variant bg-surface-container-high hover:bg-surface-container-higher transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpload}
                className="px-5 py-2.5 rounded-lg font-label-md text-label-md font-bold text-on-primary bg-primary hover:brightness-110 transition-all cursor-pointer"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {proofModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setProofModalUrl(null)}>
          <div className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setProofModalUrl(null)} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full text-lg font-bold z-10 cursor-pointer">&times;</button>
            <ProtectedImage src={proofModalUrl} alt="Payment Proof" className="w-full h-auto max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </StudentDashboardLayout>
  );
}

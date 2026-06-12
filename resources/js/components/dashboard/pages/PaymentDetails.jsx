import React, { useState, useEffect } from 'react';
import { CheckCircle, ArrowLeft, CreditCard, User, BookOpen, ShieldCheck, ExternalLink, AlertCircle, FileText } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import { cashierSidebarItems } from '../config/sidebarItems';
import { getPaymentStatusConfig, getRequestStatusConfig } from '../../../utils/statusConfig';

export default function PaymentDetails({ user, onLogout, onNavigate }) {
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [message, setMessage] = useState(null);
    const [paymongoChecking, setPaymongoChecking] = useState(false);
    const [paymongoResult, setPaymongoResult] = useState(null);

    const id = window.location.pathname.split('/').filter(Boolean).pop();

    useEffect(() => {
        if (!id || isNaN(Number(id))) {
            setError('Invalid request ID.');
            setLoading(false);
            return;
        }

        fetch(`/admin/api/requests/${id}`, { credentials: 'same-origin' })
            .then((res) => {
                if (!res.ok) throw new Error('Request not found.');
                return res.json();
            })
            .then((data) => {
                setRequest(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [id]);

    const handleCheckPayMongo = () => {
        if (paymongoChecking) return;
        setPaymongoChecking(true);
        setPaymongoResult(null);
        setMessage(null);

        fetch(`/admin/payments/${id}/check-paymongo`, {
            credentials: 'same-origin',
        })
            .then((res) => res.json())
            .then((data) => {
                setPaymongoResult(data);
                if (data.success && data.auto_updated) {
                    setRequest(prev => prev ? { ...prev, payment_status: 'paid' } : prev);
                    setMessage({ type: 'success', text: 'PayMongo confirmed payment is complete. Status updated automatically.' });
                }
                setPaymongoChecking(false);
            })
            .catch(() => {
                setPaymongoResult({ success: false, message: 'Network error.' });
                setPaymongoChecking(false);
            });
    };

    const handleVerify = () => {
        if (verifying) return;
        setVerifying(true);
        setMessage(null);

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        fetch(`/admin/payments/${id}/verify`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            credentials: 'same-origin',
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.message && data.request) {
                    setMessage({ type: 'success', text: 'Payment verified successfully.' });
                    setRequest(data.request);
                } else {
                    setMessage({ type: 'error', text: data.message || 'Failed to verify payment.' });
                }
                setVerifying(false);
            })
            .catch(() => {
                setMessage({ type: 'error', text: 'An error occurred while verifying payment.' });
                setVerifying(false);
            });
    };

    const paymentCfg = (s, reqStatus) => getPaymentStatusConfig(reqStatus === 'Cancelled' ? 'cancelled' : s);
    const requestCfg = (s) => getRequestStatusConfig(s);

    if (loading) {
        return (
            <DashboardLayout title="Payment Details" subtitle="View and verify payment." sidebarItems={cashierSidebarItems} currentUser={user} roleLabel="Cashier / Accounting" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading payment details...</div>
            </DashboardLayout>
        );
    }

    if (error || !request) {
        return (
            <DashboardLayout title="Payment Details" subtitle="View and verify payment." sidebarItems={cashierSidebarItems} currentUser={user} roleLabel="Cashier / Accounting" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex flex-col items-center justify-center py-20 text-red-500 text-sm">
                    <p>{error || 'Request not found.'}</p>
                    <button onClick={() => onNavigate('/cashier/payments')} className="mt-4 px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer">
                        Back to Payment Queue
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Payment Details"
            subtitle="View and verify payment."
            sidebarItems={cashierSidebarItems}
            currentUser={user}
            roleLabel="Cashier / Accounting"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            <div className="max-w-6xl mx-auto">

                {/* Flash Message */}
                {message && (
                    <div className={`mb-5 px-4 py-3 rounded-lg text-sm font-medium border ${
                        message.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                    }`}>
                        {message.text}
                    </div>
                )}

                {/* ─── Header Section ─── */}
                <div className="mb-6">
                    <button
                        onClick={() => onNavigate('/cashier/payments')}
                        className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors mb-4 cursor-pointer"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Payment Queue
                    </button>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="min-w-0">
                                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight">
                                    {request.tracking_number}
                                </h1>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
                                    {(request.document_names || []).map((name, i) => (
                                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md text-xs font-medium text-slate-700">
                                            <FileText className="w-3 h-3 text-slate-500" />
                                            {name}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-xs sm:text-sm text-slate-500 mt-2">
                                    Payment verification for credential request
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full border ${paymentCfg(request.payment_status, request.status).className}`}>
                                    {paymentCfg(request.payment_status, request.status).label}
                                </span>
                                <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full border ${requestCfg(request.status).className}`}>
                                    {requestCfg(request.status).label}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Two-Column Layout ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                    {/* ─── Left Column (70%) ─── */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-5">

                        {/* Student Information */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2 px-5 py-3 bg-emerald-50 border-b border-emerald-100">
                                <User className="w-3.5 h-3.5 text-emerald-700" />
                                <h2 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Student Information</h2>
                            </div>
                            <div className="px-5 py-4">
                                <h3 className="text-base font-bold text-slate-900 mb-3">{request.student_name}</h3>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Student ID</p>
                                        <p className="text-sm font-medium text-slate-900 font-mono">{request.student_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Course</p>
                                        <p className="text-sm font-medium text-slate-900">{request.course}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Year Level</p>
                                        <p className="text-sm font-medium text-slate-900">{request.year_level || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Section</p>
                                        <p className="text-sm font-medium text-slate-900">{request.section || '-'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Email</p>
                                        <p className="text-sm text-slate-700">{request.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Requested Documents */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2 px-5 py-3 bg-emerald-50 border-b border-emerald-100">
                                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                                <h2 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Requested Documents</h2>
                            </div>
                            <div className="px-5 py-4">
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {request.document_names.map((name, i) => (
                                        <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                            {name}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                    {request.semesters && request.semesters.length > 0 && request.semesters.map((sem, i) => (
                                        <span key={i} className="bg-white text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">{sem}</span>
                                    ))}
                                    {request.pages && (
                                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                                            {request.pages} page{request.pages > 1 ? 's' : ''}
                                        </span>
                                    )}
                                    <span className="ml-auto text-slate-400">Requested {request.created_at}</span>
                                </div>
                            </div>
                        </div>

                        {/* Remarks — only if present */}
                        {request.remarks && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-2 px-5 py-3 bg-emerald-50 border-b border-emerald-100">
                                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                                    <h2 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Registrar Remarks</h2>
                                </div>
                                <div className="px-5 py-4">
                                    <p className="text-sm text-slate-700 leading-relaxed">{request.remarks}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ─── Right Sidebar (30%) ─── */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-5">

                        {/* Payment Summary */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2 px-5 py-3 bg-emerald-50 border-b border-emerald-100">
                                <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                                <h2 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Payment Summary</h2>
                            </div>
                            <div className="px-5 py-4">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Fee</p>
                                <p className="text-3xl font-bold text-emerald-700 mb-4">
                                    ₱{Number(request.total_fee ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between py-2 border-t border-slate-100">
                                        <span className="text-xs text-slate-500">Payment Method</span>
                                        <span className="text-xs font-medium text-slate-900 capitalize">{request.payment_method || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-t border-slate-100">
                                        <span className="text-xs text-slate-500">Payment Status</span>
                                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${paymentCfg(request.payment_status, request.status).className}`}>
                                            {paymentCfg(request.payment_status, request.status).label}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-t border-slate-100">
                                        <span className="text-xs text-slate-500">Request Status</span>
                                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${requestCfg(request.status).className}`}>
                                            {requestCfg(request.status).label}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-t border-slate-100">
                                        <span className="text-xs text-slate-500">Date Requested</span>
                                        <span className="text-xs text-slate-700">{request.created_at}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Verification */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2 px-5 py-3 bg-emerald-50 border-b border-emerald-100">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                                <h2 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Payment Verification</h2>
                            </div>
                            <div className="px-5 py-4">
                                {request.payment_status === 'paid' ? (
                                    <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-emerald-800">Payment Verified</p>
                                            {request.verified_by ? (
                                                <div className="mt-2 space-y-1">
                                                    <p className="text-xs text-emerald-600">Verified By: {request.verified_by}</p>
                                                    <p className="text-xs text-emerald-600">Verified At: {new Date(request.verified_at).toLocaleString()}</p>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-emerald-600 mt-1">Payment verified successfully.</p>
                                            )}
                                        </div>
                                    </div>
                                ) : request.status === 'Cancelled' ? (
                                    <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-red-800">Request Cancelled</p>
                                            <p className="text-xs text-red-600 mt-1">This request has been cancelled. Payment verification is disabled.</p>
                                        </div>
                                    </div>
                                ) : request.payment_method === 'online' ? (
                                    <div className="space-y-4">
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            This is an online payment request. Check the PayMongo session status below before marking as paid.
                                        </p>

                                        {request.paymongo_checkout_id && (
                                            <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">PayMongo Checkout ID</p>
                                                <p className="text-xs font-mono font-medium text-slate-900 break-all">
                                                    {request.paymongo_checkout_id}
                                                </p>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleCheckPayMongo}
                                            disabled={paymongoChecking}
                                            className="w-full py-2.5 text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                                        >
                                            {paymongoChecking ? (
                                                <>Checking...</>
                                            ) : (
                                                <><ExternalLink className="w-4 h-4" /> Check with PayMongo</>
                                            )}
                                        </button>

                                        {paymongoResult && (
                                            <div className={`rounded-lg border p-3 ${
                                                paymongoResult.success
                                                    ? paymongoResult.paymongo_status === 'paid'
                                                        ? 'bg-emerald-50 border-emerald-200'
                                                        : 'bg-amber-50 border-amber-200'
                                                    : 'bg-red-50 border-red-200'
                                            }`}>
                                                {paymongoResult.success ? (
                                                    <div className="text-center">
                                                        <p className="text-xs font-bold uppercase tracking-wider mb-1 text-slate-500">PayMongo Status</p>
                                                        <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${
                                                            paymongoResult.paymongo_status === 'paid'
                                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                                                : 'bg-amber-100 text-amber-800 border-amber-300'
                                                        }`}>
                                                            {paymongoResult.paymongo_status === 'paid' ? 'Paid' : paymongoResult.paymongo_status || 'Unknown'}
                                                        </span>
                                                        {paymongoResult.auto_updated && (
                                                            <p className="text-xs text-emerald-700 mt-2">Payment status auto-updated based on PayMongo confirmation.</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                                        <p className="text-xs text-red-700">{paymongoResult.message || 'Failed to check PayMongo.'}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="border-t border-slate-200 pt-4">
                                            <p className="text-xs text-slate-400 mb-3">Manual override — only use after verifying the student's payment proof.</p>
                                            <button
                                                onClick={handleVerify}
                                                disabled={verifying}
                                                className="w-full py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                                            >
                                                {verifying ? (
                                                    <>Verifying...</>
                                                ) : (
                                                    <><CheckCircle className="w-4 h-4" /> Mark as Paid</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Verify payment after confirming student payment.
                                        </p>
                                        <button
                                            onClick={handleVerify}
                                            disabled={verifying}
                                            className="w-full py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                                        >
                                            {verifying ? (
                                                <>Verifying...</>
                                            ) : (
                                                <><CheckCircle className="w-4 h-4" /> Mark as Paid</>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

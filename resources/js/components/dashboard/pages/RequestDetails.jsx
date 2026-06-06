import React, { useState, useEffect } from 'react';
import { FileText, LayoutDashboard, Clock, CheckCircle, Search, ArrowLeft, ChevronRight, CreditCard, User, BookOpen, MessageSquare, ShieldAlert, ShieldCheck } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import DashboardDropdown from '../../common/DashboardDropdown';

const sidebarItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin-dashboard' },
    { label: 'Request Management', icon: FileText, path: '/admin/requests' },
    { label: 'Process Requests', icon: Clock, path: '/admin/process' },
    { label: 'Release Credentials', icon: CheckCircle, path: '/admin/release' },
    { label: 'Search Records', icon: Search, path: '/admin/search' },
];

const statusOptions = [
    { label: 'Pending', value: 'Pending' },
    { label: 'Processing', value: 'Processing' },
    { label: 'Ready for Release', value: 'Ready for Release' },
    { label: 'Claimed', value: 'Claimed' },
];

const paymentLockedStatuses = ['Processing', 'Ready for Release', 'Claimed'];

const requestBadgeStyle = {
    'Pending': 'bg-amber-100 text-amber-800 border-amber-300',
    'Payment Pending': 'bg-orange-100 text-orange-800 border-orange-300',
    'Paid': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'Processing': 'bg-blue-100 text-blue-800 border-blue-300',
    'Ready for Release': 'bg-purple-100 text-purple-800 border-purple-300',
    'Claimed': 'bg-slate-200 text-slate-700 border-slate-300',
};

const paymentBadgeStyle = {
    'unpaid': 'bg-red-50 text-red-700 border-red-200',
    'pending_verification': 'bg-orange-50 text-orange-700 border-orange-200',
    'paid': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function RequestDetails({ user, onLogout, onNavigate }) {
    const [request, setRequest] = useState(null);
    const [status, setStatus] = useState('');
    const [remarks, setRemarks] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
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
                setStatus(data.status);
                setRemarks(data.remarks || '');
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [id]);

    const doSave = (newStatus, newRemarks) => {
        setSaving(true);
        setMessage(null);

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        fetch(`/admin/api/requests/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            credentials: 'same-origin',
            body: JSON.stringify({ status: newStatus, remarks: newRemarks }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.message) {
                    setMessage({ type: 'success', text: 'Request updated successfully.' });
                    setRequest(data.request);
                    setStatus(data.request.status);
                    setRemarks(data.request.remarks || '');
                } else {
                    setMessage({ type: 'error', text: 'Failed to update request.' });
                }
                setSaving(false);
            })
            .catch(() => {
                setMessage({ type: 'error', text: 'An error occurred while saving.' });
                setSaving(false);
            });
    };

    const handleSave = () => doSave(status, remarks);

    const handleQuickAction = (newStatus) => doSave(newStatus, remarks);

    const statusBadgeClass = (s) => requestBadgeStyle[s] || 'bg-slate-100 text-slate-700 border-slate-200';
    const paymentBadgeClass = (s) => paymentBadgeStyle[s] || 'bg-slate-100 text-slate-700 border-slate-200';

    const paymentPaid = request?.payment_status === 'paid';

    const quickActions = [];
    if (paymentPaid && status === 'Pending') quickActions.push({ label: 'Mark as Processing', target: 'Processing', color: 'bg-blue-600 hover:bg-blue-700' });
    if (paymentPaid && status === 'Processing') quickActions.push({ label: 'Ready for Release', target: 'Ready for Release', color: 'bg-purple-600 hover:bg-purple-700' });
    if (paymentPaid && status === 'Ready for Release') quickActions.push({ label: 'Mark as Claimed', target: 'Claimed', color: 'bg-emerald-600 hover:bg-emerald-700' });

    if (loading) {
        return (
            <DashboardLayout title="Request Details" subtitle="View and manage credential request details." sidebarItems={sidebarItems} currentUser={user} roleLabel="Administrator" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading request...</div>
            </DashboardLayout>
        );
    }

    if (error || !request) {
        return (
            <DashboardLayout title="Request Details" subtitle="View and manage credential request details." sidebarItems={sidebarItems} currentUser={user} roleLabel="Administrator" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex flex-col items-center justify-center py-20 text-red-500 text-sm">
                    <p>{error || 'Request not found.'}</p>
                    <button onClick={() => onNavigate('/admin/requests')} className="mt-4 px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer">
                        Back to Request Management
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Request Details"
            subtitle="View and manage credential request details."
            sidebarItems={sidebarItems}
            currentUser={user}
            roleLabel="Administrator"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => onNavigate('/admin/requests')}
                        className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors mb-4 cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Request Management
                    </button>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Credential Request</p>
                                <h1 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{request.tracking_number}</h1>
                            </div>
                            <span className={`inline-flex items-center px-3 py-1.5 text-sm font-bold rounded-full border shadow-sm ${statusBadgeClass(request.status)}`}>
                                {request.status}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                Submitted {request.created_at}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" />
                                ID: {request.student_number}
                            </span>
                        </div>
                    </div>
                </div>

                {message && (
                    <div className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium border ${
                        message.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                    }`}>
                        {message.text}
                    </div>
                )}

                {/* Two-column layout */}
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Left Column — 70% */}
                    <div className="flex-1 lg:w-[70%] space-y-6">

                        {/* Student Information */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2 px-6 py-4 bg-emerald-50 border-b border-emerald-100">
                                <User className="w-4 h-4 text-emerald-700" />
                                <h2 className="text-sm font-bold text-emerald-800">Student Information</h2>
                            </div>
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-5">{request.student_name}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                                    <div>
                                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Student ID</p>
                                        <p className="text-sm font-medium text-slate-900 font-mono">{request.student_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Course</p>
                                        <p className="text-sm font-medium text-slate-900">{request.course}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                                        <p className="text-sm text-slate-700">{request.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                                        <p className="text-sm text-slate-700">{request.phone || 'N/A'}</p>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Purpose of Request</p>
                                        <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">{request.purpose || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Requested Documents */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2 px-6 py-4 bg-emerald-50 border-b border-emerald-100">
                                <BookOpen className="w-4 h-4 text-emerald-700" />
                                <h2 className="text-sm font-bold text-emerald-800">Requested Documents</h2>
                            </div>
                            <div className="p-6 space-y-3">
                                {request.document_names.map((name, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900">{name}</p>
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {request.semesters && request.semesters.length > 0 && request.semesters.map((sem, j) => (
                                                    <span key={j} className="text-[11px] bg-white text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">
                                                        {sem}
                                                    </span>
                                                ))}
                                                {request.pages && (
                                                    <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                                                        {request.pages} page{request.pages > 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!request.semesters || request.semesters.length === 0) && !request.pages && (
                                    <p className="text-xs text-slate-400 italic">No additional details for these documents.</p>
                                )}
                            </div>
                        </div>

                        {/* Registrar Remarks */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2 px-6 py-4 bg-emerald-50 border-b border-emerald-100">
                                <MessageSquare className="w-4 h-4 text-emerald-700" />
                                <h2 className="text-sm font-bold text-emerald-800">Registrar Remarks</h2>
                            </div>
                            <div className="p-6">
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Add internal remarks or notes about this request..."
                                    rows={4}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
                                />
                                <p className="text-[11px] text-slate-400 mt-1.5">Remarks are for internal registrar use only.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column — 30% (sticky) */}
                    <div className="lg:w-[30%] lg:min-w-[300px] space-y-6">
                        <div className="lg:sticky lg:top-24 space-y-6">

                            {/* Payment Summary — Read-only */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-2 px-6 py-4 bg-emerald-50 border-b border-emerald-100">
                                    <CreditCard className="w-4 h-4 text-emerald-700" />
                                    <h2 className="text-sm font-bold text-emerald-800">Payment Summary</h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-500">Method</span>
                                        <span className="text-sm font-medium text-slate-900 capitalize">{request.payment_method || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-500">Status</span>
                                        <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${paymentBadgeClass(request.payment_status)}`}>
                                            {request.payment_status === 'pending_verification' ? 'Pending Verification' : request.payment_status === 'unpaid' ? 'Unpaid' : 'Paid'}
                                        </span>
                                    </div>
                                    <div className="pt-3 border-t border-slate-100">
                                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Total Fee</p>
                                        <p className="text-2xl font-bold text-emerald-700">₱ {Number(request.total_fee).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                    <div className="pt-3 border-t border-slate-100">
                                        <div className="flex items-start gap-2 text-[11px] text-slate-400">
                                            <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                            <p>Payment verification is managed by Cashier/Accounting.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Registrar Action */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-visible md:overflow-hidden">
                                <div className="flex items-center gap-2 px-6 py-4 bg-emerald-50 border-b border-emerald-100">
                                    <ChevronRight className="w-4 h-4 text-emerald-700" />
                                    <h2 className="text-sm font-bold text-emerald-800">Registrar Action</h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    <p className="text-xs text-slate-500 leading-relaxed">Update the request status after payment verification.</p>

                                    {!paymentPaid && (
                                        <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                            <p className="text-xs text-amber-800 leading-relaxed">
                                                Payment has not yet been verified by Accounting/Cashier. Registrar cannot process this request until payment is marked as Paid.
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Request Status</label>
                                        <DashboardDropdown
                                            options={statusOptions}
                                            value={status}
                                            onChange={setStatus}
                                            placeholder="Select status"
                                            optionDisabled={(opt) => !paymentPaid && paymentLockedStatuses.includes(opt.value)}
                                            disabledReason={() => 'payment required'}
                                        />
                                    </div>

                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="w-full py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 rounded-lg transition-colors cursor-pointer"
                                    >
                                        {saving ? 'Saving Changes...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            {quickActions.length > 0 && (
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="flex items-center gap-2 px-6 py-4 bg-emerald-50 border-b border-emerald-100">
                                        <ChevronRight className="w-4 h-4 text-emerald-700" />
                                        <h2 className="text-sm font-bold text-emerald-800">Quick Actions</h2>
                                    </div>
                                    <div className="p-6 space-y-3">
                                        {quickActions.map((action) => (
                                            <button
                                                key={action.target}
                                                onClick={() => handleQuickAction(action.target)}
                                                disabled={saving}
                                                className={`w-full py-2.5 text-sm font-bold text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${action.color}`}
                                            >
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import DashboardSearch from '../DashboardSearch';
import DashboardTable from '../DashboardTable';
import DashboardMobileCard from '../DashboardMobileCard';
import StatusBadge from '../StatusBadge';
import EmptyState from '../EmptyState';
import DashboardPagination from '../DashboardPagination';
import { registrarSidebarItems } from '../config/sidebarItems';

const tableHeaders = ['Reference No.', 'Student Name', 'Documents', 'Current Status', 'Date Requested', 'Action'];

export default function ProcessRequests({ user, onLogout, onNavigate }) {
    const ITEMS_PER_PAGE = 10;
    const [query, setQuery] = useState('');
    const [allRequests, setAllRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    // Tracks which request is currently being processed (to disable its buttons)
    const [processingId, setProcessingId] = useState(null);
    // Flash message shown in a modal after a successful/failed status update
    const [message, setMessage] = useState(null);

    const getCsrfToken = () =>
        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    const fetchData = () => {
        setLoading(true);
        fetch(`/admin/requests-data?per_page=9999&status=processable`, { credentials: 'same-origin' })
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then((json) => {
                setAllRequests(json.requests);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Auto-dismiss the flash message after 3 seconds
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // Only show requests that are paid or already in processing (exclude Claimed/Cancelled)
    const processable = allRequests.filter(
        (req) => (req.payment_status === 'paid' || req.status === 'Processing') && !['Claimed', 'Cancelled'].includes(req.status)
    );

    const filtered = processable.filter((req) =>
        req.student_name.toLowerCase().includes(query.toLowerCase()) ||
        req.tracking_number.toLowerCase().includes(query.toLowerCase())
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const pageRecords = filtered.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
    };

    useEffect(() => { setPage(1); }, [query]);

    // Forward transitions — what happens when the user clicks the primary action button
    const STATUS_TRANSITIONS = {
        'Pending': { next: 'Processing', label: 'Process Request' },
        'Processing': { next: 'Release', label: 'Mark as Ready' },
        'Release': { next: 'Claimed', label: 'Mark as Claimed' },
    };

    // Reverse transitions (revert) — the revert button is always rendered but disabled when not applicable
    const STATUS_REVERSE = {
        'Processing': { prev: 'Pending', label: 'Revert to Pending' },
        'Release': { prev: 'Processing', label: 'Revert to Processing' },
        'Claimed': { prev: 'Release', label: 'Revert to Ready' },
    };

    // PATCH the status to either the next forward state or the previous (revert) state
    const handleProcess = (id, currentStatus, reverse = false) => {
        if (processingId) return;
        const target = reverse ? STATUS_REVERSE[currentStatus] : STATUS_TRANSITIONS[currentStatus];
        if (!target) return;
        setProcessingId(id);
        setMessage(null);

        const nextStatus = reverse ? target.prev : target.next;

        fetch(`/admin/api/requests/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
            },
            credentials: 'same-origin',
            body: JSON.stringify({ status: nextStatus }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.message && data.request) {
                    setMessage({ type: 'success', text: `Request moved to ${nextStatus}.` });
                    fetchData();
                } else {
                    setMessage({ type: 'error', text: data.message || 'Failed to process request.' });
                }
                setProcessingId(null);
            })
            .catch(() => {
                setMessage({ type: 'error', text: 'An error occurred.' });
                setProcessingId(null);
            });
    };

    const renderRow = (req) => (
        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-mono text-xs font-medium text-emerald-700">{req.tracking_number}</td>
            <td className="px-6 py-4 font-medium text-slate-900">{req.student_name}</td>
            <td className="px-6 py-4 text-slate-700" title={(req.document_names || []).join(', ')}>{(req.document_names || []).join(', ')}</td>
            <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
            <td className="px-6 py-4 text-slate-500 text-xs">{req.created_at}</td>
            <td className="px-6 py-4 flex items-center gap-2">
                {/* Primary action button — disabled if no valid forward transition exists for this status */}
                <button
                    onClick={() => handleProcess(req.id, req.status)}
                    disabled={processingId === req.id || !STATUS_TRANSITIONS[req.status]}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                    {processingId === req.id ? 'Processing...' : STATUS_TRANSITIONS[req.status]?.label || 'Process'}
                </button>
                {/* Revert button — always rendered but disabled if no valid reverse transition exists */}
                <button
                    onClick={() => handleProcess(req.id, req.status, true)}
                    disabled={processingId === req.id || !STATUS_REVERSE[req.status]}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                    {STATUS_REVERSE[req.status]?.label || 'Revert'}
                </button>
            </td>
        </tr>
    );

    if (loading) {
        return (
            <DashboardLayout title="Process Requests" subtitle="Monitor and process credential requests." sidebarItems={registrarSidebarItems} currentUser={user} roleLabel="Administrator" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading requests...</div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Process Requests" subtitle="Monitor and process credential requests." sidebarItems={registrarSidebarItems} currentUser={user} roleLabel="Administrator" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-red-500 text-sm">Error: {error}</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Process Requests"
            subtitle="Monitor and process credential requests."
            sidebarItems={registrarSidebarItems}
            currentUser={user}
            roleLabel="Administrator"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Status update success modal — overlay with checkmark and message */}
                {message && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setMessage(null)}>
                        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center animate-[scaleIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Request Updated</h3>
                            <p className="text-sm text-slate-600 mb-6">{message.text}</p>
                            <button onClick={() => setMessage(null)} className="w-full px-4 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-medium hover:brightness-110 transition-all cursor-pointer">Done</button>
                        </div>
                    </div>
                )}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-200">
                    <DashboardSearch
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search requests..."
                    />
                </div>

                <div className="hidden lg:block">
                    <DashboardTable
                        headers={tableHeaders}
                        emptyState={
                            <EmptyState
                                icon={RefreshCw}
                                title="No Requests to Process"
                                subtitle="All requests have been processed. New submissions will appear here."
                            />
                        }
                    >
                        {pageRecords.map(renderRow)}
                    </DashboardTable>
                </div>

                        <div className="lg:hidden">
                            {pageRecords.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {pageRecords.map((item) => (
                                <DashboardMobileCard
                                    key={item.id}
                                    title={item.tracking_number}
                                    subtitle={item.student_name}
                                    metadata={[
                                        { label: 'Documents', value: (item.document_names || []).join(', ') },
                                        { label: 'Status', value: <StatusBadge status={item.status} /> },
                                        { label: 'Date', value: item.created_at },
                                    ]}
                                    actionLabel={processingId === item.id ? 'Processing...' : STATUS_TRANSITIONS[item.status]?.label || 'Process'}
                                    onAction={() => handleProcess(item.id, item.status)}
                                    secondaryAction={{ label: STATUS_REVERSE[item.status]?.label || 'Revert', onAction: () => handleProcess(item.id, item.status, true) }}
                                    loading={processingId === item.id}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={RefreshCw}
                            title="No Requests to Process"
                            subtitle="All requests have been processed. New submissions will appear here."
                        />
                    )}
                </div>

                <div className="hidden lg:block px-6 py-4 border-t border-slate-100">
                    <DashboardPagination
                        currentPage={page}
                        lastPage={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
                <div className="lg:hidden px-4 py-3 border-t border-slate-100">
                    <DashboardPagination
                        currentPage={page}
                        lastPage={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            </section>
        </DashboardLayout>
    );
}

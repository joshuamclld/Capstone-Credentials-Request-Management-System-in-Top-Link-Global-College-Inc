import React, { useState, useEffect } from 'react';
import { FileText, LayoutDashboard, Clock, CheckCircle, Search, RefreshCw } from 'lucide-react';
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
    const [processingId, setProcessingId] = useState(null);
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

    const STATUS_TRANSITIONS = {
        'Pending': { next: 'Processing', label: 'Process Request' },
        'Processing': { next: 'Ready for Release', label: 'Mark as Ready' },
        'Ready for Release': { next: 'Claimed', label: 'Mark as Claimed' },
    };

    const handleProcess = (id, currentStatus) => {
        if (processingId) return;
        const transition = STATUS_TRANSITIONS[currentStatus];
        if (!transition) return;
        setProcessingId(id);
        setMessage(null);

        const nextStatus = transition.next;

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
            <td className="px-6 py-4 text-slate-700 max-w-[200px] truncate" title={(req.document_names || []).join(', ')}>{(req.document_names || []).join(', ')}</td>
            <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
            <td className="px-6 py-4 text-slate-500 text-xs">{req.created_at}</td>
            <td className="px-6 py-4">
                <button
                    onClick={() => handleProcess(req.id, req.status)}
                    disabled={processingId === req.id}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                    {processingId === req.id ? 'Processing...' : STATUS_TRANSITIONS[req.status]?.label || 'Process'}
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
                {message && (
                    <div className={`mx-6 mt-5 px-4 py-3 rounded-lg text-sm font-medium border ${message.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                        }`}>
                        {message.text}
                    </div>
                )}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-200">
                    <DashboardSearch
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search requests..."
                    />
                </div>

                <div className="hidden md:block">
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

                        <div className="md:hidden">
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

                <div className="hidden md:block px-6 py-4 border-t border-slate-100">
                    <DashboardPagination
                        currentPage={page}
                        lastPage={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
                <div className="md:hidden px-4 py-3 border-t border-slate-100">
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

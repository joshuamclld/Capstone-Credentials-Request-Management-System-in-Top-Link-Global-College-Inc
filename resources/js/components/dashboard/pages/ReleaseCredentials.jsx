import React, { useState, useEffect } from 'react';
import { FileText, LayoutDashboard, Clock, CheckCircle, Search, Archive } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import DashboardSearch from '../DashboardSearch';
import DashboardTable from '../DashboardTable';
import DashboardMobileCard from '../DashboardMobileCard';
import StatusBadge from '../StatusBadge';
import EmptyState from '../EmptyState';
import DashboardPagination from '../DashboardPagination';
import { registrarSidebarItems } from '../config/sidebarItems';

const tableHeaders = ['Reference No.', 'Student Name', 'Documents', 'Status', 'Date Requested', 'Action'];

export default function ReleaseCredentials({ user, onLogout, onNavigate }) {
    const [query, setQuery] = useState('');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [claimingId, setClaimingId] = useState(null);
    const [message, setMessage] = useState(null);

    const getCsrfToken = () =>
        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    const fetchData = (p) => {
        setLoading(true);
        fetch(`/admin/requests-data?page=${p}`, { credentials: 'same-origin' })
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then((json) => {
                setRequests(json.requests);
                setPagination(json.pagination);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchData(page);
    }, [page]);

    const handlePageChange = (newPage) => {
        if (newPage < 1 || (pagination && newPage > pagination.last_page)) return;
        setPage(newPage);
    };

    const handleClaim = (id) => {
        if (claimingId) return;
        setClaimingId(id);
        setMessage(null);

        fetch(`/admin/api/requests/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
            },
            credentials: 'same-origin',
            body: JSON.stringify({ status: 'Claimed' }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.message && data.request) {
                    setMessage({ type: 'success', text: 'Credentials marked as Claimed.' });
                    fetchData(page);
                } else {
                    setMessage({ type: 'error', text: data.message || 'Failed to mark as claimed.' });
                }
                setClaimingId(null);
            })
            .catch(() => {
                setMessage({ type: 'error', text: 'An error occurred.' });
                setClaimingId(null);
            });
    };

    const releasable = requests.filter((req) => req.status === 'Ready for Release');

    const filtered = releasable.filter((req) =>
        req.student_name.toLowerCase().includes(query.toLowerCase()) ||
        req.tracking_number.toLowerCase().includes(query.toLowerCase())
    );

    const renderRow = (req) => (
        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-mono text-xs font-medium text-emerald-700">{req.tracking_number}</td>
            <td className="px-6 py-4 font-medium text-slate-900">{req.student_name}</td>
            <td className="px-6 py-4 text-slate-700 max-w-[200px] truncate" title={(req.document_names || []).join(', ')}>{(req.document_names || []).join(', ')}</td>
            <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
            <td className="px-6 py-4 text-slate-500 text-xs">{req.created_at}</td>
            <td className="px-6 py-4">
                <button
                    onClick={() => handleClaim(req.id)}
                    disabled={claimingId === req.id}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                    {claimingId === req.id ? 'Claiming...' : 'Mark as Claimed'}
                </button>
            </td>
        </tr>
    );

    if (loading) {
        return (
            <DashboardLayout title="Release Credentials" subtitle="Manage credential claiming and release." sidebarItems={registrarSidebarItems} currentUser={user} roleLabel="Administrator" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading requests...</div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Release Credentials" subtitle="Manage credential claiming and release." sidebarItems={registrarSidebarItems} currentUser={user} roleLabel="Administrator" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-red-500 text-sm">Error: {error}</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Release Credentials"
            subtitle="Manage credential claiming and release."
            sidebarItems={registrarSidebarItems}
            currentUser={user}
            roleLabel="Administrator"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {message && (
                    <div className={`mx-6 mt-5 px-4 py-3 rounded-lg text-sm font-medium border ${
                        message.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                    }`}>
                        {message.text}
                    </div>
                )}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-200">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Ready for Release</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Completed credentials waiting to be claimed by students.</p>
                    </div>
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
                                icon={Archive}
                                title="No Credentials Ready for Release"
                                subtitle="All processed credentials have been released. Completed requests will appear here."
                            />
                        }
                    >
                        {filtered.map(renderRow)}
                    </DashboardTable>
                </div>

                <div className="md:hidden">
                    {filtered.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {filtered.map((item) => (
                                <DashboardMobileCard
                                    key={item.id}
                                    title={item.tracking_number}
                                    subtitle={item.student_name}
                                    metadata={[
                                        { label: 'Documents', value: (item.document_names || []).join(', ') },
                                        { label: 'Status', value: <StatusBadge status={item.status} /> },
                                        { label: 'Date', value: item.created_at },
                                    ]}
                                    actionLabel={claimingId === item.id ? 'Claiming...' : 'Mark as Claimed'}
                                    onAction={() => handleClaim(item.id)}
                                    loading={claimingId === item.id}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Archive}
                            title="No Credentials Ready for Release"
                            subtitle="All processed credentials have been released. Completed requests will appear here."
                        />
                    )}
                </div>

                <div className="hidden md:block px-6 py-4 border-t border-slate-100">
                    <DashboardPagination
                        currentPage={pagination?.current_page || 1}
                        lastPage={pagination?.last_page || 1}
                        onPageChange={handlePageChange}
                    />
                </div>
                <div className="md:hidden px-4 py-3 border-t border-slate-100">
                    <DashboardPagination
                        currentPage={pagination?.current_page || 1}
                        lastPage={pagination?.last_page || 1}
                        onPageChange={handlePageChange}
                    />
                </div>
            </section>
        </DashboardLayout>
    );
}

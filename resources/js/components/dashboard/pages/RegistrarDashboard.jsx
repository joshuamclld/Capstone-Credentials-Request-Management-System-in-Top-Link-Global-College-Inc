import React, { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, Archive, RefreshCw } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import DashboardStatCard from '../DashboardStatCard';
import DashboardSearch from '../DashboardSearch';
import DashboardTable from '../DashboardTable';
import DashboardMobileCard from '../DashboardMobileCard';
import StatusBadge from '../StatusBadge';
import EmptyState from '../EmptyState';
import DashboardPagination from '../DashboardPagination';
import { registrarSidebarItems } from '../config/sidebarItems';

const statDefs = [
    { label: 'Total Requests', key: 'total', icon: FileText, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-700' },
    { label: 'Pending Payment', key: 'pending_payment', icon: Clock, iconBg: 'bg-orange-50', iconColor: 'text-orange-700' },
    { label: 'Processing', key: 'processing', icon: RefreshCw, iconBg: 'bg-blue-50', iconColor: 'text-blue-700' },
    { label: 'Ready for Release', key: 'ready_for_release', icon: CheckCircle, iconBg: 'bg-purple-50', iconColor: 'text-purple-700' },
    { label: 'Claimed', key: 'claimed', icon: Archive, iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
    { label: 'Claimed This Month', key: 'claimed_this_month', icon: CheckCircle, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-700' },
];

const tableHeaders = ['Reference No.', 'Student Name', 'Requested Documents', 'Payment Status', 'Request Status', 'Date Requested', 'Action'];

export default function RegistrarDashboard({ user, onLogout, onNavigate }) {
    const ITEMS_PER_PAGE = 10;
    const [query, setQuery] = useState('');
    const [data, setData] = useState({ stats: null, requests: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);

    const fetchData = (isInitial = false) => {
        if (isInitial) setLoading(true);
        fetch(`/admin/requests-data?per_page=9999&daily=1`, { credentials: 'same-origin' })
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then((json) => {
                setData(json);
                setLoading(false);
            })
            .catch((err) => {
                if (isInitial) setError(err.message);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchData(true);
        const interval = setInterval(() => fetchData(), 10000);
        return () => clearInterval(interval);
    }, []);

    const filtered = data.requests.filter((req) =>
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

    const renderRow = (req) => (
        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-mono text-xs font-medium text-emerald-700">{req.tracking_number}</td>
            <td className="px-6 py-4 font-medium text-slate-900">{req.student_name}</td>
            <td className="px-6 py-4 text-slate-700 max-w-[200px] truncate" title={(req.document_names || []).join(', ')}>{(req.document_names || []).join(', ')}</td>
            <td className="px-6 py-4"><StatusBadge status={req.payment_status} type="payment" /></td>
            <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
            <td className="px-6 py-4 text-slate-500 text-xs">{req.created_at}</td>
            <td className="px-6 py-4">
                <button
                    onClick={() => onNavigate(`/admin/requests/${req.id}`)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
                >
                    View Details
                </button>
            </td>
        </tr>
    );

    return (
        <DashboardLayout
            title="Registrar Dashboard"
            subtitle="Manage and process student credential requests."
            sidebarItems={registrarSidebarItems}
            currentUser={user}
            roleLabel="Administrator"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading dashboard data...</div>
            ) : error ? (
                <div className="flex items-center justify-center py-20 text-red-500 text-sm">Error: {error}</div>
            ) : (
                <>
                    <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                        {statDefs.map((stat) => (
                            <DashboardStatCard
                                key={stat.label}
                                title={stat.label}
                                value={String(data.stats?.[stat.key] ?? 0)}
                                icon={stat.icon}
                                iconBg={stat.iconBg}
                                iconColor={stat.iconColor}
                            />
                        ))}
                    </section>

                    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-200">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Today's Requests</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Credential requests submitted today.</p>
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
                                        icon={FileText}
                                        title="No Student Requests Yet"
                                        subtitle="Submitted credential requests will appear here."
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
                                                { label: 'Payment', value: <StatusBadge status={item.payment_status} type="payment" /> },
                                                { label: 'Status', value: <StatusBadge status={item.status} /> },
                                                { label: 'Date', value: item.created_at },
                                            ]}
                                            actionLabel="View Details"
                                            onAction={() => onNavigate(`/admin/requests/${item.id}`)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={FileText}
                                    title="No Student Requests Yet"
                                    subtitle="Submitted credential requests will appear here."
                                />
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100">
                            <DashboardPagination
                                currentPage={page}
                                lastPage={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </section>
                </>
            )}
        </DashboardLayout>
    );
}

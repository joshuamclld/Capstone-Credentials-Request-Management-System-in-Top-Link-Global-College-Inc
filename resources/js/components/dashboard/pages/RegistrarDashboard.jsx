import React, { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, LayoutDashboard, Search, Archive, RefreshCw } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import DashboardStatCard from '../DashboardStatCard';
import DashboardSearch from '../DashboardSearch';
import DashboardTable from '../DashboardTable';
import StatusBadge from '../StatusBadge';
import EmptyState from '../EmptyState';
import DashboardPagination from '../DashboardPagination';

const statDefs = [
    { label: 'Total Requests', key: 'total', icon: FileText, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-700' },
    { label: 'Pending Payment', key: 'pending_payment', icon: Clock, iconBg: 'bg-orange-50', iconColor: 'text-orange-700' },
    { label: 'Processing', key: 'processing', icon: RefreshCw, iconBg: 'bg-blue-50', iconColor: 'text-blue-700' },
    { label: 'Ready for Release', key: 'ready_for_release', icon: CheckCircle, iconBg: 'bg-purple-50', iconColor: 'text-purple-700' },
    { label: 'Claimed', key: 'claimed', icon: Archive, iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
];

const tableHeaders = ['Reference No.', 'Student Name', 'Requested Documents', 'Payment Status', 'Request Status', 'Date Requested', 'Action'];

const sidebarItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin-dashboard' },
    { label: 'Request Management', icon: FileText, path: '/admin/requests' },
    { label: 'Process Requests', icon: Clock, path: '/admin/process' },
    { label: 'Release Credentials', icon: CheckCircle, path: '/admin/release' },
    { label: 'Search Records', icon: Search, path: '/admin/search' },
];

export default function RegistrarDashboard({ user, onLogout, onNavigate }) {
    const [query, setQuery] = useState('');
    const [data, setData] = useState({ stats: null, requests: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    const fetchData = (p) => {
        setLoading(true);
        fetch(`/admin/requests-data?page=${p}`, { credentials: 'same-origin' })
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then((json) => {
                setData(json);
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

    const filtered = data.requests.filter((req) =>
        req.student_name.toLowerCase().includes(query.toLowerCase()) ||
        req.tracking_number.toLowerCase().includes(query.toLowerCase())
    );

    const renderRow = (req) => (
        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-mono text-xs font-medium text-emerald-700">{req.tracking_number}</td>
            <td className="px-6 py-4 font-medium text-slate-900">{req.student_name}</td>
            <td className="px-6 py-4 text-slate-700 max-w-[200px] truncate" title={req.document_names.join(', ')}>{req.document_names.join(', ')}</td>
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
            sidebarItems={sidebarItems}
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
                    <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
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
                                <h2 className="text-base font-bold text-slate-900">Recent Requests</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Latest credential requests submitted by students.</p>
                            </div>
                            <DashboardSearch
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search requests..."
                            />
                        </div>

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
                            {filtered.map(renderRow)}
                        </DashboardTable>
                        <DashboardPagination
                            currentPage={pagination?.current_page || 1}
                            lastPage={pagination?.last_page || 1}
                            onPageChange={handlePageChange}
                        />
                    </section>
                </>
            )}
        </DashboardLayout>
    );
}

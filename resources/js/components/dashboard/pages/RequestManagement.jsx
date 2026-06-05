import React, { useState, useEffect } from 'react';
import { FileText, LayoutDashboard, Clock, CheckCircle, Search } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import DashboardSearch from '../DashboardSearch';
import DashboardTable from '../DashboardTable';
import DashboardMobileCard from '../DashboardMobileCard';
import StatusBadge from '../StatusBadge';
import EmptyState from '../EmptyState';
import DashboardPagination from '../DashboardPagination';

const tableHeaders = ['Reference No.', 'Student Name', 'Requested Documents', 'Payment Method', 'Payment Status', 'Request Status', 'Date Requested', 'Action'];

const filterOptions = [
    'All', 'Pending', 'Payment Pending', 'Paid', 'Processing', 'Ready for Release', 'Claimed',
];

const sidebarItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin-dashboard' },
    { label: 'Request Management', icon: FileText, path: '/admin/requests' },
    { label: 'Process Requests', icon: Clock, path: '/admin/process' },
    { label: 'Release Credentials', icon: CheckCircle, path: '/admin/release' },
    { label: 'Search Records', icon: Search, path: '/admin/search' },
];

export default function RequestManagement({ user, onLogout, onNavigate }) {
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('All');
    const [requests, setRequests] = useState([]);
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

    const statusFilterMap = {
        'Pending': (req) => req.status === 'Pending',
        'Payment Pending': (req) => ['unpaid', 'pending_verification'].includes(req.payment_status),
        'Paid': (req) => req.payment_status === 'paid',
        'Processing': (req) => req.status === 'Processing',
        'Ready for Release': (req) => req.status === 'Ready for Release',
        'Claimed': (req) => req.status === 'Claimed',
    };

    const filtered = requests.filter((req) => {
        const matchesSearch = req.student_name.toLowerCase().includes(query.toLowerCase()) ||
            req.tracking_number.toLowerCase().includes(query.toLowerCase());
        const matchesFilter = filter === 'All' || (statusFilterMap[filter]?.(req) ?? false);
        return matchesSearch && matchesFilter;
    });

    const renderRow = (req) => (
        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-mono text-xs font-medium text-emerald-700">{req.tracking_number}</td>
            <td className="px-6 py-4 font-medium text-slate-900">{req.student_name}</td>
            <td className="px-6 py-4 text-slate-700 max-w-[200px] truncate" title={req.document_names.join(', ')}>{req.document_names.join(', ')}</td>
            <td className="px-6 py-4 text-xs text-slate-600 capitalize">{req.payment_method}</td>
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

    if (loading) {
        return (
            <DashboardLayout title="Request Management" subtitle="Manage submitted credential requests." sidebarItems={sidebarItems} currentUser={user} roleLabel="Administrator" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading requests...</div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Request Management" subtitle="Manage submitted credential requests." sidebarItems={sidebarItems} currentUser={user} roleLabel="Administrator" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-red-500 text-sm">Error: {error}</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Request Management"
            subtitle="Manage submitted credential requests."
            sidebarItems={sidebarItems}
            currentUser={user}
            roleLabel="Administrator"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-200">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">All Requests</h2>
                        <p className="text-xs text-slate-500 mt-0.5">View and manage all credential requests.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                        >
                            {filterOptions.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                        <DashboardSearch
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search requests..."
                        />
                    </div>
                </div>

                <div className="hidden md:block">
                    <DashboardTable
                        headers={tableHeaders}
                        emptyState={
                            <EmptyState
                                icon={FileText}
                                title="No Requests Found"
                                subtitle="No credential requests match your current filter."
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
                                        { label: 'Documents', value: item.document_names.join(', ') },
                                        { label: 'Method', value: item.payment_method || 'N/A' },
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
                            title="No Requests Found"
                            subtitle="No credential requests match your current filter."
                        />
                    )}
                </div>

                <div className="px-6 py-4 border-t border-slate-100">
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

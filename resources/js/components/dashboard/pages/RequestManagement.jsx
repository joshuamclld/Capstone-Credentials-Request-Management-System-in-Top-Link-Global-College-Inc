import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import DashboardSearch from '../DashboardSearch';
import DashboardTable from '../DashboardTable';
import DashboardMobileCard from '../DashboardMobileCard';
import StatusBadge from '../StatusBadge';
import EmptyState from '../EmptyState';
import DashboardPagination from '../DashboardPagination';
import DashboardDropdown from '../../common/DashboardDropdown';
import { registrarSidebarItems } from '../config/sidebarItems';

const tableHeaders = ['Reference No.', 'Student Name', 'Requested Documents', 'Payment Status', 'Request Status', 'Date Requested', 'Action'];

const filterOptions = [
    'All', 'Pending', 'Paid', 'Processing', 'Release', 'Claimed',
];

export default function RequestManagement({ user, onLogout, onNavigate }) {
    const ITEMS_PER_PAGE = 10;
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('All');
    const [docFilter, setDocFilter] = useState('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [allRequests, setAllRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);

    const fetchData = () => {
        setLoading(true);
        fetch(`/admin/requests-data?per_page=9999`, { credentials: 'same-origin' })
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

    const statusFilterMap = {
        'Pending': (req) => req.status === 'Pending',
        'Paid': (req) => req.payment_status === 'paid',
        'Processing': (req) => req.status === 'Processing',
        'Release': (req) => req.status === 'Release',
        'Claimed': (req) => req.status === 'Claimed',
    };

    const filtered = allRequests.filter((req) => {
        const matchesSearch = req.student_name.toLowerCase().includes(query.toLowerCase()) ||
            req.tracking_number.toLowerCase().includes(query.toLowerCase());
        const matchesFilter = filter === 'All' || (statusFilterMap[filter]?.(req) ?? false);
        const matchesDoc = docFilter === 'All' || (req.document_names || []).includes(docFilter);
        const reqDate = req.created_at ? req.created_at.slice(0, 10) : '';
        const matchesDate = (!dateFrom || reqDate >= dateFrom) && (!dateTo || reqDate <= dateTo);
        return matchesSearch && matchesFilter && matchesDoc && matchesDate;
    });

    const documentOptions = ['All', ...new Set(allRequests.flatMap(r => r.document_names || []))].sort((a, b) => a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b));

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const pageRecords = filtered.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
    };

    useEffect(() => { setPage(1); }, [query, filter, docFilter, dateFrom, dateTo]);

    const renderRow = (req) => (
        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-mono text-xs font-medium text-emerald-700">{req.tracking_number}</td>
            <td className="px-6 py-4 font-medium text-slate-900">{req.student_name}</td>
            <td className="px-6 py-4 text-slate-700" title={(req.document_names || []).join(', ')}>{(req.document_names || []).join(', ')}</td>
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
            <DashboardLayout title="Request Management" subtitle="Manage submitted credential requests." sidebarItems={registrarSidebarItems} currentUser={user} roleLabel="Administrator" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading requests...</div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Request Management" subtitle="Manage submitted credential requests." sidebarItems={registrarSidebarItems} currentUser={user} roleLabel="Administrator" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-red-500 text-sm">Error: {error}</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Request Management"
            subtitle="Manage submitted credential requests."
            sidebarItems={registrarSidebarItems}
            currentUser={user}
            roleLabel="Administrator"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-200">
                    <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Status
                            <DashboardDropdown
                                options={filterOptions.map(o => ({ label: o, value: o }))}
                                value={filter}
                                onChange={setFilter}
                                placeholder="All"
                                className="w-40"
                            />
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Document
                            <DashboardDropdown
                                options={documentOptions.map(o => ({ label: o, value: o }))}
                                value={docFilter}
                                onChange={setDocFilter}
                                placeholder="All Documents"
                                className="w-48"
                            />
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Date
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} max={dateTo || undefined} className="h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                            <span className="text-slate-400 text-sm">—</span>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} min={dateFrom || undefined} className="h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                            {(dateFrom || dateTo) && (
                                <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer">Clear</button>
                            )}
                        </label>
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
                            title="No Requests Found"
                            subtitle="No credential requests match your current filter."
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
        </DashboardLayout>
    );
}

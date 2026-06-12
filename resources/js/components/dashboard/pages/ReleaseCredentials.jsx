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

const tableHeaders = ['Reference No.', 'Student Name', 'Documents', 'Status', 'Date Requested', 'Date Claimed'];

export default function ReleaseCredentials({ user, onLogout, onNavigate }) {
    const ITEMS_PER_PAGE = 10;
    const [query, setQuery] = useState('');
    const [allRequests, setAllRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);

    const fetchData = () => {
        setLoading(true);
        fetch(`/admin/requests-data?per_page=9999&status=claimed`, { credentials: 'same-origin' })
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

    const filtered = allRequests.filter((req) =>
        req.student_name.toLowerCase().includes(query.toLowerCase()) ||
        req.tracking_number.toLowerCase().includes(query.toLowerCase())
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const pageRecords = filtered.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    const handlePageChange = (np) => {
        if (np >= 1 && np <= totalPages) setPage(np);
    };

    useEffect(() => { setPage(1); }, [query]);

    const renderRow = (req) => (
        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-mono text-xs font-medium text-emerald-700">{req.tracking_number}</td>
            <td className="px-6 py-4 font-medium text-slate-900">{req.student_name}</td>
            <td className="px-6 py-4 text-slate-700 max-w-[200px] truncate" title={(req.document_names || []).join(', ')}>{(req.document_names || []).join(', ')}</td>
            <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
            <td className="px-6 py-4 text-slate-500 text-xs">{req.created_at}</td>
            <td className="px-6 py-4 text-slate-500 text-xs">{req.updated_at || req.created_at}</td>
        </tr>
    );

    if (loading) {
        return (
            <DashboardLayout title="Release Credentials" subtitle="History of claimed credential requests." sidebarItems={registrarSidebarItems} currentUser={user} roleLabel="Administrator" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading requests...</div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Release Credentials" subtitle="History of claimed credential requests." sidebarItems={registrarSidebarItems} currentUser={user} roleLabel="Administrator" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-red-500 text-sm">Error: {error}</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Release Credentials"
            subtitle="History of claimed credential requests."
            sidebarItems={registrarSidebarItems}
            currentUser={user}
            roleLabel="Administrator"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-200">
                    <DashboardSearch
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search claimed requests..."
                    />
                </div>

                <div className="hidden md:block">
                    <DashboardTable
                        headers={tableHeaders}
                        emptyState={
                            <EmptyState
                                icon={Archive}
                                title="No Claimed Credentials"
                                subtitle="Claimed requests will appear here once released."
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
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Archive}
                            title="No Claimed Credentials"
                            subtitle="Claimed requests will appear here once released."
                        />
                    )}
                </div>

                <div className="hidden md:block px-6 py-4 border-t border-slate-100">
                    <DashboardPagination currentPage={page} lastPage={totalPages} onPageChange={handlePageChange} />
                </div>
                <div className="md:hidden px-4 py-3 border-t border-slate-100">
                    <DashboardPagination currentPage={page} lastPage={totalPages} onPageChange={handlePageChange} />
                </div>
            </section>
        </DashboardLayout>
    );
}

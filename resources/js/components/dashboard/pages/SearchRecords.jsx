import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import DashboardSearch from '../DashboardSearch';
import DashboardTable from '../DashboardTable';
import DashboardMobileCard from '../DashboardMobileCard';
import StatusBadge from '../StatusBadge';
import EmptyState from '../EmptyState';
import DashboardPagination from '../DashboardPagination';
import { registrarSidebarItems } from '../config/sidebarItems';

const tableHeaders = ['Reference No.', 'Student Name', 'Documents', 'Payment Status', 'Request Status', 'Date Requested'];

export default function SearchRecords({ user, onLogout, onNavigate }) {
    const ITEMS_PER_PAGE = 10;
    const [query, setQuery] = useState('');
    const [allRecords, setAllRecords] = useState([]);
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
                setAllRecords(json.requests);
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

    const filtered = allRecords.filter((rec) => {
        const q = query.toLowerCase();
        if (!q) return true;
        return (
            rec.student_name.toLowerCase().includes(q) ||
            rec.student_number?.toLowerCase().includes(q) ||
            rec.tracking_number.toLowerCase().includes(q)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const pageRecords = filtered.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
    };

    useEffect(() => { setPage(1); }, [query]);

    const renderRow = (rec) => (
        <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-mono text-xs font-medium text-emerald-700">{rec.tracking_number}</td>
            <td className="px-6 py-4 font-medium text-slate-900">{rec.student_name}</td>
            <td className="px-6 py-4 text-slate-700 max-w-[200px] truncate" title={(rec.document_names || []).join(', ')}>{(rec.document_names || []).join(', ')}</td>
            <td className="px-6 py-4"><StatusBadge status={rec.payment_status} type="payment" /></td>
            <td className="px-6 py-4"><StatusBadge status={rec.status} /></td>
            <td className="px-6 py-4 text-slate-500 text-xs">{rec.created_at}</td>
        </tr>
    );

    if (loading) {
        return (
            <DashboardLayout title="Search Records" subtitle="Search credential request records." sidebarItems={registrarSidebarItems} currentUser={user} roleLabel="Administrator" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading records...</div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Search Records" subtitle="Search credential request records." sidebarItems={registrarSidebarItems} currentUser={user} roleLabel="Administrator" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-red-500 text-sm">Error: {error}</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Search Records"
            subtitle="Search credential request records."
            sidebarItems={registrarSidebarItems}
            currentUser={user}
            roleLabel="Administrator"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200">
                    <DashboardSearch
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by name, student ID, or reference number..."
                    />
                </div>

                <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
                    <p className="text-xs text-slate-500">
                        {filtered.length} record(s) found
                    </p>
                </div>

                <div className="hidden md:block">
                    <DashboardTable
                        headers={tableHeaders}
                        emptyState={
                            <EmptyState
                                icon={Search}
                                title="No Records Found"
                                subtitle="Search for student credential requests using the criteria above."
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
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Search}
                            title="No Records Found"
                            subtitle="Search for student credential requests using the criteria above."
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

import React, { useState, useEffect } from 'react';
import { FileText, LayoutDashboard, Clock, CheckCircle, Search } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import DashboardSearch from '../DashboardSearch';
import DashboardTable from '../DashboardTable';
import DashboardMobileCard from '../DashboardMobileCard';
import StatusBadge from '../StatusBadge';
import EmptyState from '../EmptyState';
import DashboardPagination from '../DashboardPagination';
import { registrarSidebarItems } from '../config/sidebarItems';

const tableHeaders = ['Reference No.', 'Student Name', 'Documents', 'Payment Status', 'Request Status', 'Date Requested'];

const searchOptions = ['Student Name', 'Student ID', 'Reference Number'];

export default function SearchRecords({ user, onLogout, onNavigate }) {
    const [query, setQuery] = useState('');
    const [searchBy, setSearchBy] = useState('Student Name');
    const [records, setRecords] = useState([]);
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
                setRecords(json.requests);
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

    const filtered = records.filter((rec) => {
        const q = query.toLowerCase();
        if (!q) return true;
        switch (searchBy) {
            case 'Student Name':
                return rec.student_name.toLowerCase().includes(q);
            case 'Student ID':
                return rec.student_number?.toLowerCase().includes(q);
            case 'Reference Number':
                return rec.tracking_number.toLowerCase().includes(q);
            default:
                return true;
        }
    });

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
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Search by:</span>
                        {searchOptions.map((option) => (
                            <label
                                key={option}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${searchBy === option
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="searchBy"
                                    value={option}
                                    checked={searchBy === option}
                                    onChange={(e) => setSearchBy(e.target.value)}
                                    className="sr-only"
                                />
                                {option}
                            </label>
                        ))}
                    </div>
                    <DashboardSearch
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Search by ${searchBy.toLowerCase()}...`}
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
                        currentPage={pagination?.current_page || 1}
                        lastPage={pagination?.last_page || 1}
                        onPageChange={handlePageChange}
                    />
                </div>
            </section>
        </DashboardLayout>
    );
}

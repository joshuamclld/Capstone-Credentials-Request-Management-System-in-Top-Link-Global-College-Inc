import React, { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import DashboardSearch from '../DashboardSearch';
import DashboardTable from '../DashboardTable';
import DashboardMobileCard from '../DashboardMobileCard';
import StatusBadge from '../StatusBadge';
import EmptyState from '../EmptyState';
import DashboardPagination from '../DashboardPagination';
import DashboardDropdown from '../../common/DashboardDropdown';
import { cashierSidebarItems } from '../config/sidebarItems';

const tableHeaders = ['Tracking No.', 'Student Name', 'Requested Documents', 'Payment Method', 'Total Fee', 'Payment Status', 'Request Status', 'Date Requested', 'Action'];

const filterOptions = ['All', 'Cash Payments', 'Online Payments'];

export default function PaymentQueue({ user, onLogout, onNavigate }) {
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('All');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    const fetchData = (p) => {
        setLoading(true);
        fetch(`/admin/payments-data?page=${p}&payment_status=pending`, { credentials: 'same-origin' })
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

    const filtered = requests.filter((req) => {
        const matchesSearch = req.student_name.toLowerCase().includes(query.toLowerCase()) ||
            req.tracking_number.toLowerCase().includes(query.toLowerCase());
        const matchesFilter = filter === 'All' ||
            (filter === 'Cash Payments' && req.payment_status === 'unpaid') ||
            (filter === 'Online Payments' && req.payment_status === 'pending_verification');
        return matchesSearch && matchesFilter;
    });

    const renderRow = (req) => (
        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-mono text-xs font-medium text-emerald-700">{req.tracking_number}</td>
            <td className="px-6 py-4 font-medium text-slate-900">{req.student_name}</td>
            <td className="px-6 py-4 text-slate-700 max-w-[180px] truncate" title={(req.document_names || []).join(', ')}>{(req.document_names || []).join(', ')}</td>
            <td className="px-6 py-4 text-xs text-slate-600 capitalize">{req.payment_method || 'N/A'}</td>
            <td className="px-6 py-4 text-sm font-medium text-slate-900">₱{(Number(req.total_fee) || 0).toFixed(2)}</td>
            <td className="px-6 py-4"><StatusBadge status={req.payment_status} type="payment" /></td>
            <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
            <td className="px-6 py-4 text-slate-500 text-xs">{req.created_at}</td>
            <td className="px-6 py-4">
                <button
                    onClick={() => onNavigate(`/cashier/payments/${req.id}`)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
                >
                    Verify Payment
                </button>
            </td>
        </tr>
    );

    if (loading) {
        return (
            <DashboardLayout title="Payment Queue" subtitle="Verify pending payments." sidebarItems={cashierSidebarItems} currentUser={user} roleLabel="Cashier / Accounting" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading payment queue...</div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Payment Queue" subtitle="Verify pending payments." sidebarItems={cashierSidebarItems} currentUser={user} roleLabel="Cashier / Accounting" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-red-500 text-sm">Error: {error}</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Payment Queue"
            subtitle="Verify pending payments."
            sidebarItems={cashierSidebarItems}
            currentUser={user}
            roleLabel="Cashier / Accounting"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-200">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <DashboardDropdown
                            options={filterOptions.map(o => ({ label: o, value: o }))}
                            value={filter}
                            onChange={setFilter}
                            placeholder="Filter"
                            className="w-44"
                        />
                        <DashboardSearch
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search payments..."
                        />
                    </div>
                </div>

                <div className="hidden md:block">
                    <DashboardTable
                        headers={tableHeaders}
                        emptyState={
                            <EmptyState
                                icon={CreditCard}
                                title="No Pending Payments"
                                subtitle="All payments have been verified. New requests will appear here."
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
                                        { label: 'Method', value: item.payment_method || 'N/A' },
                                        { label: 'Fee', value: `₱${(Number(item.total_fee) || 0).toFixed(2)}` },
                                        { label: 'Status', value: <StatusBadge status={item.payment_status} type="payment" /> },
                                        { label: 'Request', value: <StatusBadge status={item.status} /> },
                                        { label: 'Date', value: item.created_at },
                                    ]}
                                    actionLabel="Verify Payment"
                                    onAction={() => onNavigate(`/cashier/payments/${item.id}`)}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={CreditCard}
                            title="No Pending Payments"
                            subtitle="All payments have been verified. New requests will appear here."
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

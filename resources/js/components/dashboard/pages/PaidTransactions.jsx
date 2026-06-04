import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Clock, CheckCircle, Search, CreditCard } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import DashboardSearch from '../DashboardSearch';
import DashboardTable from '../DashboardTable';
import EmptyState from '../EmptyState';
import DashboardPagination from '../DashboardPagination';

const tableHeaders = ['Tracking No.', 'Student Name', 'Amount Paid', 'Payment Method', 'Date Paid', 'Action'];

const sidebarItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/cashier-dashboard' },
    { label: 'Payment Queue', icon: Clock, path: '/cashier/payments' },
    { label: 'Paid Transactions', icon: CheckCircle, path: '/cashier/transactions' },
];

export default function PaidTransactions({ user, onLogout, onNavigate }) {
    const [query, setQuery] = useState('');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    const fetchData = (p) => {
        setLoading(true);
        fetch(`/admin/payments-data?page=${p}`, { credentials: 'same-origin' })
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

    const paid = requests.filter((req) => req.payment_status === 'paid');

    const filtered = paid.filter((req) =>
        req.student_name.toLowerCase().includes(query.toLowerCase()) ||
        req.tracking_number.toLowerCase().includes(query.toLowerCase())
    );

    const renderRow = (req) => (
        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-mono text-xs font-medium text-emerald-700">{req.tracking_number}</td>
            <td className="px-6 py-4 font-medium text-slate-900">{req.student_name}</td>
            <td className="px-6 py-4 text-sm font-medium text-emerald-700">₱{Number(req.total_fee).toFixed(2)}</td>
            <td className="px-6 py-4 text-xs text-slate-600 capitalize">{req.payment_method || 'N/A'}</td>
            <td className="px-6 py-4 text-slate-500 text-xs">{req.created_at}</td>
            <td className="px-6 py-4">
                <button
                    onClick={() => onNavigate(`/cashier/payments/${req.id}`)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
                >
                    View
                </button>
            </td>
        </tr>
    );

    if (loading) {
        return (
            <DashboardLayout title="Paid Transactions" subtitle="Completed payment transactions." sidebarItems={sidebarItems} currentUser={user} roleLabel="Cashier / Accounting" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading transactions...</div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Paid Transactions" subtitle="Completed payment transactions." sidebarItems={sidebarItems} currentUser={user} roleLabel="Cashier / Accounting" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-red-500 text-sm">Error: {error}</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Paid Transactions"
            subtitle="Completed payment transactions."
            sidebarItems={sidebarItems}
            currentUser={user}
            roleLabel="Cashier / Accounting"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-200">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Completed Payments</h2>
                        <p className="text-xs text-slate-500 mt-0.5">All payments that have been verified and marked as paid.</p>
                    </div>
                    <DashboardSearch
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search transactions..."
                    />
                </div>

                <DashboardTable
                    headers={tableHeaders}
                    emptyState={
                        <EmptyState
                            icon={CheckCircle}
                            title="No Paid Transactions"
                            subtitle="Verified payments will appear here."
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
        </DashboardLayout>
    );
}

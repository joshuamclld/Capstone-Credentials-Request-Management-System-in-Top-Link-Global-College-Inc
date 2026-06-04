import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Clock, CheckCircle, Search, CreditCard } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import DashboardSearch from '../DashboardSearch';
import DashboardTable from '../DashboardTable';
import StatusBadge from '../StatusBadge';
import EmptyState from '../EmptyState';
import DashboardPagination from '../DashboardPagination';

const tableHeaders = ['Tracking No.', 'Student Name', 'Requested Documents', 'Payment Method', 'Total Fee', 'Payment Status', 'Date Requested', 'Action'];

const filterOptions = ['All', 'Cash Payments', 'Online Verification'];

const sidebarItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/cashier-dashboard' },
    { label: 'Payment Queue', icon: Clock, path: '/cashier/payments' },
    { label: 'Paid Transactions', icon: CheckCircle, path: '/cashier/transactions' },
];

const paymentBadgeStyle = {
    'unpaid': 'bg-red-50 text-red-700 border-red-200',
    'pending_verification': 'bg-orange-50 text-orange-700 border-orange-200',
    'paid': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

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

    const paymentBadgeClass = (s) => paymentBadgeStyle[s] || 'bg-slate-100 text-slate-700 border-slate-200';

    const queue = requests.filter(
        (req) => req.payment_status === 'unpaid' || req.payment_status === 'pending_verification'
    );

    const filtered = queue.filter((req) => {
        const matchesSearch = req.student_name.toLowerCase().includes(query.toLowerCase()) ||
            req.tracking_number.toLowerCase().includes(query.toLowerCase());
        const matchesFilter = filter === 'All' ||
            (filter === 'Cash Payments' && req.payment_status === 'unpaid') ||
            (filter === 'Online Verification' && req.payment_status === 'pending_verification');
        return matchesSearch && matchesFilter;
    });

    const renderRow = (req) => (
        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-mono text-xs font-medium text-emerald-700">{req.tracking_number}</td>
            <td className="px-6 py-4 font-medium text-slate-900">{req.student_name}</td>
            <td className="px-6 py-4 text-slate-700 max-w-[180px] truncate" title={req.document_names.join(', ')}>{req.document_names.join(', ')}</td>
            <td className="px-6 py-4 text-xs text-slate-600 capitalize">{req.payment_method || 'N/A'}</td>
            <td className="px-6 py-4 text-sm font-medium text-slate-900">₱{Number(req.total_fee).toFixed(2)}</td>
            <td className="px-6 py-4"><span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${paymentBadgeClass(req.payment_status)}`}>{req.payment_status === 'pending_verification' ? 'Pending Verification' : 'Unpaid'}</span></td>
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
            <DashboardLayout title="Payment Queue" subtitle="Verify pending payments." sidebarItems={sidebarItems} currentUser={user} roleLabel="Cashier / Accounting" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading payment queue...</div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Payment Queue" subtitle="Verify pending payments." sidebarItems={sidebarItems} currentUser={user} roleLabel="Cashier / Accounting" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-red-500 text-sm">Error: {error}</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Payment Queue"
            subtitle="Verify pending payments."
            sidebarItems={sidebarItems}
            currentUser={user}
            roleLabel="Cashier / Accounting"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-200">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Pending Payments</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Requests waiting for payment verification.</p>
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
                            placeholder="Search payments..."
                        />
                    </div>
                </div>

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
                <DashboardPagination
                    currentPage={pagination?.current_page || 1}
                    lastPage={pagination?.last_page || 1}
                    onPageChange={handlePageChange}
                />
            </section>
        </DashboardLayout>
    );
}

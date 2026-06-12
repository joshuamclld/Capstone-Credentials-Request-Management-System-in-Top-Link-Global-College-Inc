import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, CreditCard, DollarSign } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import DashboardStatCard from '../DashboardStatCard';
import DashboardSearch from '../DashboardSearch';
import DashboardTable from '../DashboardTable';
import DashboardMobileCard from '../DashboardMobileCard';
import StatusBadge from '../StatusBadge';
import EmptyState from '../EmptyState';
import DashboardPagination from '../DashboardPagination';
import { cashierSidebarItems } from '../config/sidebarItems';
import { getPaymentStatusConfig } from '../../../utils/statusConfig';

const statDefs = [
    { label: 'Pending Payments', key: 'pending_payments', icon: Clock, iconBg: 'bg-red-50', iconColor: 'text-red-700' },
    { label: 'Online Payments', key: 'pending_verification', icon: CreditCard, iconBg: 'bg-orange-50', iconColor: 'text-orange-700' },
    { label: 'Paid Today', key: 'paid_today', icon: DollarSign, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-700' },
    { label: 'Total Paid Requests', key: 'total_paid', icon: CheckCircle, iconBg: 'bg-blue-50', iconColor: 'text-blue-700' },
];

const tableHeaders = ['Tracking No.', 'Student Name', 'Payment Method', 'Total Fee', 'Payment Status', 'Request Status', 'Action'];

export default function CashierDashboard({ user, onLogout, onNavigate }) {
    const ITEMS_PER_PAGE = 10;
    const [query, setQuery] = useState('');
    const [data, setData] = useState({ stats: null, requests: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(true);
    const [toggling, setToggling] = useState(false);

    const fetchOnlinePaymentStatus = () => {
        fetch('/admin/cashier/online-payment-status', { credentials: 'same-origin' })
            .then(r => r.json())
            .then(d => setOnlinePaymentEnabled(d.enabled))
            .catch(err => console.error('Failed to fetch online payment status:', err));
    };

    const fetchData = () => {
        setLoading(true);
        fetch(`/admin/payments-data?per_page=9999`, { credentials: 'same-origin' })
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then((json) => {
                setData(json);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchData();
        fetchOnlinePaymentStatus();
    }, []);

    const sortedRequests = [...data.requests].sort((a, b) => {
        if (a.status === 'Cancelled' && b.status !== 'Cancelled') return 1;
        if (a.status !== 'Cancelled' && b.status === 'Cancelled') return -1;
        return 0;
    });

    const filtered = sortedRequests.filter((req) =>
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

    const handleToggleOnlinePayment = () => {
        if (toggling) return;
        setToggling(true);
        const newValue = !onlinePaymentEnabled;
        fetch('/admin/cashier/online-payment-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
            },
            body: JSON.stringify({ enabled: newValue }),
            credentials: 'same-origin',
        })
            .then(r => r.json())
            .then(d => {
                if (d.success) setOnlinePaymentEnabled(d.enabled);
            })
            .catch(err => console.error('Failed to toggle online payment:', err))
            .finally(() => setToggling(false));
    };

    const renderRow = (req) => (
        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-mono text-xs font-medium text-emerald-700">{req.tracking_number}</td>
            <td className="px-6 py-4 font-medium text-slate-900">{req.student_name}</td>
            <td className="px-6 py-4 text-xs text-slate-600 capitalize">{req.payment_method || 'N/A'}</td>
            <td className="px-6 py-4 text-sm font-medium text-slate-900">₱{(Number(req.total_fee) || 0).toFixed(2)}</td>
            <td className="px-6 py-4"><span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${getPaymentStatusConfig(req.status === 'Cancelled' ? 'cancelled' : req.payment_status).className}`}>{getPaymentStatusConfig(req.status === 'Cancelled' ? 'cancelled' : req.payment_status).label}</span></td>
            <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
            <td className="px-6 py-4">
                <button
                    onClick={() => onNavigate(`/cashier/payments/${req.id}`)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
                >
                    View Payment
                </button>
            </td>
        </tr>
    );

    return (
        <DashboardLayout
            title="Cashier Dashboard"
            subtitle="Manage payment verification for credential requests."
            sidebarItems={cashierSidebarItems}
            currentUser={user}
            roleLabel="Cashier / Accounting"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading dashboard data...</div>
            ) : error ? (
                <div className="flex items-center justify-center py-20 text-red-500 text-sm">Error: {error}</div>
            ) : (
                <>
                    <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
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

                    {/* Daily Payment Breakdown */}
                    <section className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Today's Collections</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Daily payment breakdown by method.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
                            <div className="rounded-xl border border-slate-200 bg-orange-50 p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center">
                                        <CreditCard className="w-4 h-4 text-orange-700" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500">Online</p>
                                        <p className="text-sm font-bold text-slate-900">{data.stats?.daily_online_count ?? 0} payment{(data.stats?.daily_online_count ?? 0) !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-orange-800">₱{(Number(data.stats?.daily_online_total) || 0).toFixed(2)}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-emerald-50 p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                                        <DollarSign className="w-4 h-4 text-emerald-700" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500">Cash</p>
                                        <p className="text-sm font-bold text-slate-900">{data.stats?.daily_cash_count ?? 0} payment{(data.stats?.daily_cash_count ?? 0) !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-emerald-800">₱{(Number(data.stats?.daily_cash_total) || 0).toFixed(2)}</p>
                            </div>
                        </div>
                    </section>

                    {/* Online Payment Toggle */}
                    <section className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8">
                        <div className="flex items-center justify-between px-6 py-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Online Payment</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Enable or disable student online payment availability.</p>
                            </div>
                            <button
                                onClick={handleToggleOnlinePayment}
                                disabled={toggling}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 cursor-pointer ${onlinePaymentEnabled ? 'bg-emerald-700' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${onlinePaymentEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </section>

                    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-200">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Recent Payment Requests</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Latest credential payment requests from students.</p>
                            </div>
                            <DashboardSearch
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search payment requests..."
                            />
                        </div>

                        <div className="hidden md:block">
                            <DashboardTable
                                headers={tableHeaders}
                                emptyState={
                                    <EmptyState
                                        icon={CreditCard}
                                        title="No Payment Requests"
                                        subtitle="Student payment requests will appear here."
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
                                                { label: 'Method', value: item.payment_method || 'N/A' },
                                                { label: 'Fee', value: `₱${(Number(item.total_fee) || 0).toFixed(2)}` },
                                                { label: 'Status', value: <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${getPaymentStatusConfig(item.status === 'Cancelled' ? 'cancelled' : item.payment_status).className}`}>{getPaymentStatusConfig(item.status === 'Cancelled' ? 'cancelled' : item.payment_status).label}</span> },
                                                { label: 'Request', value: <StatusBadge status={item.status} /> },
                                            ]}
                                            actionLabel="View Payment"
                                            onAction={() => onNavigate(`/cashier/payments/${item.id}`)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={CreditCard}
                                    title="No Payment Requests"
                                    subtitle="Student payment requests will appear here."
                                />
                            )}
                        </div>

                        <div className="hidden md:block px-6 py-4 border-t border-slate-100">
                            <DashboardPagination
                                currentPage={page}
                                lastPage={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                        <div className="md:hidden px-4 py-3 border-t border-slate-100">
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

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Clock, CheckCircle, Search, CreditCard, DollarSign } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import DashboardStatCard from '../DashboardStatCard';
import DashboardSearch from '../DashboardSearch';
import DashboardTable from '../DashboardTable';
import StatusBadge from '../StatusBadge';
import EmptyState from '../EmptyState';

const statDefs = [
    { label: 'Pending Payments', key: 'pending_payments', icon: Clock, iconBg: 'bg-red-50', iconColor: 'text-red-700' },
    { label: 'Online Verification', key: 'pending_verification', icon: CreditCard, iconBg: 'bg-orange-50', iconColor: 'text-orange-700' },
    { label: 'Paid Today', key: 'paid_today', icon: DollarSign, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-700' },
    { label: 'Total Paid Requests', key: 'total_paid', icon: CheckCircle, iconBg: 'bg-blue-50', iconColor: 'text-blue-700' },
];

const tableHeaders = ['Tracking No.', 'Student Name', 'Payment Method', 'Total Fee', 'Payment Status', 'Action'];

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

export default function CashierDashboard({ user, onLogout, onNavigate }) {
    const [query, setQuery] = useState('');
    const [data, setData] = useState({ stats: null, requests: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/admin/payments-data', { credentials: 'same-origin' })
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
    }, []);

    const filtered = data.requests.filter((req) =>
        req.student_name.toLowerCase().includes(query.toLowerCase()) ||
        req.tracking_number.toLowerCase().includes(query.toLowerCase())
    );

    const paymentBadgeClass = (s) => paymentBadgeStyle[s] || 'bg-slate-100 text-slate-700 border-slate-200';

    const renderRow = (req) => (
        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-mono text-xs font-medium text-emerald-700">{req.tracking_number}</td>
            <td className="px-6 py-4 font-medium text-slate-900">{req.student_name}</td>
            <td className="px-6 py-4 text-xs text-slate-600 capitalize">{req.payment_method || 'N/A'}</td>
            <td className="px-6 py-4 text-sm font-medium text-slate-900">₱{Number(req.total_fee).toFixed(2)}</td>
            <td className="px-6 py-4"><span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${paymentBadgeClass(req.payment_status)}`}>{req.payment_status === 'pending_verification' ? 'Pending Verification' : req.payment_status === 'unpaid' ? 'Unpaid' : 'Paid'}</span></td>
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
            sidebarItems={sidebarItems}
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
                            {filtered.map(renderRow)}
                        </DashboardTable>
                    </section>
                </>
            )}
        </DashboardLayout>
    );
}

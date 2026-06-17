import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, CreditCard, DollarSign, X, User, BookOpen, ShieldCheck, FileText } from 'lucide-react';
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
    { label: 'Paid This Month', key: 'total_paid', icon: CheckCircle, iconBg: 'bg-blue-50', iconColor: 'text-blue-700' },
];

const tableHeaders = ['Tracking No.', 'Student Name', 'Payment Method', 'Total Fee', 'Payment Status', 'Request Status', 'Action'];

export default function CashierDashboard({ user, onLogout, onNavigate }) {
    const ITEMS_PER_PAGE = 10;
    const [query, setQuery] = useState('');
    const [data, setData] = useState({ stats: null, requests: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState(null);
    const [details, setDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const fetchData = (isInitial = false) => {
        if (isInitial) setLoading(true);
        fetch(`/admin/payments-data?per_page=9999&daily=1`, { credentials: 'same-origin' })
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then((json) => {
                setData(json);
                setLoading(false);
            })
            .catch((err) => {
                if (isInitial) setError(err.message);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchData(true);
        const interval = setInterval(() => fetchData(), 10000);
        return () => clearInterval(interval);
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

    const openDetails = (id) => {
        setSelectedId(id);
        setDetails(null);
        setDetailsLoading(true);
        fetch(`/admin/api/requests/${id}`, { credentials: 'same-origin' })
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then((data) => {
                setDetails(data);
                setDetailsLoading(false);
            })
            .catch(() => {
                setDetailsLoading(false);
            });
    };

    const closeDetails = () => {
        setSelectedId(null);
        setDetails(null);
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
                    onClick={() => req.payment_status === 'paid' ? openDetails(req.id) : onNavigate(`/cashier/payments/${req.id}`)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
                >
                    View
                </button>
            </td>
        </tr>
    );

    return (
        <>
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
                            <div className="rounded-xl border border-slate-200 bg-emerald-50 p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                                        <span className="w-4 h-4 text-emerald-700 font-bold text-sm flex items-center justify-center">₱</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500">Cash</p>
                                        <p className="text-sm font-bold text-slate-900">{data.stats?.daily_cash_count ?? 0} payment{(data.stats?.daily_cash_count ?? 0) !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-emerald-800">₱{(Number(data.stats?.daily_cash_total) || 0).toFixed(2)}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-blue-50 p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <span className="w-4 h-4 text-blue-700 font-bold text-sm flex items-center justify-center">GC</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500">Online (GCash / Maya)</p>
                                        <p className="text-sm font-bold text-slate-900">{data.stats?.daily_online_count ?? 0} payment{(data.stats?.daily_online_count ?? 0) !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-blue-800">₱{(Number(data.stats?.daily_online_total) || 0).toFixed(2)}</p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-200">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Today's Payment Requests</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Payment requests submitted today.</p>
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
                                            actionLabel="View"
                                            onAction={() => item.payment_status === 'paid' ? openDetails(item.id) : onNavigate(`/cashier/payments/${item.id}`)}
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

        {selectedId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeDetails}>
                <div className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
                    <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 rounded-t-2xl">
                        <h2 className="text-lg font-bold text-slate-900">Transaction Details</h2>
                        <button onClick={closeDetails} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    {detailsLoading ? (
                        <div className="flex items-center justify-center py-16 text-slate-500 text-sm">Loading details...</div>
                    ) : details ? (
                        <div className="px-6 py-5 space-y-5">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-emerald-800">Payment Verified</p>
                                        {details.verified_by && (
                                            <div className="mt-1.5 space-y-0.5">
                                                <p className="text-xs text-emerald-600">Verified By: {details.verified_by}</p>
                                                {details.verified_at && (
                                                    <p className="text-xs text-emerald-600">Verified At: {new Date(details.verified_at).toLocaleString()}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <User className="w-4 h-4 text-emerald-700" />
                                        <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Student Information</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-bold text-slate-900">{details.student_name}</p>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                            <div><span className="text-slate-400">ID:</span> <span className="font-mono text-slate-800">{details.student_number}</span></div>
                                            <div><span className="text-slate-400">Course:</span> <span className="text-slate-800">{details.course}</span></div>
                                            <div><span className="text-slate-400">Year:</span> <span className="text-slate-800">{details.year_level || '-'}</span></div>
                                            <div><span className="text-slate-400">Section:</span> <span className="text-slate-800">{details.section || '-'}</span></div>
                                            <div className="col-span-2"><span className="text-slate-400">Email:</span> <span className="text-slate-800">{details.email}</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CreditCard className="w-4 h-4 text-emerald-700" />
                                        <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Payment Summary</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-2xl font-bold text-emerald-700">₱{Number(details.total_fee ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between"><span className="text-slate-400">Method:</span><span className="text-slate-800 capitalize">{details.payment_method || 'N/A'}</span></div>
                                            <div className="flex justify-between"><span className="text-slate-400">Date Paid:</span><span className="text-slate-800">{details.created_at}</span></div>
                                            <div className="flex justify-between"><span className="text-slate-400">Status:</span><StatusBadge status="paid" type="payment" /></div>
                                            <div className="flex justify-between"><span className="text-slate-400">Request:</span><StatusBadge status={details.status} /></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <BookOpen className="w-4 h-4 text-emerald-700" />
                                    <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Requested Documents</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(details.document_names || []).map((name, i) => (
                                        <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
                                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                            {name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-16 text-red-500 text-sm">Failed to load details.</div>
                    )}
                </div>
            </div>
        )}
        </>
    );
}

import React, { useState, useEffect } from 'react';
import { CheckCircle, X, User, BookOpen, CreditCard, ShieldCheck, FileText, Calendar } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import DashboardSearch from '../DashboardSearch';
import DashboardTable from '../DashboardTable';
import DashboardMobileCard from '../DashboardMobileCard';
import EmptyState from '../EmptyState';
import DashboardPagination from '../DashboardPagination';
import StatusBadge from '../StatusBadge';
import { cashierSidebarItems } from '../config/sidebarItems';

const tableHeaders = ['Tracking No.', 'Student Name', 'Amount Paid', 'Payment Method', 'Date Paid', 'Action'];

export default function PaidTransactions({ user, onLogout, onNavigate }) {
    const ITEMS_PER_PAGE = 10;
    const [query, setQuery] = useState('');
    const [allRequests, setAllRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState(null);
    const [details, setDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const buildUrl = () => {
        let url = '/admin/payments-data?per_page=9999&payment_status=paid';
        if (dateFrom && dateTo) {
            url += `&date_from=${encodeURIComponent(dateFrom)}&date_to=${encodeURIComponent(dateTo)}`;
        }
        return url;
    };

    const fetchData = () => {
        setLoading(true);
        fetch(buildUrl(), { credentials: 'same-origin' })
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
    }, [dateFrom, dateTo]);

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

    const paid = allRequests.filter((req) => req.payment_status === 'paid');

    const filtered = paid.filter((req) =>
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

    useEffect(() => { setPage(1); }, [query, dateFrom, dateTo]);

    const renderRow = (req) => (
        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-mono text-xs font-medium text-emerald-700">{req.tracking_number}</td>
            <td className="px-6 py-4 font-medium text-slate-900">{req.student_name}</td>
            <td className="px-6 py-4 text-sm font-medium text-emerald-700">₱{(Number(req.total_fee) || 0).toFixed(2)}</td>
            <td className="px-6 py-4 text-xs text-slate-600 capitalize">{req.payment_method || 'N/A'}</td>
            <td className="px-6 py-4 text-slate-500 text-xs">{req.created_at}</td>
            <td className="px-6 py-4">
                <button
                    onClick={() => openDetails(req.id)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
                >
                    View
                </button>
            </td>
        </tr>
    );

    const rangeLabel = dateFrom && dateTo
        ? `Completed payment transactions. Filtered: ${dateFrom} — ${dateTo}`
        : 'Completed payment transactions.';

    if (loading) {
        return (
            <DashboardLayout title="Paid Transactions" subtitle={rangeLabel} sidebarItems={cashierSidebarItems} currentUser={user} roleLabel="Cashier / Accounting" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading transactions...</div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Paid Transactions" subtitle={rangeLabel} sidebarItems={cashierSidebarItems} currentUser={user} roleLabel="Cashier / Accounting" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-red-500 text-sm">Error: {error}</div>
            </DashboardLayout>
        );
    }

    return (
        <>
            <DashboardLayout
                title="Paid Transactions"
                subtitle={rangeLabel}
                sidebarItems={cashierSidebarItems}
                currentUser={user}
                roleLabel="Cashier / Accounting"
                onLogout={onLogout}
                onNavigate={onNavigate}
            >
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-bold text-slate-900">Filter by Date</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-emerald-400"
                        />
                        <span className="text-xs text-slate-400">to</span>
                        <input
                            type="date"
                            value={dateTo}
                            min={dateFrom}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-emerald-400"
                        />
                        {(dateFrom || dateTo) && (
                            <button
                                onClick={() => { setDateFrom(''); setDateTo(''); }}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
                            >
                                All
                            </button>
                        )}
                    </div>
                </div>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-200">
                    <DashboardSearch
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search transactions..."
                    />
                </div>

                <div className="hidden md:block">
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
                                        { label: 'Amount', value: `₱${(Number(item.total_fee) || 0).toFixed(2)}` },
                                        { label: 'Method', value: item.payment_method || 'N/A' },
                                        { label: 'Date', value: item.created_at },
                                    ]}
                                    actionLabel="View"
                                    onAction={() => openDetails(item.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={CheckCircle}
                            title="No Paid Transactions"
                            subtitle="Verified payments will appear here."
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

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Users, Settings, ChartColumn, DollarSign, RefreshCw, TrendingUp, Clock, CheckCircle, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '../../DashboardLayout';
import DashboardStatCard from '../../DashboardStatCard';
import EmptyState from '../../EmptyState';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const statDefs = [
    { label: 'Total Requests', key: 'total_requests', icon: FileText, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-700' },
    { label: 'Total Paid', key: 'total_paid', icon: CheckCircle, iconBg: 'bg-blue-50', iconColor: 'text-blue-700' },
    { label: 'Total Revenue', key: 'total_revenue', icon: DollarSign, iconBg: 'bg-green-50', iconColor: 'text-green-700' },
    { label: 'Average Fee', key: 'average_fee', icon: TrendingUp, iconBg: 'bg-purple-50', iconColor: 'text-purple-700' },
    { label: 'This Month', key: 'this_month', icon: Clock, iconBg: 'bg-orange-50', iconColor: 'text-orange-700' },
    { label: 'Month Revenue', key: 'this_month_revenue', icon: DollarSign, iconBg: 'bg-yellow-50', iconColor: 'text-yellow-700' },
];

const sidebarItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/system-admin-dashboard' },
    { label: 'User Management', icon: Users, path: '/system-admin/users' },
    { label: 'Credential Types', icon: FileText, path: '/system-admin/credentials' },
    { label: 'Reports & Analytics', icon: ChartColumn, path: '/system-admin/reports' },
    { label: 'Audit Logs', icon: RefreshCw, path: '/system-admin/audit-logs' },
    { label: 'Settings', icon: Settings, path: '/system-admin/settings' },
];

const STATUS_COLORS = { Pending: '#d97706', Processing: '#2563eb', 'Ready for Release': '#7c3aed', Claimed: '#64748b' };

const shortMonth = (v) => {
    if (!v) return '';
    const p = v.split('-');
    return p.length === 2 ? (MONTHS[parseInt(p[1], 10) - 1] || p[1]) : v;
};

const fullMonth = (v) => {
    if (!v) return '';
    const p = v.split('-');
    if (p.length !== 2) return v;
    return `${MONTHS[parseInt(p[1], 10) - 1] || p[1]} ${p[0]}`;
};

const fmtRevenue = (v) => `₱${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SystemAdminReportsAnalytics({ user, onLogout, onNavigate }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(null);

    useEffect(() => {
        fetch('/admin/system/reports', { credentials: 'same-origin' })
            .then((r) => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
            .then((j) => { setData(j.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const doExport = (format) => {
        setExporting(format);
        const a = document.createElement('a');
        a.href = `/admin/system/reports/export/${format}`;
        a.download = true;
        a.click();
        setTimeout(() => setExporting(null), 1500);
    };

    if (loading) {
        return (
            <DashboardLayout title="Reports & Analytics" subtitle="Loading report data..." sidebarItems={sidebarItems} currentUser={user} roleLabel="System Administrator" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20"><p className="text-slate-400 text-sm">Loading reports...</p></div>
            </DashboardLayout>
        );
    }

    if (!data) {
        return (
            <DashboardLayout title="Reports & Analytics" subtitle="View system-wide reports and analytics." sidebarItems={sidebarItems} currentUser={user} roleLabel="System Administrator" onLogout={onLogout} onNavigate={onNavigate}>
                <EmptyState icon={ChartColumn} title="No Data" subtitle="Report data could not be loaded." />
            </DashboardLayout>
        );
    }

    const stats = {
        total_requests: data.total_requests,
        total_paid: data.total_paid,
        total_revenue: `₱${parseFloat(data.total_revenue).toLocaleString()}`,
        average_fee: `₱${data.average_fee}`,
        this_month: data.this_month,
        this_month_revenue: `₱${parseFloat(data.this_month_revenue).toLocaleString()}`,
    };

    const byType = data.monthly_requests_by_type || [];
    const allTypeKeys = [...new Set(byType.flatMap(m => Object.keys(m).filter(k => k !== 'month')))];

    const credentialTypeData = allTypeKeys
        .map(key => ({ name: key, count: byType.reduce((s, m) => s + (m[key] || 0), 0) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

    const maxCredentialCount = credentialTypeData.length > 0 ? credentialTypeData[0].count : 1;

    const statusData = (data.status_breakdown || []).map(s => ({ name: s.status, count: s.count }));
    const maxStatusCount = Math.max(...statusData.map(s => s.count), 1);

    const revenueData = data.monthly_revenue || [];
    const revenueCount = revenueData.length;

    return (
        <DashboardLayout
            title="Reports & Analytics"
            subtitle="View system-wide reports and analytics."
            sidebarItems={sidebarItems}
            currentUser={user}
            roleLabel="System Administrator"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                {statDefs.map((s) => (
                    <DashboardStatCard key={s.label} title={s.label} value={String(stats[s.key] ?? 0)} icon={s.icon} iconBg={s.iconBg} iconColor={s.iconColor} />
                ))}
            </section>

            {/* Export Card */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-200">
                    <Download className="w-4 h-4 text-emerald-700" />
                    <h2 className="text-sm font-bold text-slate-900">Export Report</h2>
                </div>
                <div className="px-6 py-4">
                    <p className="text-xs text-slate-500 mb-4">Download filtered request data as Excel, CSV, or PDF.</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={() => doExport('excel')} disabled={exporting !== null} className={`flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${exporting === 'excel' ? 'bg-emerald-600' : 'bg-emerald-700 hover:bg-emerald-800'}`}>
                            {exporting === 'excel' ? 'Exporting...' : 'Export Excel'}
                        </button>
                        <button onClick={() => doExport('csv')} disabled={exporting !== null} className={`flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${exporting === 'csv' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'}`}>
                            {exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
                        </button>
                        <button onClick={() => doExport('pdf')} disabled={exporting !== null} className={`flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${exporting === 'pdf' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'}`}>
                            {exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
                        </button>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Requests by Credential Type — Horizontal Ranked Bars */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h2 className="text-sm font-bold text-slate-900">Requests by Credential Type</h2>
                    </div>
                    <div className="p-5">
                        {credentialTypeData.length > 0 ? (
                            <div className="space-y-3">
                                {credentialTypeData.map((item) => {
                                    const pct = (item.count / maxCredentialCount) * 100;
                                    return (
                                        <div key={item.name}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-slate-700 truncate pr-2">{item.name}</span>
                                                <span className="text-xs font-bold text-slate-900 tabular-nums">{item.count}</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-emerald-600 transition-all"
                                                    style={{ width: `${Math.max(pct, item.count > 0 ? 2 : 0)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-8"><EmptyState icon={ChartColumn} title="No Data" subtitle="No request analytics available." /></div>
                        )}
                    </div>
                </section>

                {/* Monthly Revenue — Smart Card or Line Chart */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h2 className="text-sm font-bold text-slate-900">Monthly Revenue</h2>
                    </div>
                    <div className="p-5">
                        {revenueCount === 0 ? (
                            <div className="py-8"><EmptyState icon={DollarSign} title="No Data" subtitle="No revenue data available." /></div>
                        ) : revenueCount === 1 ? (
                            <div className="flex flex-col items-center justify-center py-6">
                                <p className="text-3xl sm:text-4xl font-bold text-emerald-700 tracking-tight">{fmtRevenue(revenueData[0].revenue)}</p>
                                <p className="text-xs text-slate-500 mt-1.5">Revenue for {fullMonth(revenueData[0].month)}</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={240}>
                                <LineChart data={revenueData} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="month" tickFormatter={shortMonth} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${v}`} width={50} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(v) => [fmtRevenue(v), 'Revenue']}
                                        labelFormatter={(v) => fullMonth(v)}
                                    />
                                    <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2.5} dot={{ fill: '#059669', strokeWidth: 2, r: 3 }} activeDot={{ r: 5, fill: '#059669' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </section>

                {/* Status Breakdown — Compact Progress Bars */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h2 className="text-sm font-bold text-slate-900">Status Breakdown</h2>
                    </div>
                    <div className="p-5">
                        {statusData.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {statusData.map((item) => {
                                    const pct = (item.count / maxStatusCount) * 100;
                                    return (
                                        <div key={item.name} className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-2xl font-bold text-slate-900 tabular-nums">{item.count}</p>
                                            <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{ width: `${Math.max(pct, item.count > 0 ? 5 : 0)}%`, backgroundColor: STATUS_COLORS[item.name] || '#94a3b8' }}
                                                />
                                            </div>
                                            <p className="text-[11px] font-medium text-slate-500 mt-2">{item.name}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-8"><EmptyState icon={ChartColumn} title="No Data" subtitle="No status breakdown data available." /></div>
                        )}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}

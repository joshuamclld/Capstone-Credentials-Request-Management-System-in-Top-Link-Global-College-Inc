import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Users, Settings, ChartColumn, DollarSign, RefreshCw, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import DashboardLayout from '../../DashboardLayout';
import DashboardStatCard from '../../DashboardStatCard';
import EmptyState from '../../EmptyState';

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

export default function SystemAdminReportsAnalytics({ user, onLogout, onNavigate }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/admin/system/reports', { credentials: 'same-origin' })
            .then((r) => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
            .then((j) => { setData(j.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200">
                        <h2 className="text-base font-bold text-slate-900">Monthly Requests</h2>
                    </div>
                    <div className="p-6">
                        {data.monthly_requests?.length > 0 ? (
                            <div className="space-y-2">
                                {data.monthly_requests.map((r) => (
                                    <div key={r.month} className="flex items-center gap-3">
                                        <span className="text-xs font-mono text-slate-500 w-16">{r.month}</span>
                                        <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${Math.min(100, (r.count / Math.max(...data.monthly_requests.map((x) => x.count))) * 100)}%` }} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 w-8 text-right">{r.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <EmptyState icon={ChartColumn} title="No Data" subtitle="No monthly request data available." />}
                    </div>
                </section>

                <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200">
                        <h2 className="text-base font-bold text-slate-900">Monthly Revenue</h2>
                    </div>
                    <div className="p-6">
                        {data.monthly_revenue?.length > 0 ? (
                            <div className="space-y-2">
                                {data.monthly_revenue.map((r) => (
                                    <div key={r.month} className="flex items-center gap-3">
                                        <span className="text-xs font-mono text-slate-500 w-16">{r.month}</span>
                                        <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${Math.min(100, (parseFloat(r.revenue) / Math.max(...data.monthly_revenue.map((x) => parseFloat(x.revenue)))) * 100)}%` }} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 text-right">₱{parseFloat(r.revenue).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <EmptyState icon={DollarSign} title="No Data" subtitle="No monthly revenue data available." />}
                    </div>
                </section>

                <section className="bg-white rounded-xl border border-slate-200 overflow-hidden lg:col-span-2">
                    <div className="px-6 py-5 border-b border-slate-200">
                        <h2 className="text-base font-bold text-slate-900">Status Breakdown</h2>
                    </div>
                    <div className="p-6">
                        {data.status_breakdown?.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                {data.status_breakdown.map((s) => (
                                    <div key={s.status} className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-2xl font-bold text-emerald-700">{s.count}</p>
                                        <p className="text-xs text-slate-500 mt-1">{s.status}</p>
                                    </div>
                                ))}
                            </div>
                        ) : <EmptyState icon={ChartColumn} title="No Data" subtitle="No status breakdown data available." />}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}

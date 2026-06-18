import React, { useState, useEffect } from 'react';
import { FileText, Users, Clock, RefreshCw, ChartColumn, Shield, GraduationCap } from 'lucide-react';
import DashboardLayout from '../../DashboardLayout';
import DashboardStatCard from '../../DashboardStatCard';
import DashboardSearch from '../../DashboardSearch';
import EmptyState from '../../EmptyState';
import { systemAdminSidebarItems } from '../../config/sidebarItems';

const statDefs = [
    { label: 'Total Users', key: 'total_users', icon: Users, iconBg: 'bg-blue-50', iconColor: 'text-blue-700' },
    { label: 'Total Students', key: 'total_students', icon: GraduationCap, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-700' },
    { label: 'Total Requests', key: 'total_requests', icon: FileText, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-700' },
    { label: 'Pending Requests', key: 'pending_requests', icon: Clock, iconBg: 'bg-orange-50', iconColor: 'text-orange-700' },
    { label: 'Active Credentials', key: 'total_documents', icon: Shield, iconBg: 'bg-purple-50', iconColor: 'text-purple-700' },
];



export default function SystemAdminDashboard({ user, onLogout, onNavigate }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/admin/system-dashboard-data', { credentials: 'same-origin' })
            .then((r) => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
            .then((j) => { setData(j.data); setLoading(false); })
            .catch((e) => { setError(e.message); setLoading(false); });
    }, []);

    if (loading) {
        return (
            <DashboardLayout title="System Dashboard" subtitle="Loading system overview..." sidebarItems={systemAdminSidebarItems} currentUser={user} roleLabel="System Administrator" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20"><p className="text-slate-400 text-sm">Loading dashboard data...</p></div>
            </DashboardLayout>
        );
    }

    if (error || !data) {
        return (
            <DashboardLayout title="System Dashboard" subtitle="Monitor and manage the entire CRMS system." sidebarItems={systemAdminSidebarItems} currentUser={user} roleLabel="System Administrator" onLogout={onLogout} onNavigate={onNavigate}>
                <EmptyState icon={RefreshCw} title="Failed to Load" subtitle={error || 'Unable to fetch dashboard data.'} />
            </DashboardLayout>
        );
    }

    const stats = {
        total_users: data.total_users,
        total_students: data.total_students,
        total_requests: data.total_requests,
        pending_requests: data.pending_requests,
        total_documents: data.total_documents,
    };

    return (
        <DashboardLayout
            title="System Dashboard"
            subtitle="Monitor and manage the entire CRMS system."
            sidebarItems={systemAdminSidebarItems}
            currentUser={user}
            roleLabel="System Administrator"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
                {statDefs.map((s) => (
                    <DashboardStatCard key={s.label} title={s.label} value={String(stats[s.key] ?? 0)} icon={s.icon} iconBg={s.iconBg} iconColor={s.iconColor} />
                ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200">
                        <h2 className="text-base font-bold text-slate-900">Requests by Month</h2>
                    </div>
                    <div className="p-6">
                        {data.requests_by_month?.length > 0 ? (
                            <div className="space-y-2">
                                {data.requests_by_month.map((r) => (
                                    <div key={r.month} className="flex items-center gap-3">
                                        <span className="text-xs font-mono text-slate-500 w-16">{r.month}</span>
                                        <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-600 rounded-full transition-all"
                                                style={{ width: `${Math.min(100, (r.count / Math.max(...data.requests_by_month.map((x) => x.count))) * 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 w-8 text-right">{r.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState icon={ChartColumn} title="No Data" subtitle="Request data will appear here." />
                        )}
                    </div>
                </section>

                <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200">
                        <h2 className="text-base font-bold text-slate-900">Users by Role</h2>
                    </div>
                    <div className="p-6">
                        {data.users_by_role?.length > 0 ? (
                            <div className="space-y-3">
                                {data.users_by_role.map((r) => (
                                    <div key={r.role} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                        <span className="text-sm font-medium text-slate-700 capitalize">{r.role.replace('_', ' ')}</span>
                                        <span className="text-sm font-bold text-emerald-700">{r.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState icon={Users} title="No Users" subtitle="User data will appear here." />
                        )}
                    </div>
                </section>
            </div>

            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200">
                    <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Latest actions performed across the system.</p>
                </div>
                <div className="p-6">
                    {data.recent_logs?.length > 0 ? (
                        <div className="space-y-1 [&>div:nth-child(3n+1)]:bg-sky-100/75 [&>div:nth-child(3n+2)]:bg-teal-100/75 [&>div:nth-child(3n)]:bg-amber-100/75">
                            {data.recent_logs.map((log) => (
                                <div key={log.id} className="flex items-start gap-3 py-3 px-3 rounded-lg border-b border-slate-50 last:border-0 -mx-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-700">{log.description || log.action}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={RefreshCw} title="No Recent Activity" subtitle="System activity will appear here." />
                    )}
                </div>
            </section>
        </DashboardLayout>
    );
}

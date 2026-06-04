import React, { useState } from 'react';
import {
    FileText,
    Clock,
    CheckCircle,
    LayoutDashboard,
    Search,
    Archive,
    RefreshCw,
} from 'lucide-react';
import DashboardLayout from './dashboard/DashboardLayout';
import DashboardStatCard from './dashboard/DashboardStatCard';
import DashboardSearch from './dashboard/DashboardSearch';
import DashboardTable from './dashboard/DashboardTable';
import StatusBadge from './dashboard/StatusBadge';
import EmptyState from './dashboard/EmptyState';

const stats = [
    { label: 'Total Requests', value: '0', icon: FileText, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-700' },
    { label: 'Pending Payment', value: '0', icon: Clock, iconBg: 'bg-orange-50', iconColor: 'text-orange-700' },
    { label: 'Processing', value: '0', icon: RefreshCw, iconBg: 'bg-blue-50', iconColor: 'text-blue-700' },
    { label: 'Ready for Release', value: '0', icon: CheckCircle, iconBg: 'bg-purple-50', iconColor: 'text-purple-700' },
    { label: 'Claimed', value: '0', icon: Archive, iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
];

const tableHeaders = ['Reference No.', 'Student Name', 'Requested Documents', 'Payment', 'Status', 'Date Requested', 'Action'];

const sidebarItems = [
    { label: 'Dashboard', icon: LayoutDashboard, active: true },
    { label: 'Request Management', icon: FileText },
    { label: 'Process Requests', icon: Clock },
    { label: 'Release Credentials', icon: CheckCircle },
    { label: 'Search Records', icon: Search },
];

export default function Dashboard({ backendStatus, onLogout, user }) {
    const [query, setQuery] = useState('');
    const requests = [];

    return (
        <DashboardLayout
            title="Registrar Dashboard"
            subtitle="Manage and process student credential requests."
            sidebarItems={sidebarItems}
            currentUser={user}
            roleLabel="Administrator"
            onLogout={onLogout}
        >
            <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
                {stats.map((stat) => (
                    <DashboardStatCard
                        key={stat.label}
                        title={stat.label}
                        value={stat.value}
                        icon={stat.icon}
                        iconBg={stat.iconBg}
                        iconColor={stat.iconColor}
                    />
                ))}
            </section>

            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-200">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Student Credential Requests</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Manage and track all document requests from students.</p>
                    </div>
                    <DashboardSearch
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search student requests..."
                    />
                </div>

                <DashboardTable
                    headers={tableHeaders}
                    emptyState={
                        <EmptyState
                            icon={FileText}
                            title="No Student Requests Yet"
                            subtitle="Submitted credential requests will appear here."
                        />
                    }
                >
                    {requests.map((req) => (
                        <tr key={req.ref} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs font-medium text-emerald-700">{req.ref}</td>
                            <td className="px-6 py-4 font-medium text-slate-900">{req.name}</td>
                            <td className="px-6 py-4 text-slate-700 max-w-[200px] truncate" title={req.docs}>{req.docs}</td>
                            <td className="px-6 py-4 text-xs">{req.payment}</td>
                            <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                            <td className="px-6 py-4 text-slate-500 text-xs">{req.date}</td>
                            <td className="px-6 py-4">
                                <button className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer">
                                    View Details
                                </button>
                            </td>
                        </tr>
                    ))}
                </DashboardTable>
            </section>
        </DashboardLayout>
    );
}

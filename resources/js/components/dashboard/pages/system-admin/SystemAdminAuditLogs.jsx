import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Users, Settings, RefreshCw, ChartColumn } from 'lucide-react';
import DashboardLayout from '../../DashboardLayout';
import DashboardSearch from '../../DashboardSearch';
import DashboardTable from '../../DashboardTable';
import DashboardPagination from '../../DashboardPagination';
import EmptyState from '../../EmptyState';

const tableHeaders = ['Action', 'Performed By', 'Target', 'Description', 'Date & Time'];

const sidebarItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/system-admin-dashboard' },
    { label: 'User Management', icon: Users, path: '/system-admin/users' },
    { label: 'Credential Types', icon: FileText, path: '/system-admin/credentials' },
    { label: 'Reports & Analytics', icon: ChartColumn, path: '/system-admin/reports' },
    { label: 'Audit Logs', icon: RefreshCw, path: '/system-admin/audit-logs' },
    { label: 'Settings', icon: Settings, path: '/system-admin/settings' },
];

const actionFilterOptions = ['All', 'update_status', 'update_remarks', 'verify_payment', 'create_user', 'update_user', 'delete_user', 'create_document', 'update_document', 'deactivate_document', 'update_settings'];

export default function SystemAdminAuditLogs({ user, onLogout, onNavigate }) {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [actionFilter, setActionFilter] = useState('All');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    const fetchLogs = (p) => {
        setLoading(true);

        const actionColor = {
            update_status: 'bg-blue-100 text-blue-800',
            update_remarks: 'bg-slate-100 text-slate-800',
            verify_payment: 'bg-emerald-100 text-emerald-800',
            create_user: 'bg-purple-100 text-purple-800',
            update_user: 'bg-indigo-100 text-indigo-800',
            delete_user: 'bg-red-100 text-red-800',
            create_document: 'bg-emerald-100 text-emerald-800',
            update_document: 'bg-blue-100 text-blue-800',
            deactivate_document: 'bg-orange-100 text-orange-800',
            update_settings: 'bg-yellow-100 text-yellow-800',
        };

        const params = new URLSearchParams({ page: p });
        if (debouncedQuery) params.append('search', debouncedQuery);
        if (actionFilter !== 'All') params.append('action', actionFilter);

        fetch(`/admin/system/audit-logs?${params}`, { credentials: 'same-origin' })
            .then((r) => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
            .then((j) => { setLogs(j.data); setPagination(j.pagination); setLoading(false); })
            .catch(() => { setLogs([]); setLoading(false); });
    };

    useEffect(() => { fetchLogs(page); }, [page, debouncedQuery, actionFilter]);

    const handlePageChange = (np) => { if (np >= 1 && pagination && np <= pagination.last_page) setPage(np); };

    const renderRow = (log) => (
        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4">
                <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
                    {log.action.replace(/_/g, ' ')}
                </span>
            </td>
            <td className="px-6 py-4 font-medium text-slate-900">{log.performed_by}</td>
            <td className="px-6 py-4 text-slate-700">
                {log.target_type ? `${log.target_type}#${log.target_id}` : 'System'}
            </td>
            <td className="px-6 py-4 text-slate-600 max-w-[300px] truncate" title={log.description || '-'}>{log.description || '-'}</td>
            <td className="px-6 py-4 text-slate-500 text-xs">{new Date(log.created_at).toLocaleString()}</td>
        </tr>
    );

    const filtered = logs;

    return (
        <DashboardLayout
            title="Audit Logs"
            subtitle="Track all actions performed across the system."
            sidebarItems={sidebarItems}
            currentUser={user}
            roleLabel="System Administrator"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                        <DashboardSearch value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search logs..." />
                        <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer">
                            {actionFilterOptions.map((opt) => (<option key={opt} value={opt}>{opt === 'All' ? 'All Actions' : opt.replace(/_/g, ' ')}</option>))}
                        </select>
                    </div>
                </div>
                {loading ? (
                    <div className="p-6 text-center text-sm text-slate-400">Loading audit logs...</div>
                ) : (
                    <>
                        <DashboardTable headers={tableHeaders} emptyState={<EmptyState icon={RefreshCw} title="No Audit Logs" subtitle="System activity will appear here." />}>
                            {filtered.map(renderRow)}
                        </DashboardTable>
                        {pagination && <DashboardPagination currentPage={pagination.current_page} lastPage={pagination.last_page} onPageChange={handlePageChange} />}
                    </>
                )}
            </section>
        </DashboardLayout>
    );
}

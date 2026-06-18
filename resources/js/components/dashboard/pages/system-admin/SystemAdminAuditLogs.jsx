import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import DashboardLayout from '../../DashboardLayout';
import DashboardSearch from '../../DashboardSearch';
import DashboardTable from '../../DashboardTable';
import DashboardMobileCard from '../../DashboardMobileCard';
import DashboardPagination from '../../DashboardPagination';
import EmptyState from '../../EmptyState';
import DashboardDropdown from '../../../common/DashboardDropdown';
import { systemAdminSidebarItems } from '../../config/sidebarItems';

const tableHeaders = ['Action', 'Performed By', 'Target', 'Description', 'Date & Time'];

const actionFilterOptions = ['All', 'claim_request', 'digital_document_sent', 'update_status', 'update_remarks', 'verify_payment', 'create_user', 'update_user', 'delete_user', 'create_document', 'update_document', 'deactivate_document', 'create_credential_type', 'update_credential_type', 'deactivate_credential_type'];

const actionColors = {
  claim_request: 'bg-purple-100 text-purple-800 border-purple-200',
  digital_document_sent: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  update_status: 'bg-blue-100 text-blue-800 border-blue-200',
  update_remarks: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  verify_payment: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  create_user: 'bg-teal-100 text-teal-800 border-teal-200',
  update_user: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  delete_user: 'bg-red-100 text-red-800 border-red-200',
  create_document: 'bg-amber-100 text-amber-800 border-amber-200',
  update_document: 'bg-orange-100 text-orange-800 border-orange-200',
  deactivate_document: 'bg-rose-100 text-rose-800 border-rose-200',
  create_credential_type: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  update_credential_type: 'bg-teal-100 text-teal-800 border-teal-200',
  deactivate_credential_type: 'bg-red-100 text-red-800 border-red-200',
  create_student: 'bg-violet-100 text-violet-800 border-violet-200',
  toggle_student_status: 'bg-amber-100 text-amber-800 border-amber-200',
  delete_student: 'bg-rose-100 text-rose-800 border-rose-200',
  import_students: 'bg-sky-100 text-sky-800 border-sky-200',
};

export default function SystemAdminAuditLogs({ user, onLogout, onNavigate }) {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [actionFilter, setActionFilter] = useState('All');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    const fetchLogs = (p) => {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({ page: p });
        if (debouncedQuery) params.append('search', debouncedQuery);
        if (actionFilter !== 'All') params.append('action', actionFilter);

        fetch(`/admin/system/audit-logs?${params}`, { credentials: 'same-origin' })
            .then((r) => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
            .then((j) => { setLogs(j.data); setPagination(j.pagination); setLoading(false); })
            .catch((e) => { setError(e.message); setLogs([]); setLoading(false); });
    };

    useEffect(() => { fetchLogs(page); }, [page, debouncedQuery, actionFilter]);

    const handlePageChange = (np) => { if (np >= 1 && pagination && np <= pagination.last_page) setPage(np); };

    const renderRow = (log) => (
        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4">
                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded border ${actionColors[log.action] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
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
            sidebarItems={systemAdminSidebarItems}
            currentUser={user}
            roleLabel="System Administrator"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                        <DashboardSearch value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search logs..." />
                        <DashboardDropdown
                            options={actionFilterOptions.map(o => ({ label: o === 'All' ? 'All Actions' : o.replace(/_/g, ' '), value: o }))}
                            value={actionFilter}
                            onChange={(v) => { setActionFilter(v); setPage(1); }}
                            placeholder="All Actions"
                            className="flex-1 sm:w-64"
                        />
                    </div>
                </div>
                {loading ? (
                    <div className="p-6 text-center text-sm text-slate-400">Loading audit logs...</div>
                ) : error ? (
                    <div className="p-6 text-center text-sm text-red-500">Error: {error}</div>
                ) : (
                    <>
                        <div className="hidden md:block">
                            <DashboardTable headers={tableHeaders} emptyState={<EmptyState icon={RefreshCw} title="No Audit Logs" subtitle="System activity will appear here." />}>
                                {filtered.map(renderRow)}
                            </DashboardTable>
                        </div>

                        <div className="md:hidden">
                            {filtered.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {filtered.map((item) => (
                                    <DashboardMobileCard
                                        key={item.id}
                                        title={<span className={`inline-block text-xs font-bold px-2 py-0.5 rounded border ${actionColors[item.action] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>{item.action.replace(/_/g, ' ')}</span>}
                                        subtitle={item.performed_by}
                                            metadata={[
                                                { label: 'Target', value: item.target_type ? `${item.target_type}#${item.target_id}` : 'System' },
                                                { label: 'Description', value: item.description || '-' },
                                                { label: 'Date & Time', value: new Date(item.created_at).toLocaleString() },
                                            ]}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState icon={RefreshCw} title="No Audit Logs" subtitle="System activity will appear here." />
                            )}
                        </div>

                        {pagination && (
                            <div className="hidden md:block px-6 py-4 border-t border-slate-100">
                                <DashboardPagination currentPage={pagination.current_page} lastPage={pagination.last_page} onPageChange={handlePageChange} />
                            </div>
                        )}
                        {pagination && (
                            <div className="md:hidden px-4 py-3 border-t border-slate-100">
                                <DashboardPagination currentPage={pagination.current_page} lastPage={pagination.last_page} onPageChange={handlePageChange} />
                            </div>
                        )}
                    </>
                )}
            </section>
        </DashboardLayout>
    );
}

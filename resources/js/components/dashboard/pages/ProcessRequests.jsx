import React, { useState, useEffect } from 'react';
import { FileText, LayoutDashboard, Clock, CheckCircle, Search, RefreshCw } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import DashboardSearch from '../DashboardSearch';
import DashboardTable from '../DashboardTable';
import StatusBadge from '../StatusBadge';
import EmptyState from '../EmptyState';

const tableHeaders = ['Reference No.', 'Student Name', 'Documents', 'Current Status', 'Date Requested', 'Action'];

const sidebarItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin-dashboard' },
    { label: 'Request Management', icon: FileText, path: '/admin/requests' },
    { label: 'Process Requests', icon: Clock, path: '/admin/process' },
    { label: 'Release Credentials', icon: CheckCircle, path: '/admin/release' },
    { label: 'Search Records', icon: Search, path: '/admin/search' },
];

export default function ProcessRequests({ user, onLogout, onNavigate }) {
    const [query, setQuery] = useState('');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/admin/requests-data', { credentials: 'same-origin' })
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then((json) => {
                setRequests(json.requests);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    const processable = requests.filter(
        (req) => req.payment_status === 'paid' || req.status === 'Processing'
    );

    const filtered = processable.filter((req) =>
        req.student_name.toLowerCase().includes(query.toLowerCase()) ||
        req.tracking_number.toLowerCase().includes(query.toLowerCase())
    );

    const renderRow = (req) => (
        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-mono text-xs font-medium text-emerald-700">{req.tracking_number}</td>
            <td className="px-6 py-4 font-medium text-slate-900">{req.student_name}</td>
            <td className="px-6 py-4 text-slate-700 max-w-[200px] truncate" title={req.document_names.join(', ')}>{req.document_names.join(', ')}</td>
            <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
            <td className="px-6 py-4 text-slate-500 text-xs">{req.created_at}</td>
            <td className="px-6 py-4">
                <button className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer">
                    Process Request
                </button>
            </td>
        </tr>
    );

    if (loading) {
        return (
            <DashboardLayout title="Process Requests" subtitle="Monitor and process credential requests." sidebarItems={sidebarItems} currentUser={user} roleLabel="Administrator" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading requests...</div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Process Requests" subtitle="Monitor and process credential requests." sidebarItems={sidebarItems} currentUser={user} roleLabel="Administrator" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-red-500 text-sm">Error: {error}</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Process Requests"
            subtitle="Monitor and process credential requests."
            sidebarItems={sidebarItems}
            currentUser={user}
            roleLabel="Administrator"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-200">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Processing Queue</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Requests that are paid or currently being processed.</p>
                    </div>
                    <DashboardSearch
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search requests..."
                    />
                </div>

                <DashboardTable
                    headers={tableHeaders}
                    emptyState={
                        <EmptyState
                            icon={RefreshCw}
                            title="No Requests to Process"
                            subtitle="All requests have been processed. New submissions will appear here."
                        />
                    }
                >
                    {filtered.map(renderRow)}
                </DashboardTable>
            </section>
        </DashboardLayout>
    );
}

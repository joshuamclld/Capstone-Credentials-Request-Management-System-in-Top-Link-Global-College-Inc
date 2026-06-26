import React, { useState, useEffect } from 'react';
import { FileText, Plus, X, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../DashboardLayout';
import DashboardSearch from '../../DashboardSearch';
import DashboardTable from '../../DashboardTable';
import DashboardMobileCard from '../../DashboardMobileCard';
import DashboardPagination from '../../DashboardPagination';
import StatusBadge from '../../StatusBadge';
import EmptyState from '../../EmptyState';
import { systemAdminSidebarItems } from '../../config/sidebarItems';

const tableHeaders = ['Code', 'Name', 'Price', 'Processing Days', 'Per Semester', 'Per Page', 'Status', 'Action'];



export default function SystemAdminCredentialTypes({ user, onLogout, onNavigate }) {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [editingDoc, setEditingDoc] = useState(null);
    const [formData, setFormData] = useState({ code: '', name: '', description: '', price: '', processing_days: '1', is_per_semester: false, is_per_page: false, is_active: true });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    const fetchDocs = (p) => {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ page: p });
        if (debouncedQuery) params.append('search', debouncedQuery);

        fetch(`/admin/system/documents?${params}`, { credentials: 'same-origin' })
            .then((r) => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
            .then((j) => { setDocs(j.data); setPagination(j.pagination); setLoading(false); })
            .catch((e) => { setError(e.message); setDocs([]); setLoading(false); });
    };

    useEffect(() => { fetchDocs(page); }, [page, debouncedQuery]);

    const handlePageChange = (np) => { if (np >= 1 && pagination && np <= pagination.last_page) setPage(np); };

    const openAddModal = () => {
        setEditingDoc(null);
        setFormData({ code: '', name: '', description: '', price: '', processing_days: '1', is_per_semester: false, is_per_page: false });
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (d) => {
        setEditingDoc(d);
        setFormData({ code: d.code, name: d.name, description: d.description || '', price: String(d.price), processing_days: String(d.processing_days), is_per_semester: d.is_per_semester, is_per_page: d.is_per_page, is_active: d.is_active });
        setFormError('');
        setShowModal(true);
    };

    const handleSubmit = () => {
        if (formLoading) return;
        setFormLoading(true);
        setFormError('');

        const url = editingDoc ? `/admin/system/documents/${editingDoc.id}` : '/admin/system/documents';
        const method = editingDoc ? 'PUT' : 'POST';
        const body = { ...formData, price: parseFloat(formData.price ?? 0) || 0, processing_days: parseInt(formData.processing_days ?? 0) || 0 };

        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
            },
            body: JSON.stringify(body),
            credentials: 'same-origin',
        })
            .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.message || 'Request failed'); return d; })
            .then(() => { setShowModal(false); setEditingDoc(null); fetchDocs(page); })
            .catch((e) => { setFormError(e.message); })
            .finally(() => { setFormLoading(false); });
    };

    const handleDelete = (d) => {
        setDeleteTarget(d);
    };

    const confirmDelete = () => {
        if (!deleteTarget || deleteLoading) return;
        setDeleteLoading(true);
        setDeleteError('');
        fetch(`/admin/system/documents/${deleteTarget.id}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') },
            credentials: 'same-origin',
        })
            .then(async (r) => {
                if (r.ok) {
                    setDeleteTarget(null);
                    fetchDocs(page);
                } else {
                    const d = await r.json();
                    setDeleteError(d.message || 'Failed to deactivate.');
                }
            })
            .catch(() => setDeleteError('Network error.'))
            .finally(() => setDeleteLoading(false));
    };

    const renderRow = (d) => (
        <tr key={d.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-mono text-xs font-medium text-emerald-700">{d.code}</td>
            <td className="px-6 py-4 font-medium text-slate-900">{d.name}</td>
            <td className="px-6 py-4 font-medium text-slate-900">₱{parseFloat(d.price ?? 0).toFixed(2)}</td>
            <td className="px-6 py-4 text-slate-700">{d.processing_days} day{d.processing_days !== 1 ? 's' : ''}</td>
            <td className="px-6 py-4">{d.is_per_semester ? <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Yes</span> : <span className="text-xs text-slate-400">No</span>}</td>
            <td className="px-6 py-4">{d.is_per_page ? <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Yes</span> : <span className="text-xs text-slate-400">No</span>}</td>
            <td className="px-6 py-4"><StatusBadge status={d.is_active ? 'active' : 'inactive'} type="boolean" /></td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-1.5">
                    <button onClick={() => openEditModal(d)} className="p-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    {d.is_active && (
                        <button onClick={() => handleDelete(d)} className="p-1.5 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );

    const renderDeleteModal = () => (
        deleteTarget ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-base font-bold text-slate-900 mb-2">Delete Credential Type</h3>
                    <p className="text-sm text-slate-600 mb-4 sm:mb-6">
                        Are you sure you want to delete <strong className="text-slate-900">&ldquo;{deleteTarget.name}&rdquo;</strong>? This action cannot be undone.
                    </p>
                    {deleteError && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                            <p className="text-xs text-red-600 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {deleteError}
                            </p>
                        </div>
                    )}
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setDeleteTarget(null)} disabled={deleteLoading} className="px-5 py-2.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50">Cancel</button>
                        <button onClick={confirmDelete} disabled={deleteLoading} className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50">
                            {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                    </div>
                </div>
            </div>
        ) : null
    );

    const renderModal = () => (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div className="bg-white rounded-xl border border-slate-200 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
                    <h3 className="text-base font-bold text-slate-900">{editingDoc ? 'Edit Credential Type' : 'Add Credential Type'}</h3>
                    <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 space-y-4">
                    {formError && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Code</label>
                            <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="e.g. diploma" disabled={!!editingDoc} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Display name" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500" rows={2} placeholder="Optional description" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Price (₱)</label>
                            <input type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Processing Days</label>
                            <input type="number" min="1" value={formData.processing_days} onChange={(e) => setFormData({ ...formData, processing_days: e.target.value })} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={formData.is_per_semester} onChange={(e) => setFormData({ ...formData, is_per_semester: e.target.checked })} className="w-4 h-4 text-emerald-700 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer" />
                            <span className="text-xs font-medium text-slate-600">Per Semester</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={formData.is_per_page} onChange={(e) => setFormData({ ...formData, is_per_page: e.target.checked })} className="w-4 h-4 text-emerald-700 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer" />
                            <span className="text-xs font-medium text-slate-600">Per Page</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-xs font-medium text-slate-600">Active</span>
                            <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 text-emerald-700 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer" />
                        </label>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
                    <button onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">Cancel</button>
                    <button onClick={handleSubmit} disabled={formLoading} className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer">
                        {formLoading ? 'Saving...' : editingDoc ? 'Update' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );

    const filtered = docs;

    return (
        <DashboardLayout
            title="Credential Types"
            subtitle="Manage credential/document types available for requests."
            sidebarItems={systemAdminSidebarItems}
            currentUser={user}
            roleLabel="System Administrator"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-200">
                    <DashboardSearch value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search credential types..." />
                    <button onClick={openAddModal} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer shrink-0">
                        <Plus className="w-3.5 h-3.5" />
                        Add Credential Type
                    </button>
                </div>
                {loading ? (
                    <div className="p-6 text-center text-sm text-slate-400">Loading credential types...</div>
                ) : error ? (
                    <div className="p-6 text-center text-sm text-red-500">Error: {error}</div>
                ) : (
                    <>
                        <div className="hidden lg:block">
                            <DashboardTable headers={tableHeaders} emptyState={<EmptyState icon={FileText} title="No Credential Types" subtitle="Credential types will appear here once created." />}>
                                {filtered.map(renderRow)}
                            </DashboardTable>
                        </div>

                        <div className="lg:hidden">
                            {filtered.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {filtered.map((item) => (
                                        <DashboardMobileCard
                                            key={item.id}
                                            title={item.code}
                                            subtitle={item.name}
                                            metadata={[
                                                { label: 'Price', value: `₱${parseFloat(item.price ?? 0).toFixed(2)}` },
                                                { label: 'Processing', value: `${item.processing_days} day${item.processing_days !== 1 ? 's' : ''}` },
                                                { label: 'Per Semester', value: item.is_per_semester ? <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Yes</span> : <span className="text-xs text-slate-400">No</span> },
                                                { label: 'Per Page', value: item.is_per_page ? <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Yes</span> : <span className="text-xs text-slate-400">No</span> },
                                                { label: 'Status', value: <StatusBadge status={item.is_active ? 'active' : 'inactive'} type="boolean" /> },
                                            ]}
                                            actions={[
                                                { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>, label: 'Edit', onClick: () => openEditModal(item), className: 'text-white bg-blue-600 hover:bg-blue-700' },
                                                ...(item.is_active ? [{ icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>, label: 'Delete', onClick: () => handleDelete(item), className: 'text-white bg-red-600 hover:bg-red-700' }] : []),
                                            ]}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState icon={FileText} title="No Credential Types" subtitle="Credential types will appear here once created." />
                            )}
                        </div>

                        {pagination && (
                            <div className="hidden lg:block px-6 py-4 border-t border-slate-100">
                                <DashboardPagination currentPage={pagination.current_page} lastPage={pagination.last_page} onPageChange={handlePageChange} />
                            </div>
                        )}
                        {pagination && (
                            <div className="lg:hidden px-4 py-3 border-t border-slate-100">
                                <DashboardPagination currentPage={pagination.current_page} lastPage={pagination.last_page} onPageChange={handlePageChange} />
                            </div>
                        )}
                    </>
                )}
            </section>

            {showModal && renderModal()}
            {renderDeleteModal()}
        </DashboardLayout>
    );
}

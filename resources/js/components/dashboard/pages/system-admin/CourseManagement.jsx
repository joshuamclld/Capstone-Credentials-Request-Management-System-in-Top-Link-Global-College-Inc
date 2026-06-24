import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, X, AlertCircle, Power } from 'lucide-react';
import DashboardLayout from '../../DashboardLayout';
import DashboardTable from '../../DashboardTable';
import DashboardMobileCard from '../../DashboardMobileCard';
import DashboardPagination from '../../DashboardPagination';
import StatusBadge from '../../StatusBadge';
import EmptyState from '../../EmptyState';
import { systemAdminSidebarItems } from '../../config/sidebarItems';

const tableHeaders = ['Course / Program', 'Status', 'Action'];

export default function CourseManagement({ user, onLogout, onNavigate }) {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [formName, setFormName] = useState('');
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const fetchCourses = () => {
        setLoading(true);
        setError(null);
        fetch('/admin/system/courses', { credentials: 'same-origin' })
            .then((r) => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
            .then((j) => { setCourses(j.courses); setLoading(false); })
            .catch((e) => { setError(e.message); setCourses([]); setLoading(false); });
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const filtered = courses;

    const ITEMS_PER_PAGE = 10;
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const pageRecords = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const handlePageChange = (np) => { if (np >= 1 && np <= totalPages) setPage(np); };

    const openAddModal = () => {
        setEditingCourse(null);
        setFormName('');
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (c) => {
        setEditingCourse(c);
        setFormName(c.name);
        setFormError('');
        setShowModal(true);
    };

    const handleSubmit = () => {
        if (formLoading) return;
        setFormLoading(true);
        setFormError('');

        const url = editingCourse ? `/admin/system/courses/${editingCourse.id}` : '/admin/system/courses';
        const method = editingCourse ? 'PUT' : 'POST';

        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
            },
            body: JSON.stringify({ name: formName.trim() }),
            credentials: 'same-origin',
        })
            .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.message || 'Request failed'); return d; })
            .then(() => { setShowModal(false); setEditingCourse(null); fetchCourses(); })
            .catch((e) => { setFormError(e.message); })
            .finally(() => { setFormLoading(false); });
    };

    const toggleStatus = (c) => {
        fetch(`/admin/system/courses/${c.id}/toggle-status`, {
            method: 'PATCH',
            headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') },
            credentials: 'same-origin',
        })
            .then((r) => r.json())
            .then((d) => { if (d.success) fetchCourses(); });
    };

    const handleDelete = (c) => {
        setDeleteTarget(c);
    };

    const confirmDelete = () => {
        if (!deleteTarget || deleteLoading) return;
        setDeleteLoading(true);
        setDeleteError('');
        fetch(`/admin/system/courses/${deleteTarget.id}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') },
            credentials: 'same-origin',
        })
            .then(async (r) => {
                if (r.ok) {
                    setDeleteTarget(null);
                    fetchCourses();
                } else {
                    const d = await r.json();
                    setDeleteError(d.message || 'Failed to delete.');
                }
            })
            .catch(() => setDeleteError('Network error.'))
            .finally(() => setDeleteLoading(false));
    };

    const renderRow = (c) => (
        <tr key={c.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-medium text-slate-900">{c.name}</td>
            <td className="px-6 py-4"><StatusBadge status={c.is_active ? 'active' : 'inactive'} type="boolean" /></td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-1.5">
                    {c.is_active && (
                        <button onClick={() => toggleStatus(c)} className="p-1.5 text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors cursor-pointer" title="Deactivate">
                            <Power className="w-4 h-4" />
                        </button>
                    )}
                    {!c.is_active && (
                        <button onClick={() => toggleStatus(c)} className="p-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer" title="Activate">
                            <Power className="w-4 h-4" />
                        </button>
                    )}
                    <button onClick={() => openEditModal(c)} className="p-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(c)} className="p-1.5 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </td>
        </tr>
    );

    const renderDeleteModal = () => (
        deleteTarget ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-base font-bold text-slate-900 mb-2">Delete Course</h3>
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
                    <h3 className="text-base font-bold text-slate-900">{editingCourse ? 'Edit Course' : 'Add Course'}</h3>
                    <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 space-y-4">
                    {formError && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Course / Program Name</label>
                        <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="e.g. BS in Information Technology" autoFocus />
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
                    <button onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">Cancel</button>
                    <button onClick={handleSubmit} disabled={formLoading || !formName.trim()} className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer">
                        {formLoading ? 'Saving...' : editingCourse ? 'Update' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <DashboardLayout
            title="Course Management"
            subtitle="Manage courses and programs offered by the institution."
            sidebarItems={systemAdminSidebarItems}
            currentUser={user}
            roleLabel="System Administrator"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-200">
                    <button onClick={openAddModal} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer shrink-0">
                        <Plus className="w-3.5 h-3.5" />
                        Add Course
                    </button>
                </div>
                {loading ? (
                    <div className="p-6 text-center text-sm text-slate-400">Loading courses...</div>
                ) : error ? (
                    <div className="p-6 text-center text-sm text-red-500">Error: {error}</div>
                ) : (
                    <>
                        <div className="hidden md:block">
                            <DashboardTable headers={tableHeaders} emptyState={<EmptyState icon={BookOpen} title="No Courses" subtitle="Courses will appear here once added." />}>
                                {pageRecords.map(renderRow)}
                            </DashboardTable>
                        </div>

                        <div className="md:hidden">
                            {filtered.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {pageRecords.map((item) => (
                                        <DashboardMobileCard
                                            key={item.id}
                                            title={item.name}
                                            subtitle={item.is_active ? 'Active' : 'Inactive'}
                                            metadata={[
                                                { label: 'Status', value: <StatusBadge status={item.is_active ? 'active' : 'inactive'} type="boolean" /> },
                                            ]}
                                            actions={[
                                                ...(item.is_active ? [{ icon: <Power className="w-4 h-4" />, label: 'Deactivate', onClick: () => toggleStatus(item), className: 'text-white bg-amber-600 hover:bg-amber-700' }] : [{ icon: <Power className="w-4 h-4" />, label: 'Activate', onClick: () => toggleStatus(item), className: 'text-white bg-emerald-600 hover:bg-emerald-700' }]),
                                                { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>, label: 'Edit', onClick: () => openEditModal(item), className: 'text-white bg-blue-600 hover:bg-blue-700' },
                                                { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>, label: 'Delete', onClick: () => handleDelete(item), className: 'text-white bg-red-600 hover:bg-red-700' },
                                            ]}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState icon={BookOpen} title="No Courses" subtitle="Courses will appear here once added." />
                            )}
                        </div>

                        {totalPages > 1 && (
                            <>
                                <div className="hidden md:block px-6 py-4 border-t border-slate-100">
                                    <DashboardPagination currentPage={page} lastPage={totalPages} onPageChange={handlePageChange} />
                                </div>
                                <div className="md:hidden px-4 py-3 border-t border-slate-100">
                                    <DashboardPagination currentPage={page} lastPage={totalPages} onPageChange={handlePageChange} />
                                </div>
                            </>
                        )}
                    </>
                )}
            </section>

            {showModal && renderModal()}
            {renderDeleteModal()}
        </DashboardLayout>
    );
}

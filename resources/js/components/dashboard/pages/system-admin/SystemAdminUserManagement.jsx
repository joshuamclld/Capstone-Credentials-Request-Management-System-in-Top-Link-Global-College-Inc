import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, FileText, Eye, Edit, ToggleLeft, Plus, ChartColumn, RefreshCw, X, Check } from 'lucide-react';
import DashboardLayout from '../../DashboardLayout';
import DashboardSearch from '../../DashboardSearch';
import DashboardTable from '../../DashboardTable';
import DashboardMobileCard from '../../DashboardMobileCard';
import DashboardPagination from '../../DashboardPagination';
import StatusBadge from '../../StatusBadge';
import EmptyState from '../../EmptyState';
import DashboardDropdown from '../../../common/DashboardDropdown';
import { systemAdminSidebarItems } from '../../config/sidebarItems';

const tableHeaders = ['Name', 'Email', 'Role', 'Status', 'Date Created', 'Action'];

const roleColors = {
    admin: 'bg-blue-100 text-blue-800 border-blue-300',
    cashier: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    system_admin: 'bg-purple-100 text-purple-800 border-purple-300',
};

const roleFilterOptions = ['All', 'admin', 'cashier', 'system_admin'];

export default function SystemAdminUserManagement({ user, onLogout, onNavigate, onUserUpdate }) {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'cashier', contact_number: '' });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    const [toggleMessage, setToggleMessage] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        if (toggleMessage) {
            const timer = setTimeout(() => setToggleMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toggleMessage]);

    const fetchUsers = (p) => {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ page: p });
        if (debouncedQuery) params.append('search', debouncedQuery);
        if (roleFilter !== 'All') params.append('role', roleFilter);

        fetch(`/admin/system/users?${params}`, { credentials: 'same-origin' })
            .then((r) => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
            .then((j) => { setUsers(j.data); setPagination(j.pagination); setLoading(false); })
            .catch((e) => { setError(e.message); setUsers([]); setLoading(false); });
    };

    useEffect(() => { fetchUsers(page); }, [page, debouncedQuery, roleFilter]);

    const handlePageChange = (np) => { if (np >= 1 && pagination && np <= pagination.last_page) setPage(np); };

    const openAddModal = () => {
        setFormData({ name: '', email: '', password: '', role: 'cashier', contact_number: '' });
        setFormError('');
        setShowAddModal(true);
    };

    const openEditModal = (u) => {
        setEditingUser(u);
        setFormData({ name: u.name, email: u.email, password: '', role: u.role, contact_number: u.contact_number || '' });
        setFormError('');
        setShowEditModal(true);
    };

    const handleSubmit = (isEdit) => {
        if (formLoading) return;
        setFormLoading(true);
        setFormError('');

        const url = isEdit ? `/admin/system/users/${editingUser.id}` : '/admin/system/users';
        const method = isEdit ? 'PUT' : 'POST';
        const body = isEdit
            ? { name: formData.name, role: formData.role, contact_number: formData.contact_number, ...(formData.password ? { password: formData.password } : {}) }
            : formData;

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
            .then(() => {
                setShowAddModal(false);
                setShowEditModal(false);
                setEditingUser(null);
                fetchUsers(page);
                if (isEdit && editingUser.id === user.id && onUserUpdate) {
                    onUserUpdate();
                }
            })
            .catch((e) => { setFormError(e.message); })
            .finally(() => { setFormLoading(false); });
    };

    const handleToggleActive = (u) => {
        fetch(`/admin/system/users/${u.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
            },
            body: JSON.stringify({ is_active: !u.is_active }),
            credentials: 'same-origin',
        })
            .then(async (r) => {
                const d = await r.json();
                if (r.ok) {
                    setToggleMessage({ type: 'success', text: 'User status updated successfully.' });
                    fetchUsers(page);
                } else {
                    setToggleMessage({ type: 'error', text: d.message || 'Failed to update status.' });
                }
            })
            .catch(() => {
                setToggleMessage({ type: 'error', text: 'Network error. Please try again.' });
            });
    };

    const renderRow = (u) => (
        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-medium text-slate-900">{u.name}</td>
            <td className="px-6 py-4 text-slate-700">{u.email}</td>
            <td className="px-6 py-4">
                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${roleColors[u.role] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {u.role.replace('_', ' ')}
                </span>
            </td>
            <td className="px-6 py-4"><StatusBadge status={u.is_active ? 'active' : 'inactive'} /></td>
            <td className="px-6 py-4 text-slate-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-1.5">
                    <button onClick={() => onNavigate(`/system-admin/users/${u.id}`)} className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" title="View User">
                        <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => openEditModal(u)} className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Edit User">
                        <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleToggleActive(u)} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${u.is_active ? 'text-slate-400 hover:text-red-700 hover:bg-red-50' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'}`} title={u.is_active ? 'Deactivate' : 'Activate'}>
                        {u.is_active ? <ToggleLeft className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </button>
                </div>
            </td>
        </tr>
    );

    const renderModal = (isEdit) => (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddModal(false); setShowEditModal(false); } }}>
            <div className="bg-white rounded-xl border border-slate-200 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
                    <h3 className="text-base font-bold text-slate-900">{isEdit ? 'Edit User' : 'Add User'}</h3>
                    <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    {formError && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Full name" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Email address" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Password {isEdit && <span className="text-slate-400">(leave blank to keep current)</span>}</label>
                        <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder={isEdit ? 'New password...' : 'Password'} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
                        <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer">
                            <option value="admin">Admin (Registrar)</option>
                            <option value="cashier">Cashier</option>
                            <option value="system_admin">System Administrator</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Contact Number</label>
                        <input type="text" value={formData.contact_number} onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Optional" />
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
                    <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">Cancel</button>
                    <button onClick={() => handleSubmit(isEdit)} disabled={formLoading} className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer">
                        {formLoading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
                    </button>
                </div>
            </div>
        </div>
    );

    const filtered = users;

    return (
        <DashboardLayout
            title="User Management"
            subtitle="Manage system users and their roles."
            sidebarItems={systemAdminSidebarItems}
            currentUser={user}
            roleLabel="System Administrator"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                        <DashboardSearch value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search users..." />
                        <DashboardDropdown
                            options={roleFilterOptions.map(o => ({ label: o === 'All' ? 'All Roles' : o.replace('_', ' '), value: o }))}
                            value={roleFilter}
                            onChange={(v) => { setRoleFilter(v); setPage(1); }}
                            placeholder="All Roles"
                            className="w-40"
                        />
                    </div>
                    <button onClick={openAddModal} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer">
                        <Plus className="w-3.5 h-3.5" />
                        Add User
                    </button>
                </div>
                {toggleMessage && (
                    <div className={`mx-6 mt-4 text-xs px-3 py-2 rounded-lg ${toggleMessage.type === 'success' ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                        {toggleMessage.text}
                    </div>
                )}
                {loading ? (
                    <div className="p-6 text-center text-sm text-slate-400">Loading users...</div>
                ) : error ? (
                    <div className="p-6 text-center text-sm text-red-500">Error: {error}</div>
                ) : (
                    <>
                        <div className="hidden md:block">
                            <DashboardTable headers={tableHeaders} emptyState={<EmptyState icon={Users} title="No Users Found" subtitle="Registered system users will appear here." />}>
                                {filtered.map(renderRow)}
                            </DashboardTable>
                        </div>

                        <div className="md:hidden">
                            {filtered.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {filtered.map((item) => (
                                        <DashboardMobileCard
                                            key={item.id}
                                            title={item.name}
                                            subtitle={item.email}
                                            metadata={[
                                                { label: 'Role', value: <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border ${roleColors[item.role] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>{item.role.replace('_', ' ')}</span> },
                                                { label: 'Status', value: <StatusBadge status={item.is_active ? 'active' : 'inactive'} /> },
                                                { label: 'Created', value: new Date(item.created_at).toLocaleDateString() },
                                            ]}
                                            actions={[
                                                { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>, label: 'View User', onClick: () => onNavigate(`/system-admin/users/${item.id}`) },
                                                { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>, label: 'Edit User', onClick: () => openEditModal(item) },
                                                { icon: item.is_active
                                                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 12h2v2h-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3a9 9 0 100 18 9 9 0 000-18z" /></svg>
                                                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                                                  label: item.is_active ? 'Deactivate' : 'Activate',
                                                  onClick: () => handleToggleActive(item) },
                                            ]}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState icon={Users} title="No Users Found" subtitle="Registered system users will appear here." />
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

            {showAddModal && renderModal(false)}
            {showEditModal && renderModal(true)}
        </DashboardLayout>
    );
}

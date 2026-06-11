import React, { useState, useEffect } from 'react';
import { Users, FileText, ArrowLeft, Mail, Phone, Calendar, Shield, Hash } from 'lucide-react';
import DashboardLayout from '../../DashboardLayout';
import StatusBadge from '../../StatusBadge';
import EmptyState from '../../EmptyState';
import { systemAdminSidebarItems } from '../../config/sidebarItems';

export default function SystemAdminUserDetails({ user, onLogout, onNavigate }) {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const userId = window.location.pathname.split('/').pop();

    useEffect(() => {
        if (!userId || userId === 'users') { setLoading(false); return; }
        fetch(`/admin/system/users/${userId}`, { credentials: 'same-origin' })
            .then((r) => { if (!r.ok) throw new Error('Not found'); return r.json(); })
            .then((j) => { setUserData({ ...j.data, request_count: j.request_count }); setLoading(false); })
            .catch((e) => { setError(e.message); setLoading(false); });
    }, [userId]);

    return (
        <DashboardLayout
            title="User Details"
            subtitle={userData ? `Details for ${userData.name}` : 'View user information'}
            sidebarItems={systemAdminSidebarItems}
            currentUser={user}
            roleLabel="System Administrator"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            <button onClick={() => onNavigate('/system-admin/users')} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-700 mb-4 transition-colors cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Users
            </button>

            {loading ? (
                <div className="text-center py-20 text-sm text-slate-400">Loading user details...</div>
            ) : error ? (
                <div className="text-center py-20 text-sm text-red-500">Error: {error}</div>
            ) : !userData ? (
                <EmptyState icon={Users} title="User Not Found" subtitle="The requested user could not be found." />
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-6 border-b border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                                {(userData.name || '').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">{userData.name}</h2>
                                <p className="text-sm text-slate-500 capitalize">{userData.role.replace('_', ' ')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500">Email</p>
                                    <p className="text-sm font-medium text-slate-900">{userData.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500">Contact Number</p>
                                    <p className="text-sm font-medium text-slate-900">{userData.contact_number || 'Not provided'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Shield className="w-4 h-4 text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500">Role</p>
                                    <p className="text-sm font-medium text-slate-900 capitalize">{userData.role.replace('_', ' ')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Hash className="w-4 h-4 text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500">Status</p>
                                    <div><StatusBadge status={userData.is_active ? 'active' : 'inactive'} /></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500">Date Created</p>
                                    <p className="text-sm font-medium text-slate-900">{new Date(userData.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500">Last Updated</p>
                                    <p className="text-sm font-medium text-slate-900">{new Date(userData.updated_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

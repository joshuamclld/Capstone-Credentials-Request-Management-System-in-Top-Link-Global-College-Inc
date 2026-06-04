import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Users, Settings, RefreshCw, Save, ChartColumn } from 'lucide-react';
import DashboardLayout from '../../DashboardLayout';
import EmptyState from '../../EmptyState';

const sidebarItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/system-admin-dashboard' },
    { label: 'User Management', icon: Users, path: '/system-admin/users' },
    { label: 'Credential Types', icon: FileText, path: '/system-admin/credentials' },
    { label: 'Reports & Analytics', icon: ChartColumn, path: '/system-admin/reports' },
    { label: 'Audit Logs', icon: RefreshCw, path: '/system-admin/audit-logs' },
    { label: 'Settings', icon: Settings, path: '/system-admin/settings' },
];

const settingFields = [
    { key: 'school_name', label: 'School Name', type: 'text', placeholder: 'Tarlac Luminary Global College' },
    { key: 'school_address', label: 'School Address', type: 'text', placeholder: 'Tarlac City, Philippines' },
    { key: 'processing_time_days', label: 'Default Processing Time (days)', type: 'number', placeholder: '3' },
    { key: 'enable_online_payment', label: 'Enable Online Payment', type: 'select', options: ['true', 'false'] },
    { key: 'enable_student_registration', label: 'Enable Student Registration', type: 'select', options: ['true', 'false'] },
    { key: 'max_requests_per_student', label: 'Max Requests Per Student', type: 'number', placeholder: '5' },
    { key: 'notification_email', label: 'Notification Email', type: 'email', placeholder: 'admin@tlgc.edu.ph' },
];

export default function SystemAdminSettings({ user, onLogout, onNavigate }) {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetch('/admin/system/settings', { credentials: 'same-origin' })
            .then((r) => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
            .then((j) => { setSettings(j.data || {}); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const handleChange = (key, value) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        setSaving(true);
        setMessage(null);

        fetch('/admin/system/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
            },
            body: JSON.stringify({ settings }),
            credentials: 'same-origin',
        })
            .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.message || 'Failed to save'); return d; })
            .then(() => { setMessage({ type: 'success', text: 'Settings saved successfully.' }); })
            .catch((e) => { setMessage({ type: 'error', text: e.message }); })
            .finally(() => { setSaving(false); });
    };

    return (
        <DashboardLayout
            title="System Settings"
            subtitle="Configure system-wide settings for the CRMS."
            sidebarItems={sidebarItems}
            currentUser={user}
            roleLabel="System Administrator"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden max-w-2xl">
                <div className="px-6 py-5 border-b border-slate-200">
                    <h2 className="text-base font-bold text-slate-900">Configuration</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Modify system settings below. Changes take effect immediately.</p>
                </div>

                {loading ? (
                    <div className="p-6 text-center text-sm text-slate-400">Loading settings...</div>
                ) : (
                    <div className="p-6 space-y-5">
                        {message && (
                            <div className={`text-xs px-3 py-2 rounded-lg ${message.type === 'success' ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                                {message.text}
                            </div>
                        )}

                        {settingFields.map((field) => (
                            <div key={field.key}>
                                <label className="block text-xs font-medium text-slate-600 mb-1">{field.label}</label>
                                {field.type === 'select' ? (
                                    <select
                                        value={settings[field.key] || 'true'}
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                    >
                                        {field.options.map((opt) => (
                                            <option key={opt} value={opt}>{opt === 'true' ? 'Enabled' : 'Disabled'}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={field.type}
                                        value={settings[field.key] || ''}
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                )}
                            </div>
                        ))}

                        <div className="pt-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                            >
                                <Save className="w-3.5 h-3.5" />
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </DashboardLayout>
    );
}

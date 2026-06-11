import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import DashboardPagination from '../DashboardPagination';
import EmptyState from '../EmptyState';
import { registrarSidebarItems, cashierSidebarItems, systemAdminSidebarItems } from '../config/sidebarItems';

function timeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
}

const sidebarMap = {
    admin: registrarSidebarItems,
    registrar: registrarSidebarItems,
    cashier: cashierSidebarItems,
    system_admin: systemAdminSidebarItems,
};

export default function NotificationList({ user, onLogout, onNavigate }) {
    const [notifications, setNotifications] = useState([]);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const sidebarItems = sidebarMap[user?.role] || registrarSidebarItems;

    const fetchData = useCallback((p) => {
        setLoading(true);
        setError(null);
        fetch(`/admin/api/notifications/all?page=${p}`, { credentials: 'same-origin' })
            .then(res => { if (!res.ok) throw new Error('Failed to fetch notifications'); return res.json(); })
            .then(data => {
                setNotifications(data.data || []);
                setPagination({ current_page: data.current_page || 1, last_page: data.last_page || 1 });
                setLoading(false);
            })
            .catch(err => { setError(err.message); setLoading(false); });
    }, []);

    useEffect(() => { fetchData(page); }, [page, fetchData]);

    const markAsRead = (id) => {
        fetch(`/admin/notifications/${id}/read`, {
            method: 'PATCH',
            headers: { 'X-CSRF-TOKEN': csrfToken, 'Content-Type': 'application/json' },
            credentials: 'same-origin',
        }).catch(() => {});
        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
    };

    const markAllAsRead = () => {
        fetch('/admin/notifications/read-all', {
            method: 'PATCH',
            headers: { 'X-CSRF-TOKEN': csrfToken, 'Content-Type': 'application/json' },
            credentials: 'same-origin',
        }).catch(() => {});
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const handleNotificationClick = (notification) => {
        if (!notification.is_read) markAsRead(notification.id);
        if (notification.action_url && onNavigate) onNavigate(notification.action_url);
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || (pagination && newPage > pagination.last_page)) return;
        setPage(newPage);
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (loading) {
        return (
            <DashboardLayout title="Notifications" subtitle="View all notifications." sidebarItems={sidebarItems} user={user} onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading notifications...</div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Notifications" subtitle="View all notifications." sidebarItems={sidebarItems} user={user} onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20 text-red-500 text-sm">Error: {error}</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Notifications" subtitle="View all notifications." sidebarItems={sidebarItems} user={user} onLogout={onLogout} onNavigate={onNavigate}>
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-200">
                    <p className="text-sm text-slate-500">
                        {unreadCount > 0
                            ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                            : 'All caught up'}
                    </p>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Mark all as read
                        </button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <EmptyState icon={Bell} title="No Notifications" subtitle="You have no notifications yet." />
                ) : (
                    <>
                        <div className="hidden md:block">
                            <div className="divide-y divide-slate-100">
                                {notifications.map((n) => (
                                    <button
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`w-full text-left flex items-start gap-3 px-6 py-4 transition-colors cursor-pointer ${
                                            n.is_read
                                                ? 'bg-white hover:bg-slate-50'
                                                : 'bg-blue-50/60 hover:bg-blue-50'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold ${n.is_read ? 'text-slate-700' : 'text-slate-900'}`}>
                                                {n.title}
                                            </p>
                                            <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                                            <p className="text-xs text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                                        </div>
                                        {!n.is_read && (
                                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="md:hidden">
                            <div className="divide-y divide-slate-100">
                                {notifications.map((n) => (
                                    <button
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`w-full text-left flex items-start gap-3 px-4 py-3.5 transition-colors cursor-pointer ${
                                            n.is_read
                                                ? 'bg-white'
                                                : 'bg-blue-50/60'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold ${n.is_read ? 'text-slate-700' : 'text-slate-900'}`}>
                                                {n.title}
                                            </p>
                                            <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                                            <p className="text-xs text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                                        </div>
                                        {!n.is_read && (
                                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {pagination && pagination.last_page > 1 && (
                            <div className="hidden md:block px-6 py-4 border-t border-slate-100">
                                <DashboardPagination currentPage={pagination.current_page} lastPage={pagination.last_page} onPageChange={handlePageChange} />
                            </div>
                        )}
                        {pagination && pagination.last_page > 1 && (
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

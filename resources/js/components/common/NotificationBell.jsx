import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck } from 'lucide-react';

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

export default function NotificationBell({ onNavigate }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 320 });
    const bellRef = useRef(null);

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    useEffect(() => {
        const controller = new AbortController();
        const fetchWithSignal = () => {
            fetch('/admin/api/notifications', { credentials: 'same-origin', signal: controller.signal })
                .then(res => res.json())
                .then(data => {
                    setNotifications(data.notifications || []);
                    setUnreadCount(data.unread_count || 0);
                })
                .catch(err => { if (err.name !== 'AbortError') console.error('Failed to fetch notifications:', err); });
        };
        fetchWithSignal();
        const interval = setInterval(fetchWithSignal, 30000);
        return () => {
            clearInterval(interval);
            controller.abort();
        };
    }, []);

    useEffect(() => {
        if (!open) return;
        const close = (e) => {
            if (bellRef.current && !bellRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    const openDropdown = () => {
        if (fetching) return;
        setFetching(true);
        if (bellRef.current) {
            const rect = bellRef.current.getBoundingClientRect();
            const dropdownWidth = Math.min(320, window.innerWidth - 16);
            setMenuPos({
                top: rect.bottom + 4,
                left: Math.max(rect.right - dropdownWidth, 8),
                width: dropdownWidth,
            });
        }
        fetch('/admin/api/notifications', { credentials: 'same-origin' })
            .then(res => res.json())
            .then(data => {
                setNotifications(data.notifications || []);
                setUnreadCount(data.unread_count || 0);
                setOpen(true);
            })
            .catch(() => setOpen(true))
            .finally(() => setFetching(false));
    };

    const markAsRead = (id) => {
        fetch(`/admin/notifications/${id}/read`, {
            method: 'PATCH',
            headers: { 'X-CSRF-TOKEN': csrfToken, 'Content-Type': 'application/json' },
            credentials: 'same-origin',
        }).catch(err => console.error('Failed to mark notification as read:', err));
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        fetch('/admin/notifications/read-all', {
            method: 'PATCH',
            headers: { 'X-CSRF-TOKEN': csrfToken, 'Content-Type': 'application/json' },
            credentials: 'same-origin',
        }).catch(err => console.error('Failed to mark all as read:', err));
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const handleNotificationClick = (notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
        setOpen(false);
        if (notification.action_url && onNavigate) {
            onNavigate(notification.action_url);
        }
    };

    return (
        <div ref={bellRef} className="relative">
            <button
                onClick={openDropdown}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 relative cursor-pointer"
                title="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                )}
            </button>

            {open && (
                <div
                    style={{
                        position: 'fixed',
                        top: `${menuPos.top}px`,
                        left: `${menuPos.left}px`,
                        width: `${menuPos.width}px`,
                        zIndex: 9999,
                    }}
                    className="bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
                >
                    <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-900">Notifications</p>
                            {unreadCount > 0 && (
                                <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-slate-400">
                                No notifications
                            </div>
                        ) : (
                            notifications.slice(0, 5).map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`w-full text-left px-4 py-3 border-b border-slate-50 transition-colors cursor-pointer ${
                                        n.is_read
                                            ? 'bg-white hover:bg-slate-50'
                                            : 'bg-blue-50/60 hover:bg-blue-50'
                                    }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-semibold ${n.is_read ? 'text-slate-700' : 'text-slate-900'}`}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                                        </div>
                                        {!n.is_read && (
                                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                            <button
                                onClick={markAllAsRead}
                                disabled={unreadCount === 0}
                                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Mark all as read
                            </button>
                            <button
                                onClick={() => { setOpen(false); if (onNavigate) onNavigate('/admin/notifications'); }}
                                className="text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            >
                                View all
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

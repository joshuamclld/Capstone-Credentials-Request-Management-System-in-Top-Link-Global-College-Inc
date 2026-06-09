import React from 'react';
import { LogOut } from 'lucide-react';

export default function DashboardSidebar({ items, currentUser, sidebarOpen, onClose, onLogout, onNavigate }) {
    const adminName = currentUser?.name || 'Administrator';
    const adminEmail = currentUser?.email || '';
    const currentPath = window.location.pathname;

    const isActive = (item) => {
        if (item.path === currentPath) return true;
        if (item.path && currentPath.startsWith(item.path + '/')) return true;
        return false;
    };

    return (
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-emerald-100 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="px-6 py-6 border-b border-emerald-100">
                <div className="flex items-center gap-3">
                    <img
                        alt="TLGC Logo"
                        className="w-10 h-10 object-contain shrink-0"
                        src="/images/logo.png"
                    />
                    <div>
                        <h1 className="text-sm font-bold text-emerald-900 leading-tight">Top Link Global College</h1>
                        <p className="text-[10px] text-emerald-600 uppercase tracking-wider font-medium">Credentials Management</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {items.map((item) => (
                    <a
                        key={item.label}
                        href={item.path || '#'}
                        onClick={(e) => {
                            e.preventDefault();
                            if (item.path && onNavigate) {
                                onClose && onClose();
                                onNavigate(item.path);
                            }
                        }}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item)
                            ? 'bg-emerald-50 text-emerald-800 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                    >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {item.label}
                    </a>
                ))}
            </nav>

            <div className="px-4 py-4 border-t border-emerald-100">
                <div className="flex items-center gap-3 px-4 py-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {adminName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{adminName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{adminEmail || 'Administrator'}</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="flex items-center justify-center w-9 h-9 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}

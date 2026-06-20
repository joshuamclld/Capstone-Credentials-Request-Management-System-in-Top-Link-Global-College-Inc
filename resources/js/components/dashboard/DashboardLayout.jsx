import React, { useState, useRef, useEffect } from 'react';
import { Menu, LogOut } from 'lucide-react';
import DashboardSidebar from './DashboardSidebar';
import NotificationBell from '../common/NotificationBell';
import ToastNotification from '../common/ToastNotification';

export default function DashboardLayout({ title, subtitle, sidebarItems, currentUser, roleLabel, onLogout, onNavigate, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const adminName = currentUser?.name || 'Administrator';

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="min-h-screen flex"
             style={{ background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-container-low) 40%, var(--color-primary-container) 100%)' }}>
            <ToastNotification />
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <DashboardSidebar
                items={sidebarItems}
                currentUser={currentUser}
                sidebarOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={onLogout}
                onNavigate={onNavigate}
            />

            <main className="flex-1 lg:pl-72 min-w-0">
                <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
                    <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-sm sm:text-lg md:text-lg font-bold text-slate-900">{title}</h1>
                                {subtitle && (
                                    <p className="text-[10px] sm:text-xs text-slate-500 mt-0 sm:mt-0.5">{subtitle}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {currentUser?.role !== 'system_admin' && <NotificationBell onNavigate={onNavigate} />}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center gap-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
                                        {adminName.charAt(0)}
                                    </div>
                                    <span className="hidden sm:inline text-sm font-medium text-slate-700">{adminName}</span>
                                </button>
                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50">
                                        <div className="px-4 py-2.5 border-b border-slate-100">
                                            <p className="text-sm font-bold text-slate-900">{adminName}</p>
                                            <p className="text-xs text-slate-500">{currentUser?.email || ''}</p>
                                        </div>
                                        <button
                                            onClick={onLogout}
                                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

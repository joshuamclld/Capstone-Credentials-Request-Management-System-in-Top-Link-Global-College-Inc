import React, { useState } from 'react';
import { Menu, LogOut } from 'lucide-react';
import DashboardSidebar from './DashboardSidebar';
import NotificationBell from '../common/NotificationBell';

export default function DashboardLayout({ title, subtitle, sidebarItems, currentUser, roleLabel, onLogout, onNavigate, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const adminName = currentUser?.name || 'Administrator';

    return (
        <div className="min-h-screen bg-slate-50 flex">
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
                            <div className="hidden sm:flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
                                    {adminName.charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-slate-700">{adminName}</span>
                            </div>
                            <button
                                onClick={onLogout}
                                className="hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                                title="Sign Out"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
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

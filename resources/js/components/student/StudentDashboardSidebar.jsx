import React from 'react';
import { LayoutDashboard, FileText, FolderOpen, LogOut, User } from 'lucide-react';

const sidebarItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
  { label: 'Request Documents', icon: FileText, path: '/request' },
  { label: 'My Requests', icon: FolderOpen, path: '/student/requests' },
];

export default function StudentDashboardSidebar({ student, sidebarOpen, onClose, onLogout, onNavigate, currentPath }) {
  const isActive = (item) => {
    if (item.path === currentPath) return true;
    if (item.path === '/student/dashboard' && currentPath === '/student/dashboard') return true;
    return false;
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-outline-variant flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="px-5 py-5 border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <img
            alt="TLGC Logo"
            className="w-10 h-10 object-contain shrink-0"
            src="/images/logo.png"
            onError={(e) => {
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='%231a6e38'%3E%3Cpath d='M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z'/%3E%3C/svg%3E";
            }}
          />
          <div>
            <h1 className="text-sm font-bold text-primary leading-tight">TLGC</h1>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-medium">CRMS</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => (
          <button
            key={item.label}
            onClick={() => { onClose(); onNavigate(item.path); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${isActive(item)
              ? 'bg-primary/10 text-primary font-bold'
              : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-outline-variant">
        <div className="flex items-center gap-3 px-4 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold shrink-0">
            {student?.first_name?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-on-surface truncate">{student?.first_name} {student?.last_name}</p>
            <p className="text-[11px] text-on-surface-variant truncate">{student?.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error/5 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

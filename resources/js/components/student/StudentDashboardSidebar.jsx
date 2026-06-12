import React from 'react';
import { LayoutDashboard, FileText, FolderOpen, LogOut } from 'lucide-react';

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
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary border-r border-primary-container flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="px-5 py-5 border-b border-primary-container">
        <div className="flex items-center gap-3">
          <img
            alt="TLGC Logo"
            className="w-10 h-10 object-contain"
            src="/images/logo.png"
            onError={(e) => {
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='%23154412'%3E%3Cpath d='M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z'/%3E%3C/svg%3E";
            }}
          />
          <div>
            <h1 className="text-sm font-bold text-on-primary leading-tight">Top Link Global College</h1>
            <p className="text-[10px] text-on-primary/70 uppercase tracking-wider font-medium">Credentials Request</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => (
          <button
            key={item.label}
            onClick={() => { onClose(); onNavigate(item.path); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${isActive(item)
              ? 'bg-white/10 text-white font-semibold'
              : 'text-on-primary/70 hover:bg-primary/20 hover:text-on-primary'
              }`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

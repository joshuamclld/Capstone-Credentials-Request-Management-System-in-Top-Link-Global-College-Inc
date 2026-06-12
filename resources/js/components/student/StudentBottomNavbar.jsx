import React from 'react';
import { LayoutDashboard, FileText, FolderOpen } from 'lucide-react';

const items = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
  { label: 'Request', icon: FileText, path: '/request' },
  { label: 'My Requests', icon: FolderOpen, path: '/student/requests' },
];

export default function StudentBottomNavbar({ currentPath, onNavigate }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="bg-primary border-t border-primary-container rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-pb">
        <div className="flex items-center justify-around px-2 pt-2 pb-2">
          {items.map((item) => {
            const active = currentPath === item.path;
            return (
              <button
                key={item.label}
                onClick={() => onNavigate(item.path)}
                className={'flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-[56px] rounded-xl transition-all cursor-pointer ' + (active ? 'bg-white/10' : '')}
              >
                <item.icon className={'w-5 h-5 ' + (active ? 'text-white' : 'text-on-primary/60')} />
                <span className={'text-[10px] font-semibold leading-tight ' + (active ? 'text-white' : 'text-on-primary/60')}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

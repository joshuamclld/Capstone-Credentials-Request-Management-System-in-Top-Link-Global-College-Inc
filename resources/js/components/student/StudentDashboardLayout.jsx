import React, { useState, useEffect, useRef } from 'react';
import { User, LogOut } from 'lucide-react';
import StudentDashboardSidebar from './StudentDashboardSidebar';
import StudentBottomNavbar from './StudentBottomNavbar';
import StudentToastNotification from '../common/StudentToastNotification';
import StudentNotificationBell from '../common/StudentNotificationBell';

export default function StudentDashboardLayout({ title, subtitle, student, onLogout, onNavigate, currentPath, children }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const close = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', onKeyDown); };
  }, [dropdownOpen]);

  return (
    <div className="min-h-screen bg-surface flex">
      <StudentToastNotification />
      <div className="hidden lg:block">
        <StudentDashboardSidebar
          student={student}
          sidebarOpen={true}
          onClose={() => {}}
          onLogout={onLogout}
          onNavigate={onNavigate}
          currentPath={currentPath}
        />
      </div>

      <main className="flex-1 lg:pl-64 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-outline-variant">
          <div className="flex items-center justify-between h-20 max-md:h-16 px-margin-mobile md:px-margin-desktop">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-on-surface truncate">{title}</h1>
                {subtitle && <p className="text-xs text-on-surface-variant truncate hidden sm:block">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StudentNotificationBell onNavigate={onNavigate} />
              <div ref={dropdownRef} className="relative shrink-0">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {student?.first_name?.charAt(0)}
                </div>
                <span className="text-sm font-medium text-on-surface hidden lg:inline">{student?.first_name} {student?.last_name}</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden z-50">
                  <button
                    onClick={() => { setDropdownOpen(false); onNavigate('/student/profile'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-body-md text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </button>
                  <div className="border-t border-outline-variant" />
                  <button
                    onClick={() => { setDropdownOpen(false); onLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-body-md text-error hover:bg-error/5 transition-colors cursor-pointer"
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

        <div className="flex-1 px-margin-mobile md:px-margin-desktop py-6 sm:py-8 pb-24 lg:pb-8">
          {children}
        </div>
      </main>

      <StudentBottomNavbar currentPath={currentPath} onNavigate={onNavigate} />
    </div>
  );
}

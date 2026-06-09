import React, { useState, useEffect } from 'react';
import { Menu, LogOut } from 'lucide-react';
import StudentDashboardSidebar from './StudentDashboardSidebar';

export default function StudentDashboardLayout({ title, subtitle, student, onLogout, onNavigate, currentPath, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [currentPath]);

  return (
    <div className="min-h-screen bg-surface flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <StudentDashboardSidebar
        student={student}
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
        onNavigate={onNavigate}
        currentPath={currentPath}
      />

      <main className="flex-1 lg:pl-64 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-outline-variant">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 lg:hidden cursor-pointer" onClick={() => onNavigate('/student/dashboard')}>
                <img
                  alt="TLGC Logo"
                  className="h-10 w-auto object-contain shrink-0"
                  src="/images/logo.png"
                  onError={(e) => {
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='%231a6e38'%3E%3Cpath d='M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z'/%3E%3C/svg%3E";
                  }}
                />
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-bold text-primary">TLGC</span>
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Credentials</span>
                </div>
              </div>
              <div className="hidden lg:block">
                <h1 className="text-lg font-bold text-on-surface">{title}</h1>
                {subtitle && <p className="text-xs text-on-surface-variant">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {student?.first_name?.charAt(0)}
                </div>
                <span className="text-sm font-medium text-on-surface hidden lg:inline">{student?.first_name} {student?.last_name}</span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

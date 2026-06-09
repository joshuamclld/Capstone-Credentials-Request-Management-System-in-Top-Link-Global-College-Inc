import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
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
          <div className="flex items-center justify-between h-20 max-md:h-16 px-margin-mobile md:px-margin-desktop">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2.5 -ml-1 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer shrink-0"
                aria-label="Open sidebar"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-on-surface truncate">{title}</h1>
                {subtitle && <p className="text-xs text-on-surface-variant truncate hidden sm:block">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold shrink-0">
                {student?.first_name?.charAt(0)}
              </div>
              <span className="text-sm font-medium text-on-surface hidden lg:inline">{student?.first_name} {student?.last_name}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 px-margin-mobile md:px-margin-desktop py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

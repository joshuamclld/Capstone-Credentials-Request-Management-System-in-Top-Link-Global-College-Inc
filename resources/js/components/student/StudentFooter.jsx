import React from 'react';

export default function StudentFooter({ student, onNavigate, onOpenAuth }) {
  return (
    <footer className="w-full max-md:py-8 md:py-16 px-margin-mobile md:px-margin-desktop bg-surface-container-highest border-t border-outline-variant">
      <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <img
              alt="Logo"
              className="h-10 w-auto opacity-70 grayscale hover:grayscale-0 transition-all"
              src="/images/logo.png"
              onError={(e) => {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='%231a6e38'%3E%3Cpath d='M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z'/%3E%3C/svg%3E";
              }}
            />
            <span className="font-headline-sm text-xl text-on-surface">Top Link Global College</span>
          </div>
          <p className="font-body-sm text-on-surface-variant">Empowering students through accessible academic records since 2018.</p>
          <p className="font-label-sm text-outline">&copy; {new Date().getFullYear()} Top Link Global College. All Rights Reserved.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
          <div className="flex flex-col gap-4">
            <span className="font-label-md font-bold text-primary uppercase">Quick Links</span>
            <nav className="flex flex-col gap-2">
              {student ? (
                <a className="text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="/request" onClick={(e) => { e.preventDefault(); onNavigate('/request'); }}>Request Documents</a>
              ) : (
                <>
                  <a className="text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="/student/register" onClick={(e) => { e.preventDefault(); onOpenAuth('register'); }}>Create Account</a>
                  <a className="text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="/student/login" onClick={(e) => { e.preventDefault(); onOpenAuth('login'); }}>Sign In</a>
                </>
              )}
              <a className="text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="/track" onClick={(e) => { e.preventDefault(); onNavigate('/track'); }}>Track Request</a>
            </nav>
          </div>
          <div className="flex flex-col gap-4">
            <span className="font-label-md font-bold text-primary uppercase">Legal</span>
            <nav className="flex flex-col gap-2">
              <a className="text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
              <a className="text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Use</a>
            </nav>
          </div>
          <div className="flex flex-col gap-4 col-span-2 sm:col-span-1">
            <span className="font-label-md font-bold text-primary uppercase">Support</span>
            <nav className="flex flex-col gap-2">
              <a className="text-body-sm text-on-surface-variant hover:text-primary flex items-center gap-2" href="mailto:toplinkglobalcollege@gmail.com">
                <span className="material-symbols-outlined text-[18px]">mail</span>
                toplinkglobalcollege@gmail.com
              </a>
              <a className="text-body-sm text-on-surface-variant hover:text-primary flex items-center gap-2" href="#">
                <span className="material-symbols-outlined text-[18px]">help</span>
                Help Center
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}

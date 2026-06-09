import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';

export default function StudentNavbar({ student, onLogout, onNavigate, onOpenAuth, currentPath }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [currentPath]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const close = () => setMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 w-full bg-surface/80 backdrop-blur-md border-b border-outline-variant">
        <div className="flex items-center gap-4 cursor-pointer" onClick={(e) => { e.preventDefault(); onNavigate('/'); }}>
          <img
            alt="TLGC Logo"
            className="h-14 w-auto object-contain"
            src="/images/logo.png"
            onError={(e) => {
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 24 24' fill='%231a6e38'%3E%3Cpath d='M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z'/%3E%3C/svg%3E";
            }}
          />
          <div className="flex flex-col">
            <span className="text-headline-sm font-bold text-primary leading-tight">TLGC</span>
            <span className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Credentials</span>
          </div>
        </div>

        <button
          onClick={() => setMenuOpen(true)}
          className="md:hidden p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <nav className="hidden md:flex gap-2 items-center">
          {student ? (
            <a className={`font-label-md text-label-md transition-all px-5 py-2.5 rounded-full ${currentPath === '/student/dashboard' ? 'text-primary font-bold hover:bg-primary/10' : 'text-on-surface-variant hover:bg-surface-container-high'}`} href="/student/dashboard" onClick={(e) => { e.preventDefault(); onNavigate('/student/dashboard'); }}>Dashboard</a>
          ) : (
            <a className={`font-label-md text-label-md transition-all px-5 py-2.5 rounded-full ${currentPath === '/' ? 'text-primary font-bold hover:bg-primary/10' : 'text-on-surface-variant hover:bg-surface-container-high'}`} href="/" onClick={(e) => { e.preventDefault(); onNavigate('/'); }}>Home</a>
          )}
          {student && (
            <a className={`font-label-md text-label-md transition-all px-5 py-2.5 rounded-full ${currentPath === '/request' ? 'text-primary font-bold hover:bg-primary/10' : 'text-on-surface-variant hover:bg-surface-container-high'}`} href="/request" onClick={(e) => { e.preventDefault(); onNavigate('/request'); }}>Request Documents</a>
          )}
          {student && (
            <a className={`font-label-md text-label-md transition-all px-5 py-2.5 rounded-full ${currentPath === '/student/requests' ? 'text-primary font-bold hover:bg-primary/10' : 'text-on-surface-variant hover:bg-surface-container-high'}`} href="/student/requests" onClick={(e) => { e.preventDefault(); onNavigate('/student/requests'); }}>My Requests</a>
          )}
          <a className={`font-label-md text-label-md transition-all px-5 py-2.5 rounded-full ${currentPath === '/track' ? 'text-primary font-bold hover:bg-primary/10' : 'text-on-surface-variant hover:bg-surface-container-high'}`} href="/track" onClick={(e) => { e.preventDefault(); onNavigate('/track'); }}>Track Request</a>
          {student ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 font-label-md text-label-md font-bold text-primary bg-primary/5 hover:bg-primary/10 transition-all px-5 py-2.5 rounded-full cursor-pointer"
              >
                {student.first_name} {student.last_name}
                <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-surface border border-outline-variant rounded-xl shadow-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-outline-variant">
                    <p className="font-bold text-body-md text-on-surface truncate">{student.first_name} {student.last_name}</p>
                    <p className="text-label-sm text-on-surface-variant truncate">{student.email}</p>
                  </div>
                  <hr className="border-outline-variant" />
                  <button onClick={() => { setShowDropdown(false); onLogout(); }} className="w-full text-left px-4 py-3 text-body-md text-error hover:bg-error/5 transition-colors cursor-pointer">Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <a className="font-label-md text-label-md font-bold text-on-primary bg-primary hover:opacity-90 transition-all px-5 py-2.5 rounded-full" href="/student/login" onClick={(e) => { e.preventDefault(); onOpenAuth('login'); }}>Sign In</a>
          )}
        </nav>
      </header>

      {/* Mobile drawer — rendered outside <header> to prevent z-index stacking conflicts */}
      <div
        className={`fixed inset-0 z-[100] md:hidden transition-all duration-300 ${menuOpen ? '' : 'pointer-events-none'
          }`}
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0'
            }`}
          onClick={close}
        />

        {/* Drawer panel */}
        <div
          className={`fixed top-0 right-0 h-screen w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-300 flex flex-col ${menuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          {/* Drawer header */}
          <div className="flex justify-end px-5 py-4 shrink-0">
            <button onClick={close} className="h-10 w-10 rounded-full hover:bg-surface-container-high flex items-center justify-center transition-colors cursor-pointer" aria-label="Close menu">
              <X className="w-5 h-5 text-on-surface-variant" />
            </button>
          </div>

          {/* Navigation items */}
          <div className="flex-1 overflow-y-auto px-5 pt-3">
            <div className="space-y-1">
              {student ? (
                <button
                  onClick={() => { close(); onNavigate('/student/dashboard'); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-body-md font-medium transition-all cursor-pointer ${currentPath === '/student/dashboard' ? 'text-primary bg-primary/10 font-bold' : 'text-on-surface hover:bg-surface-container-high'
                    }`}
                >
                  Dashboard
                </button>
              ) : (
                <button
                  onClick={() => { close(); onNavigate('/'); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-body-md font-medium transition-all cursor-pointer ${currentPath === '/' ? 'text-primary bg-primary/10 font-bold' : 'text-on-surface hover:bg-surface-container-high'
                    }`}
                >
                  Home
                </button>
              )}
              {student && (
                <button
                  onClick={() => { close(); onNavigate('/request'); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-body-md font-medium transition-all cursor-pointer ${currentPath === '/request' ? 'text-primary bg-primary/10 font-bold' : 'text-on-surface hover:bg-surface-container-high'
                    }`}
                >
                  Request Documents
                </button>
              )}
              {student && (
                <button
                  onClick={() => { close(); onNavigate('/student/requests'); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-body-md font-medium transition-all cursor-pointer ${currentPath === '/student/requests' ? 'text-primary bg-primary/10 font-bold' : 'text-on-surface hover:bg-surface-container-high'
                    }`}
                >
                  My Requests
                </button>
              )}
              <button
                onClick={() => { close(); onNavigate('/track'); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-body-md font-medium transition-all cursor-pointer ${currentPath === '/track' ? 'text-primary bg-primary/10 font-bold' : 'text-on-surface hover:bg-surface-container-high'
                  }`}
              >
                Track Request
              </button>
            </div>
          </div>

          {/* Bottom section */}
          <div className="shrink-0 border-t border-outline-variant px-5 py-4 space-y-1">
            {student ? (
              <>
                <div className="px-4 py-2 border-b border-outline-variant mb-1">
                  <p className="font-bold text-body-md text-on-surface truncate">{student.first_name} {student.last_name}</p>
                  <p className="text-label-sm text-on-surface-variant truncate">{student.email}</p>
                </div>
                <button
                  onClick={() => { close(); onLogout(); }}
                  className="w-full text-left px-4 py-3 rounded-xl text-body-md font-medium text-error hover:bg-error/5 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => { close(); onOpenAuth('login'); }}
                className="w-full text-left px-4 py-3 rounded-xl text-body-md font-medium text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

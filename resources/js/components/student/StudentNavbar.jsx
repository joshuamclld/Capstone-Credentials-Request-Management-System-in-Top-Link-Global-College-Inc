import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export default function StudentNavbar({ student, onLogout, onNavigate, onOpenAuth, currentPath }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
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

      <nav className="hidden md:flex gap-2 items-center">
        <a className={`font-label-md text-label-md transition-all px-5 py-2.5 rounded-full ${currentPath === '/' ? 'text-primary font-bold hover:bg-primary/10' : 'text-on-surface-variant hover:bg-surface-container-high'}`} href="/" onClick={(e) => { e.preventDefault(); onNavigate('/'); }}>Home</a>
        {student && (
          <a className={`font-label-md text-label-md transition-all px-5 py-2.5 rounded-full ${currentPath === '/request' ? 'text-primary font-bold hover:bg-primary/10' : 'text-on-surface-variant hover:bg-surface-container-high'}`} href="/request" onClick={(e) => { e.preventDefault(); onNavigate('/request'); }}>Request Documents</a>
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
              <div className="absolute right-0 mt-2 w-48 bg-surface border border-outline-variant rounded-xl shadow-lg overflow-hidden">
                <button onClick={() => { setShowDropdown(false); onNavigate('/request'); }} className="w-full text-left px-4 py-3 text-body-md text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer">Request Documents</button>
                <button onClick={() => { setShowDropdown(false); onNavigate('/track'); }} className="w-full text-left px-4 py-3 text-body-md text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer">Track Request</button>
                <hr className="border-outline-variant" />
                <button onClick={() => { setShowDropdown(false); onLogout(); }} className="w-full text-left px-4 py-3 text-body-md text-error hover:bg-error/5 transition-colors cursor-pointer">Logout</button>
              </div>
            )}
          </div>
        ) : (
          <a className="font-label-md text-label-md font-bold text-on-primary bg-primary hover:opacity-90 transition-all px-5 py-2.5 rounded-full" href="/student/login" onClick={(e) => { e.preventDefault(); onOpenAuth('login'); }}>Sign In</a>
        )}
      </nav>
    </header>
  );
}

import React from 'react';

export default function StudentMobileNav({ active, student, onNavigate, onOpenAuth }) {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 md:hidden px-2 pb-safe bg-surface border-t border-outline-variant shadow-lg">
      <button onClick={() => onNavigate('/')} className={`flex flex-col items-center justify-center px-5 py-1.5 active:scale-95 transition-transform cursor-pointer ${active === '/' ? 'text-primary bg-primary-fixed rounded-full' : 'text-on-surface-variant'}`}>
        <span className="material-symbols-outlined">home</span>
        <span className="font-label-sm text-[10px] font-bold">HOME</span>
      </button>
      <button onClick={() => onNavigate('/track')} className={`flex flex-col items-center justify-center px-5 py-1.5 active:scale-95 transition-transform cursor-pointer ${active === '/track' ? 'text-primary bg-primary-fixed rounded-full' : 'text-on-surface-variant'}`}>
        <span className="material-symbols-outlined">analytics</span>
        <span className="font-label-sm text-[10px] font-bold">TRACK</span>
      </button>
      {student ? (
        <button onClick={() => onNavigate('/request')} className={`flex flex-col items-center justify-center px-5 py-1.5 active:scale-95 transition-transform cursor-pointer ${active === '/request' ? 'text-primary bg-primary-fixed rounded-full' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined">assignment</span>
          <span className="font-label-sm text-[10px] font-bold">REQUEST</span>
        </button>
      ) : (
        <button onClick={() => onOpenAuth('login')} className="flex flex-col items-center justify-center px-5 py-1.5 active:scale-95 transition-transform cursor-pointer">
          <span className="material-symbols-outlined">login</span>
          <span className="font-label-sm text-[10px] font-bold">SIGN IN</span>
        </button>
      )}
    </nav>
  );
}

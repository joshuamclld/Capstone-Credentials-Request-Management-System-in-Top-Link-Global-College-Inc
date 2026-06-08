import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export default function StudentDropdown({ student, onLogout, onNavigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 font-label-md text-label-md font-bold text-primary bg-primary/5 hover:bg-primary/10 transition-all px-5 py-2.5 rounded-full cursor-pointer"
      >
        {student.first_name} {student.last_name}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-surface border border-outline-variant rounded-xl shadow-lg overflow-hidden z-50">
          <button onClick={() => { setOpen(false); onNavigate('/request'); }} className="w-full text-left px-4 py-3 text-body-md text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer">Request Documents</button>
          <button onClick={() => { setOpen(false); onNavigate('/track'); }} className="w-full text-left px-4 py-3 text-body-md text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer">Track Request</button>
          <hr className="border-outline-variant" />
          <button onClick={onLogout} className="w-full text-left px-4 py-3 text-body-md text-error hover:bg-error/5 transition-colors cursor-pointer">Logout</button>
        </div>
      )}
    </div>
  );
}

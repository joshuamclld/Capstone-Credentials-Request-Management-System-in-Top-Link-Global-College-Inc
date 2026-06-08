import React from 'react';

export default function StudentAuthWindow({ title, subtitle, children, wide }) {
  return (
    <div className={`bg-surface rounded-2xl shadow-xl border border-outline-variant overflow-hidden w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
      <div className="flex items-center gap-2 px-5 py-3.5 bg-surface-container-high border-b border-outline-variant">
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="w-3 h-3 rounded-full bg-yellow-400" />
        <span className="w-3 h-3 rounded-full bg-green-400" />
      </div>
      <div className="p-8 md:p-10">
        <h1 className="text-headline-md font-bold text-on-surface mb-1">{title}</h1>
        <p className="text-body-md text-on-surface-variant mb-7">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

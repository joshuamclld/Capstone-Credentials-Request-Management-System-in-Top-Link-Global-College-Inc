import React from 'react';

export default function EmptyState({ icon: Icon, title, subtitle }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            {Icon && (
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-slate-400" />
                </div>
            )}
            <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
            {subtitle && (
                <p className="text-sm text-slate-500 text-center max-w-sm">{subtitle}</p>
            )}
        </div>
    );
}

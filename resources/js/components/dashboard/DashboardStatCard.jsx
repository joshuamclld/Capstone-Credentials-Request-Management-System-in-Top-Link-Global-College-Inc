import React from 'react';

export default function DashboardStatCard({ title, value, icon: Icon, iconBg, iconColor }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
                <div className={`w-9 h-9 rounded-lg ${iconBg || 'bg-slate-50'} flex items-center justify-center`}>
                    {Icon && <Icon className={`w-4 h-4 ${iconColor || 'text-slate-600'}`} />}
                </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
    );
}

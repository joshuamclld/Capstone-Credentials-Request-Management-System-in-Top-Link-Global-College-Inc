import React from 'react';
import { Search } from 'lucide-react';

export default function DashboardSearch({ value, onChange, placeholder }) {
    return (
        <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full sm:w-64 pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
        </div>
    );
}

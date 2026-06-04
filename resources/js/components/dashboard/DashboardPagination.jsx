import React from 'react';

export default function DashboardPagination({ currentPage, lastPage, onPageChange }) {
    if (lastPage <= 1) return null;

    return (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white">
            <p className="text-xs text-slate-500">
                Page {currentPage} of {lastPage}
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                    Previous
                </button>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= lastPage}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

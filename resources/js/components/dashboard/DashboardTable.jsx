import React from 'react';

export default function DashboardTable({ headers, children, emptyState }) {
    const hasRows = React.Children.count(children) > 0;

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {headers.map((header, i) => (
                                <th key={i} className="px-6 py-4 text-left">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    {hasRows && (
                        <tbody className="divide-y divide-slate-100">{children}</tbody>
                    )}
                </table>
            </div>
            {!hasRows && emptyState}
        </>
    );
}

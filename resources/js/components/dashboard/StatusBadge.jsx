import React from 'react';

const requestStatusStyle = {
    'Pending': 'bg-amber-100 text-amber-800 border-amber-200',
    'Payment Pending': 'bg-orange-100 text-orange-800 border-orange-200',
    'Paid': 'bg-green-100 text-green-800 border-green-200',
    'Processing': 'bg-blue-100 text-blue-800 border-blue-200',
    'Ready for Release': 'bg-purple-100 text-purple-800 border-purple-200',
    'Claimed': 'bg-slate-200 text-slate-700 border-slate-300',
};

const paymentStatusStyle = {
    'Paid': 'text-green-700 bg-green-50',
    'Unpaid': 'text-amber-700 bg-amber-50',
    'Pending Verification': 'text-yellow-700 bg-yellow-50',
};

const baseClassByType = {
    request: 'inline-block px-2.5 py-1 text-xs font-semibold rounded-full border',
    payment: 'inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded',
};

export default function StatusBadge({ status, type = 'request' }) {
    const styles = type === 'payment' ? paymentStatusStyle : requestStatusStyle;
    const style = styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
    const baseClass = baseClassByType[type] || baseClassByType.request;

    return (
        <span className={`${baseClass} ${style}`}>
            {status}
        </span>
    );
}

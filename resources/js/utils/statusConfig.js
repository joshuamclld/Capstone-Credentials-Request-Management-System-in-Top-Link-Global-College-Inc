export const REQUEST_STATUS_CONFIG = {
  Pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  Processing: { label: 'Processing', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  'Ready for Release': { label: 'Ready for Release', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  Claimed: { label: 'Claimed', className: 'bg-slate-200 text-slate-700 border-slate-300' },
  Cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-red-200' },
};

export const PAYMENT_STATUS_CONFIG = {
  unpaid: { label: 'Unpaid', className: 'bg-red-50 text-red-700 border-red-200' },
  pending_payment: { label: 'Pending Payment', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  pending_verification: { label: 'Pending Verification', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-red-200' },
};

export const BOOLEAN_STATUS_CONFIG = {
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  inactive: { label: 'Inactive', className: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export function getRequestStatusConfig(status) {
  return REQUEST_STATUS_CONFIG[status] || { label: status, className: 'bg-slate-100 text-slate-700 border-slate-200' };
}

export function getPaymentStatusConfig(status) {
  return PAYMENT_STATUS_CONFIG[status] || { label: status, className: 'bg-slate-100 text-slate-700 border-slate-200' };
}

export function getBooleanStatusConfig(status) {
  return BOOLEAN_STATUS_CONFIG[status] || { label: status, className: 'bg-slate-100 text-slate-700 border-slate-200' };
}

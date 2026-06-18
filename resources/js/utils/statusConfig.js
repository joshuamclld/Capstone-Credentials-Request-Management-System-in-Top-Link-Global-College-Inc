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
  inactive: { label: 'Inactive', className: 'bg-red-100 text-red-800 border-red-200' },
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

export function getBadge(status, payment_status) {
  if (status === 'Cancelled') {
    const c = getRequestStatusConfig('Cancelled');
    return { label: c.label, bg: c.className };
  }
  if (status === 'Pending' && payment_status === 'paid') return { label: 'Paid — Awaiting Processing', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  const c = getRequestStatusConfig(status);
  return { label: c.label, bg: c.className };
}

export function buildTimeline(status, payment_status, delivery_type) {
  if (status === 'Cancelled') {
    return [
      { step: 'Request Submitted', desc: 'Your application was successfully received.', done: true, active: false },
      { step: 'Cancelled', desc: 'This request has been cancelled.', done: true, active: true },
    ];
  }

  const checks = [
    () => true,
    () => payment_status === 'paid',
    () => ['Processing', 'Ready for Release', 'Claimed'].includes(status),
    () => ['Ready for Release', 'Claimed'].includes(status),
    () => status === 'Claimed',
  ];

  const steps = [
    { step: 'Request Submitted', desc: 'Your application was successfully received by the Registrar\'s Office.', key: 'submitted' },
    { step: 'Payment Verified', desc: 'Your processing fee has been confirmed.', key: 'payment' },
    { step: 'Currently Processing', desc: 'The Registrar is now preparing and verifying your academic records.', key: 'processing' },
    { step: 'Ready for Release', desc: 'Your document is prepared and certified, ready for release.', key: 'ready' },
    { step: delivery_type === 'digital' ? 'Delivered' : 'Claimed', desc: delivery_type === 'digital' ? 'Document has been delivered via email.' : delivery_type === 'both' ? 'Document released to student. Digital copy sent via email.' : 'Document released to student.', key: 'claimed' },
  ];

  const activeIndex = (() => {
    const idx = checks.findIndex((check) => !check());
    return idx === -1 ? steps.length - 1 : idx;
  })();

  return steps.map((s, i) => ({
    ...s,
    done: checks[i](),
    active: i === activeIndex,
  }));
}

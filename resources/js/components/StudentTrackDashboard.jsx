import React, { useState } from 'react';
import { Search, FileText, BadgeCheck, Clock, PackageCheck, CheckCheck, AlertCircle, XCircle } from 'lucide-react';

const STATUS_LABELS = {
  'Pending': { label: 'Pending Review', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
  'Processing': { label: 'Processing', bg: 'bg-blue-100 text-blue-800 border-blue-300' },
  'Ready for Release': { label: 'Ready for Release', bg: 'bg-purple-100 text-purple-800 border-purple-300' },
  'Claimed': { label: 'Claimed', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  'Cancelled': { label: 'Cancelled', bg: 'bg-red-100 text-red-800 border-red-200' },
};

const PAYMENT_LABELS = {
  unpaid: { label: 'Unpaid', bg: 'bg-red-50 text-red-700 border-red-200' },
  pending_verification: { label: 'Pending Verification', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
  paid: { label: 'Paid', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const TIMELINE_ICONS = [FileText, BadgeCheck, Clock, PackageCheck, CheckCheck, XCircle];

function getBadge(status, payment_status) {
  if (status === 'Cancelled') return STATUS_LABELS['Cancelled'];
  if (status === 'Pending' && payment_status === 'paid') return { label: 'Paid — Awaiting Processing', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  if (status === 'Pending') return STATUS_LABELS['Pending'];
  if (status === 'Processing') return STATUS_LABELS['Processing'];
  if (status === 'Ready for Release') return STATUS_LABELS['Ready for Release'];
  if (status === 'Claimed') return STATUS_LABELS['Claimed'];
  return STATUS_LABELS['Pending'];
}

function buildTimeline(status, payment_status) {
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
    { step: 'Claimed', desc: 'Document released to student.', key: 'claimed' },
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

export default function StudentTrackDashboard({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [request, setRequest] = useState(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const getCsrfToken = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setSearching(true);
    setError('');
    setRequest(null);

    try {
      const res = await fetch(`/requests/${encodeURIComponent(q)}`, {
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Tracking number not found.');
        setSearching(false);
        return;
      }

      setRequest(data.request);
    } catch {
      setError('Network error. Please check your connection.');
    }

    setSearching(false);
  };

  const handleCancel = async () => {
    if (!request || !confirm('Are you sure you want to cancel this request?')) return;

    setCancelling(true);
    try {
      const res = await fetch(`/requests/${encodeURIComponent(request.tracking_number)}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to cancel request.');
        setCancelling(false);
        return;
      }

      const searchRes = await fetch(`/requests/${encodeURIComponent(request.tracking_number)}`, {
        headers: { 'Accept': 'application/json' },
      });
      const searchData = await searchRes.json();
      if (searchData.success) setRequest(searchData.request);
    } catch {
      setError('Network error. Please check your connection.');
    }
    setCancelling(false);
  };

  const timeline = request ? buildTimeline(request.status, request.payment_status) : [];

  return (
    <div className="font-body-md text-on-surface bg-surface min-h-screen flex flex-col">
      {/* TopAppBar */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 w-full bg-surface/80 backdrop-blur-md border-b border-outline-variant">
        <div className="flex items-center gap-4 cursor-pointer" onClick={(e) => { e.preventDefault(); onNavigate('/'); }}>
          <img
            alt="Top Link Global College Logo"
            className="h-14 w-auto object-contain"
            src="/images/logo.png"
            onError={(e) => {
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 24 24' fill='%231a6e38'%3E%3Cpath d='M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z'/%3E%3C/svg%3E";
            }}
          />
          <div className="flex flex-col">
            <span className="text-headline-sm font-bold text-primary leading-tight">TLGC</span>
            <span className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Credentials</span>
          </div>
        </div>
        <nav className="hidden md:flex gap-2 items-center">
          <a className="text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high transition-all px-5 py-2.5 rounded-full" href="/" onClick={(e) => { e.preventDefault(); onNavigate('/'); }}>Home</a>
          <a className="text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high transition-all px-5 py-2.5 rounded-full" href="/request" onClick={(e) => { e.preventDefault(); onNavigate('/request'); }}>Request</a>
          <a className="text-primary font-bold font-label-md text-label-md hover:bg-primary/10 transition-all px-5 py-2.5 rounded-full" href="/track" onClick={(e) => { e.preventDefault(); onNavigate('/track'); }}>Track</a>
        </nav>
      </header>

      <main className="flex-grow flex flex-col pb-20 md:pb-8">
        <div className="px-margin-mobile md:px-margin-desktop py-8 max-w-container-max mx-auto w-full">
          <div className="mb-12 animate-fade-in-up text-center md:text-left">
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Track Your Request</h2>
            <p className="text-body-md text-on-surface-variant mb-8">Enter your reference number to check the live status of your academic documents.</p>

            <form onSubmit={handleSearch} className="relative max-w-xl mx-auto md:mx-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-32 py-4 bg-surface-container-lowest border border-outline rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md"
                placeholder="e.g., TLGC-2026-00001"
              />
              <button
                type="submit"
                disabled={searching}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-on-primary px-6 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                {searching ? 'SEARCHING...' : 'SEARCH'}
              </button>
            </form>
          </div>

          {error && (
            <div className="max-w-xl mx-auto mb-8 p-4 rounded-lg bg-error/10 border border-error/30 animate-fade-in-up">
              <p className="text-body-md text-error flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop animate-fade-in-up">
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
                {request ? (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Reference Number</span>
                        <h3 className="font-headline-sm text-headline-sm text-primary mt-1">{request.tracking_number}</h3>
                      </div>
                      {(() => {
                        const s = getBadge(request.status, request.payment_status);
                        return (
                          <span className={`${s.bg} px-3 py-1.5 rounded-full text-xs font-bold border shrink-0`}>
                            {s.label}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-outline-variant pb-2">
                        <span className="text-on-surface-variant font-medium">Student:</span>
                        <span className="font-bold text-on-surface">{request.student_name}</span>
                      </div>
                      <div className="flex justify-between border-b border-outline-variant pb-2">
                        <span className="text-on-surface-variant font-medium">Document(s):</span>
                        <span className="font-bold text-on-surface text-right">{(request.documents || []).join(', ')}</span>
                      </div>
                      {request.semesters && request.semesters.length > 0 && (
                        <div className="flex justify-between border-b border-outline-variant pb-2">
                          <span className="text-on-surface-variant font-medium">Semester(s):</span>
                          <span className="font-bold text-on-surface text-right">{request.semesters.join(', ')}</span>
                        </div>
                      )}
                      {request.pages && (
                        <div className="flex justify-between border-b border-outline-variant pb-2">
                          <span className="text-on-surface-variant font-medium">Pages:</span>
                          <span className="font-bold text-on-surface text-right">{request.pages}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-b border-outline-variant pb-2">
                        <span className="text-on-surface-variant font-medium">Request Date:</span>
                        <span className="font-bold text-on-surface">{request.created_at}</span>
                      </div>
                      <div className="flex justify-between border-b border-outline-variant pb-2">
                        <span className="text-on-surface-variant font-medium">Processing Time:</span>
                        <span className="font-bold text-on-surface">{request.processing_days} Working Day(s)</span>
                      </div>
                      {request.remarks && (
                        <div className="flex justify-between border-b border-outline-variant pb-2">
                          <span className="text-on-surface-variant font-medium">Remarks:</span>
                          <span className="font-bold text-on-surface text-right">{request.remarks}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-b border-outline-variant pb-2">
                        <span className="text-on-surface-variant font-medium">Payment Method:</span>
                        <span className="font-bold text-on-surface">{request.payment_method === 'cash' ? 'Cash Payment' : request.payment_method === 'online' ? 'Online Payment' : request.payment_method}</span>
                      </div>
                      <div className="flex justify-between pb-2">
                        <span className="text-on-surface-variant font-medium">Payment Status:</span>
                        {(() => {
                          const p = PAYMENT_LABELS[request.payment_status];
                          return p ? <span className={`${p.bg} px-2 py-0.5 rounded text-xs font-bold border`}>{p.label}</span>
                            : <span className="font-bold text-on-surface">{request.payment_status}</span>;
                        })()}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t-2 border-primary/20 flex justify-between items-center">
                      <span className="font-headline-sm text-lg font-bold text-on-surface">Total Processing Fee:</span>
                      <span className="text-2xl font-bold text-primary">₱ {Number(request.total_fee).toFixed(2)}</span>
                    </div>

                    {request.status === 'Pending' && (
                      <div className="mt-6 pt-4 border-t border-outline-variant flex justify-end">
                        <button
                          onClick={handleCancel}
                          disabled={cancelling}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          {cancelling ? 'Cancelling...' : 'Cancel Request'}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">No Request Selected</h3>
                    <p className="text-xs text-on-surface-variant max-w-xs mb-8 leading-relaxed">
                      Your request information will appear here after entering a valid reference number.
                    </p>
                    <div className="w-full space-y-3">
                      {['Student', 'Document(s)', 'Request Date', 'Processing Time', 'Payment Method', 'Payment Status'].map((label) => (
                        <div key={label} className="flex justify-between border-b border-outline-variant pb-2">
                          <span className="text-on-surface-variant font-medium">{label}:</span>
                          <span className="w-28 h-4 rounded bg-slate-100 animate-pulse" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-surface-container-high border border-outline-variant rounded-2xl p-6 h-full">
                <div className="mb-6">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">Request Journey</h3>
                  <p className="text-label-md text-on-surface-variant">
                    {request ? (
                      <>Reference: <span className="font-bold text-primary">{request.tracking_number}</span></>
                    ) : (
                      'Track your credential request progress.'
                    )}
                  </p>
                </div>

                {request ? (
                  <div className="flex flex-col gap-1">
                    {timeline.map((item, index) => {
                      const isLast = index === timeline.length - 1;
                      const IconComponent = TIMELINE_ICONS[index];
                      return (
                        <div key={item.key || index} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              item.done
                                ? request.status === 'Cancelled' && index === timeline.length - 1
                                  ? 'bg-red-500 text-white shadow-sm'
                                  : 'bg-primary text-on-primary shadow-sm'
                                : item.active
                                  ? 'bg-primary/10 text-primary ring-4 ring-primary/20'
                                  : 'bg-surface-container-low text-on-surface-variant border border-outline-variant'
                            }`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            {!isLast && (
                              <div className={`w-px grow min-h-[24px] ${
                                item.done
                                  ? request.status === 'Cancelled'
                                    ? 'bg-red-300'
                                    : 'bg-primary/30'
                                  : 'border-l border-dashed border-outline-variant'
                              }`}></div>
                            )}
                          </div>

                          <div className={`pb-4 pt-0.5 ${!item.done && !item.active ? 'opacity-40' : ''}`}>
                            <p className={`text-sm font-bold leading-tight ${
                              item.done
                                ? request.status === 'Cancelled' && index === timeline.length - 1
                                  ? 'text-red-600'
                                  : 'text-primary'
                                : item.active ? 'text-primary' : 'text-on-surface'
                            }`}>
                              {item.step}
                            </p>
                            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {[FileText, BadgeCheck, Clock, PackageCheck, CheckCheck].map((Icon, index) => {
                      const isLast = index === 4;
                      const labels = ['Request Submitted', 'Payment Verified', 'Currently Processing', 'Ready for Release', 'Claimed'];
                      return (
                        <div key={labels[index]} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-surface-container-low text-slate-300 border border-outline-variant">
                              <Icon className="w-4 h-4" />
                            </div>
                            {!isLast && (
                              <div className="w-px grow min-h-[24px] border-l border-dashed border-outline-variant"></div>
                            )}
                          </div>
                          <div className="pb-4 pt-0.5">
                            <p className="text-sm font-bold leading-tight text-slate-300">{labels[index]}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div className="text-center mt-4 pt-4 border-t border-outline-variant">
                      <p className="text-xs text-slate-300 italic">Your request progress will appear here.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-16 px-margin-mobile md:px-margin-desktop bg-surface-container-highest border-t border-outline-variant">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <img
                alt="Logo"
                className="h-10 w-auto opacity-70 grayscale hover:grayscale-0 transition-all"
                src="/images/logo.png"
                onError={(e) => {
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='%231a6e38'%3E%3Cpath d='M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z'/%3E%3C/svg%3E";
                }}
              />
              <span className="font-headline-sm text-xl text-on-surface">Top Link Global College</span>
            </div>
            <p className="font-body-sm text-on-surface-variant">Empowering students through accessible academic records since 2018.</p>
            <p className="font-label-sm text-outline">&copy; {new Date().getFullYear()} Top Link Global College. All Rights Reserved.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
            <div className="flex flex-col gap-4">
              <span className="font-label-md font-bold text-primary uppercase">Quick Links</span>
              <nav className="flex flex-col gap-2">
                <a className="text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="/request" onClick={(e) => { e.preventDefault(); onNavigate('/request'); }}>Request Form</a>
                <a className="text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="/track" onClick={(e) => e.preventDefault()}>Track Status</a>
                <a className="text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Payment Info</a>
              </nav>
            </div>
            <div className="flex flex-col gap-4">
              <span className="font-label-md font-bold text-primary uppercase">Legal</span>
              <nav className="flex flex-col gap-2">
                <a className="text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
                <a className="text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Use</a>
              </nav>
            </div>
            <div className="flex flex-col gap-4 col-span-2 sm:col-span-1">
              <span className="font-label-md font-bold text-primary uppercase">Support</span>
              <nav className="flex flex-col gap-2">
                <a className="text-body-sm text-on-surface-variant hover:text-primary flex items-center gap-2" href="mailto:support@toplink.edu">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                  support@toplink.edu
                </a>
                <a className="text-body-sm text-on-surface-variant hover:text-primary flex items-center gap-2" href="#">
                  <span className="material-symbols-outlined text-[18px]">help</span>
                  Help Center
                </a>
              </nav>
            </div>
          </div>
        </div>
      </footer>

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 md:hidden px-2 pb-safe bg-surface border-t border-outline-variant shadow-lg">
        <button onClick={(e) => { e.preventDefault(); onNavigate('/'); }} className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-1.5 active:scale-95 transition-transform cursor-pointer">
          <span className="material-symbols-outlined">home</span>
          <span className="font-label-sm text-[10px] font-bold">HOME</span>
        </button>
        <button onClick={(e) => { e.preventDefault(); onNavigate('/request'); }} className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-1.5 active:scale-95 transition-transform cursor-pointer">
          <span className="material-symbols-outlined">add_circle</span>
          <span className="font-label-sm text-[10px] font-bold">REQUEST</span>
        </button>
        <button onClick={(e) => { e.preventDefault(); onNavigate('/track'); }} className="flex flex-col items-center justify-center text-primary bg-primary-fixed rounded-full px-5 py-1.5 active:scale-95 transition-transform cursor-pointer">
          <span className="material-symbols-outlined">analytics</span>
          <span className="font-label-sm text-[10px] font-bold">TRACK</span>
        </button>
      </nav>
    </div>
  );
}

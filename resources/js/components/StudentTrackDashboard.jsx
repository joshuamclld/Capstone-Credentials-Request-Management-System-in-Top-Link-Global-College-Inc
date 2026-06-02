import React, { useState } from 'react';

const STATUS_LABELS = {
  'Pending': { label: 'Pending Review', bg: 'bg-tertiary-container', text: 'text-on-tertiary-container', icon: 'pending' },
  'Processing': { label: 'Processing', bg: 'bg-secondary-container', text: 'text-on-secondary-container', icon: 'sync' },
  'Ready for Pickup': { label: 'Ready for Pickup', bg: 'bg-primary-container', text: 'text-on-primary-container', icon: 'mail' },
  'Completed': { label: 'Completed', bg: 'bg-primary-container', text: 'text-on-primary-container', icon: 'check_circle' },
  'Released': { label: 'Released', bg: 'bg-primary-container', text: 'text-on-primary-container', icon: 'task_alt' },
};

function buildTimeline(status, createdAt) {
  const steps = [
    { step: 'Request Submitted', desc: 'Your application was successfully received by the Registrar\'s Office.', key: 'submitted' },
    { step: 'Payment Verified', desc: 'Your processing fee has been confirmed.', key: 'payment' },
    { step: 'Currently Processing', desc: 'The Registrar is now preparing and verifying your academic records.', key: 'processing' },
    { step: 'Ready for Pick-up', desc: 'Your document is prepared and certified, ready for pick-up.', key: 'ready' },
    { step: 'Released', desc: 'Document released to student.', key: 'released' },
  ];

  const statusOrder = ['Pending', 'Processing', 'Ready for Pickup', 'Completed', 'Released'];
  const currentIdx = statusOrder.indexOf(status);

  return steps.map((s, i) => ({
    ...s,
    done: i < currentIdx,
    active: i === currentIdx,
  }));
}

export default function StudentTrackDashboard({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [request, setRequest] = useState(null);
  const [error, setError] = useState('');

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

      if (!data.success) {
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

  const timeline = request ? buildTimeline(request.status, request.created_at) : [];

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
              e.target.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuCyMyPRtdQPf2Gskza0ayx5mNzvWT4tgO9yFmfXXsefaddaBTwUvTgYlWlWRJkMJmmvz8ueNr0ogEN2P3H9HlduWN59CLbmCUS-Sava7XzZ85xXL2CXpbHeZ0FpohCD3LoojhIz4lDxRmFgceThTZVWO6RfIXoDw4QNe2vrVGvik2DcE1oj_OWCLI48o-x9viGfWL_686ah978VK6oQwGAEr9tMroLasRlhWDJDWxYGQz9TEGby0kxKxKjHRF67jCUf3ZPlQhEzadk";
            }}
          />
          <div className="flex flex-col">
            <span className="text-headline-sm font-bold text-primary leading-tight">TLGC</span>
            <span className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Credentials</span>
          </div>
        </div>
        <nav className="hidden md:flex gap-2 items-center">
          <a
            className="text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high transition-all px-5 py-2.5 rounded-full"
            href="/"
            onClick={(e) => { e.preventDefault(); onNavigate('/'); }}
          >
            Home
          </a>
          <a
            className="text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high transition-all px-5 py-2.5 rounded-full"
            href="/request"
            onClick={(e) => { e.preventDefault(); onNavigate('/request'); }}
          >
            Request
          </a>
          <a
            className="text-primary font-bold font-label-md text-label-md hover:bg-primary/10 transition-all px-5 py-2.5 rounded-full"
            href="/track"
            onClick={(e) => e.preventDefault()}
          >
            Track
          </a>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col pb-20 md:pb-8">
        <div className="px-margin-mobile md:px-margin-desktop py-8 max-w-container-max mx-auto w-full">

          {/* Page Header & Search Section */}
          <div className="mb-12 animate-fade-in-up text-center md:text-left">
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Track Your Request</h2>
            <p className="text-body-md text-on-surface-variant mb-8">Enter your reference number to check the live status of your academic documents.</p>

            <form onSubmit={handleSearch} className="relative max-w-xl mx-auto md:mx-0">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
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

          {/* Error Message */}
          {error && (
            <div className="max-w-xl mx-auto mb-8 p-4 rounded-lg bg-error/10 border border-error/30 animate-fade-in-up">
              <p className="text-body-md text-error flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                {error}
              </p>
            </div>
          )}

          {/* Request Details — only shown after successful search */}
          {request && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop animate-fade-in-up">
              {/* Request Info Card */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Reference Number</span>
                      <h3 className="font-headline-sm text-headline-sm text-primary mt-1">{request.tracking_number}</h3>
                    </div>
                    {(() => {
                      const s = STATUS_LABELS[request.status] || STATUS_LABELS['Pending'];
                      return (
                        <span className={`${s.bg} ${s.text} px-3 py-1 rounded-full text-label-md font-label-md flex items-center gap-1`}>
                          <span className="material-symbols-outlined text-[14px]">{s.icon}</span>
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
                      <span className="font-bold text-on-surface text-right">{request.documents.join(', ')}</span>
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
                      <span className="font-bold text-on-surface">{request.payment_status === 'unpaid' ? 'Unpaid' : request.payment_status === 'pending_verification' ? 'Pending Verification' : request.payment_status === 'paid' ? 'Paid' : request.payment_status === 'rejected' ? 'Rejected' : request.payment_status}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t-2 border-primary/20 flex justify-between items-center">
                    <span className="font-headline-sm text-lg font-bold text-on-surface">Total Processing Fee:</span>
                    <span className="text-2xl font-bold text-primary">₱ {Number(request.total_fee).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Timeline Section (Right Column) */}
              <div className="lg:col-span-5">
                <div className="bg-surface-container-high border border-outline-variant rounded-2xl p-6 h-full animate-slide-in-right">
                  <div className="mb-6">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">Request Journey</h3>
                    <p className="text-label-md text-on-surface-variant">
                      Reference: <span className="font-bold text-primary">{request.tracking_number}</span>
                    </p>
                  </div>

                  <div className="flex flex-col gap-0">
                    {timeline.map((item, index) => {
                      const isLast = index === timeline.length - 1;
                      return (
                        <div key={item.key} className="flex gap-4 min-h-[80px]">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              item.done
                                ? 'bg-primary text-on-primary'
                                : item.active
                                  ? 'bg-secondary-container text-secondary ring-4 ring-secondary-container/30'
                                  : 'bg-surface-container-low text-on-surface-variant border border-outline-variant'
                            }`}>
                              <span className="material-symbols-outlined text-[18px]">
                                {index === 0 ? 'description' :
                                 index === 1 ? 'payments' :
                                 index === 2 ? 'inventory_2' :
                                 index === 3 ? 'mail' : 'task_alt'}
                              </span>
                            </div>
                            {!isLast && (
                              <div className={`w-0.5 h-full ${
                                item.done
                                  ? 'bg-primary/30'
                                  : 'border-l-2 border-dashed border-outline-variant'
                              }`}></div>
                            )}
                          </div>

                          <div className={`pb-6 ${!item.done && !item.active ? 'opacity-60' : ''}`}>
                            <p className={`font-headline-sm text-label-md font-bold ${
                              item.done ? 'text-primary' : item.active ? 'text-secondary' : 'text-on-surface'
                            }`}>
                              {item.step}
                            </p>
                            <p className="text-body-sm text-on-surface-variant leading-snug">{item.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-16 px-margin-mobile md:px-margin-desktop bg-surface-container-highest border-t border-outline-variant">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <img
                alt="Logo"
                className="h-10 w-auto opacity-70 grayscale hover:grayscale-0 transition-all"
                src="/images/logo.png"
                onError={(e) => {
                  e.target.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuCyMyPRtdQPf2Gskza0ayx5mNzvWT4tgO9yFmfXXsefaddaBTwUvTgYlWlWRJkMJmmvz8ueNr0ogEN2P3H9HlduWN59CLbmCUS-Sava7XzZ85xXL2CXpbHeZ0FpohCD3LoojhIz4lDxRmFgceThTZVWO6RfIXoDw4QNe2vrVGvik2DcE1oj_OWCLI48o-x9viGfWL_686ah978VK6oQwGAEr9tMroLasRlhWDJDWxYGQz9TEGby0kxKxKjHRF67jCUf3ZPlQhEzadk";
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

      {/* BottomNavBar (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 md:hidden px-2 pb-safe bg-surface border-t border-outline-variant shadow-lg">
        <button
          onClick={(e) => { e.preventDefault(); onNavigate('/'); }}
          className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-1.5 active:scale-95 transition-transform cursor-pointer"
        >
          <span className="material-symbols-outlined">home</span>
          <span className="font-label-sm text-[10px] font-bold">HOME</span>
        </button>
        <button
          onClick={(e) => { e.preventDefault(); onNavigate('/request'); }}
          className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-1.5 active:scale-95 transition-transform cursor-pointer"
        >
          <span className="material-symbols-outlined">add_circle</span>
          <span className="font-label-sm text-[10px] font-bold">REQUEST</span>
        </button>
        <button
          onClick={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center text-primary bg-primary-fixed rounded-full px-5 py-1.5 active:scale-95 transition-transform cursor-pointer"
        >
          <span className="material-symbols-outlined">analytics</span>
          <span className="font-label-sm text-[10px] font-bold">TRACK</span>
        </button>
      </nav>
    </div>
  );
}

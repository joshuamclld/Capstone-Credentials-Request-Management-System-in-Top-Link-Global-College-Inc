import React, { useState, useEffect } from 'react';

const DEFAULT_REQUESTS = [
  {
    ref: 'REQ-2026-1029',
    title: 'Transcript of Records',
    date: 'May 12, 2026',
    status: 'Processing',
    progress: 65,
    purpose: 'Employment Board Exam',
    price: 150,
    pickup: 'Registrar Office Claim',
    fullName: 'Juan Dela Cruz',
    timeline: [
      { step: 'Request Submitted', desc: 'Your application was successfully received by the Registrar\'s Office.', time: 'May 12, 09:15 AM', done: true },
      { step: 'Payment Verified', desc: 'Processing fee of PHP 150.00 confirmed via Online Portal.', time: 'May 12, 11:30 AM', done: true },
      { step: 'Currently Processing', desc: 'The Registrar is now preparing and verifying your academic records.', time: 'May 14, 02:00 PM', done: true, active: true },
      { step: 'Ready for Pick-up', desc: 'Awaiting document signature and official seal application.', time: '', done: false },
      { step: 'Released', desc: 'Document released to student.', time: '', done: false }
    ]
  },
  {
    ref: 'REQ-2026-1105',
    title: 'Certificate of Good Moral',
    date: 'June 02, 2026',
    status: 'Pending',
    progress: 20,
    purpose: 'Transferring School',
    price: 50,
    pickup: 'Registrar Office Claim',
    fullName: 'Juan Dela Cruz',
    timeline: [
      { step: 'Request Submitted', desc: 'Your application was successfully received by the Registrar\'s Office.', time: 'June 02, 08:30 AM', done: true, active: true },
      { step: 'Payment Verified', desc: 'Confirming processing fee of PHP 50.00.', time: '', done: false },
      { step: 'Currently Processing', desc: 'Verification of clearance and character references.', time: '', done: false },
      { step: 'Ready for Pick-up', desc: 'Document is prepared and certified.', time: '', done: false },
      { step: 'Released', desc: 'Document released to student.', time: '', done: false }
    ]
  },
  {
    ref: 'REQ-2026-0988',
    title: 'Certificate of Grades',
    date: 'April 15, 2026',
    status: 'Completed',
    progress: 100,
    purpose: 'Graduate School Application',
    price: 100,
    pickup: 'Registrar Office Claim',
    fullName: 'Juan Dela Cruz',
    timeline: [
      { step: 'Request Submitted', desc: 'Your application was successfully received by the Registrar\'s Office.', time: 'April 15, 10:00 AM', done: true },
      { step: 'Payment Verified', desc: 'Processing fee of PHP 100.00 confirmed.', time: 'April 15, 11:00 AM', done: true },
      { step: 'Currently Processing', desc: 'Registrar compiling grade records for 2 semesters.', time: 'April 20, 09:00 AM', done: true },
      { step: 'Ready for Pick-up', desc: 'Certificate ready at registrar front desk.', time: 'April 28, 01:30 PM', done: true },
      { step: 'Released', desc: 'Document released to student.', time: 'May 01, 02:30 PM', done: true, active: true }
    ]
  }
];

export default function StudentTrackDashboard({ onNavigate }) {
  const [requests, setRequests] = useState([]);
  const [selectedRef, setSelectedRef] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    // Load default requests + any requests from localStorage
    const saved = JSON.parse(localStorage.getItem('student_requests') || '[]');
    
    // Convert saved requests into full format with timeline
    const formattedSaved = saved.map(req => {
      // If timeline is already present, use it, otherwise generate one based on status
      if (req.timeline) return req;
      return {
        ...req,
        timeline: [
          { step: 'Request Submitted', desc: 'Your application was successfully received by the Registrar\'s Office.', time: `${req.date}, 10:00 AM`, done: true, active: true },
          { step: 'Payment Verified', desc: `Processing fee of PHP ${req.price.toFixed(2)} confirmed.`, time: '', done: false },
          { step: 'Currently Processing', desc: 'The Registrar is now preparing and verifying your academic records.', time: '', done: false },
          { step: 'Ready for Pick-up', desc: 'Awaiting document signature and official seal application.', time: '', done: false },
          { step: 'Released', desc: 'Document released to student.', time: '', done: false }
        ]
      };
    });

    const allRequests = [...formattedSaved, ...DEFAULT_REQUESTS];
    setRequests(allRequests);
    
    // Auto-select the first request
    if (allRequests.length > 0) {
      setSelectedRef(allRequests[0].ref);
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const matched = requests.find(
      r => r.ref.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

    if (matched) {
      setSelectedRef(matched.ref);
    } else {
      alert(`No request found with reference number: ${searchQuery}`);
    }
  };

  const selectedRequest = requests.find(r => r.ref === selectedRef) || requests[0];

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
                placeholder="e.g., REQ-2026-1029" 
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-on-primary px-6 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity cursor-pointer"
              >
                SEARCH
              </button>
            </form>
          </div>

          {/* Dashboard Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop">
            
            {/* Active Requests Section (Left Column) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Recent Requests</h3>
              </div>

              {requests.length === 0 ? (
                <div className="bg-surface-container-lowest border border-outline-variant p-10 rounded-xl text-center">
                  <p className="text-body-md text-on-surface-variant">No request records found.</p>
                </div>
              ) : (
                requests.map((req) => {
                  const isSelected = selectedRef === req.ref;
                  return (
                    <div 
                      key={req.ref}
                      onClick={() => setSelectedRef(req.ref)}
                      className={`p-5 rounded-xl flex flex-col gap-4 border transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-surface-container-lowest border-primary ring-1 ring-primary/10 shadow-md' 
                          : 'bg-surface-container-lowest border-outline-variant hover:border-outline'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">{req.ref}</span>
                          <h4 className="font-headline-sm text-headline-sm text-on-surface">{req.title}</h4>
                        </div>
                        
                        {req.status === 'Processing' && (
                          <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-label-md font-label-md flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                            Processing
                          </span>
                        )}
                        {req.status === 'Pending' && (
                          <span className="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-label-md font-label-md flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">pending</span>
                            Pending Review
                          </span>
                        )}
                        {req.status === 'Completed' && (
                          <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-label-md font-label-md flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
                            Completed
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-body-sm text-on-surface-variant">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                          Filed {req.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[18px]">person</span>
                          For: {req.fullName}
                        </div>
                      </div>

                      <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            req.status === 'Completed' ? 'bg-primary' : req.status === 'Pending' ? 'bg-tertiary' : 'bg-secondary'
                          }`}
                          style={{ width: `${req.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* History Timeline Section (Right Column) */}
            {selectedRequest && (
              <div className="lg:col-span-5">
                <div className="bg-surface-container-high border border-outline-variant rounded-2xl p-6 h-full animate-slide-in-right">
                  <div className="mb-6">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">Request Journey</h3>
                    <p className="text-label-md text-on-surface-variant">
                      Reference: <span className="font-bold text-primary">{selectedRequest.ref}</span>
                    </p>
                  </div>

                  {/* Timeline */}
                  <div className="flex flex-col gap-0">
                    {selectedRequest.timeline.map((item, index) => {
                      const isLast = index === selectedRequest.timeline.length - 1;
                      return (
                        <div key={item.step} className="flex gap-4 min-h-[80px]">
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
                            {item.time && (
                              <p className="text-label-sm text-on-surface-variant mt-1">{item.time}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
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
            <p className="font-label-sm text-outline">© {new Date().getFullYear()} Top Link Global College. All Rights Reserved.</p>
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

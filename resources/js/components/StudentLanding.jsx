import React from 'react';

export default function StudentLanding({ onNavigate }) {
  const handleRequestClick = (e) => {
    e.preventDefault();
    onNavigate('/request');
  };

  const handleTrackClick = (e) => {
    e.preventDefault();
    onNavigate('/track');
  };

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
              // Fallback logo path if not found
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
            className="text-primary font-bold font-label-md text-label-md hover:bg-primary/10 transition-all px-5 py-2.5 rounded-full" 
            href="/"
            onClick={(e) => { e.preventDefault(); onNavigate('/'); }}
          >
            Home
          </a>
          <a 
            className="text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high transition-all px-5 py-2.5 rounded-full" 
            href="/request"
            onClick={handleRequestClick}
          >
            Request
          </a>
          <a 
            className="text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high transition-all px-5 py-2.5 rounded-full" 
            href="/track"
            onClick={handleTrackClick}
          >
            Track
          </a>
        </nav>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-surface-container-low py-20 md:py-32 flex items-center justify-center text-center">
          <div className="relative z-10 max-w-5xl px-margin-mobile md:px-margin-desktop">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant mb-8 border border-primary-container/20 animate-fade-in-up">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span className="font-label-md text-label-md">Official Student Credentials Request</span>
            </div>
            
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-5xl text-on-background mb-8 leading-[1.1] animate-card">
              Your Academic Journey, <br /> Fully Documented &amp; Accessible.
            </h1>
            
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-12 max-w-2xl mx-auto">
              Streamline your credentials management. Request transcripts, diplomas, and certifications through our secure digital portal designed for modern efficiency.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleRequestClick}
                className="bg-primary text-on-primary font-label-md text-label-md px-10 py-5 rounded-xl flex items-center justify-center gap-3 hover:opacity-90 hover:scale-[1.02] transition-all shadow-lg shadow-primary/20 cursor-pointer"
              >
                Request Documents
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <button 
                onClick={handleTrackClick}
                className="border-2 border-primary/20 text-primary font-label-md text-label-md px-10 py-5 rounded-xl flex items-center justify-center gap-3 hover:bg-primary/5 transition-all cursor-pointer"
              >
                View Request History
                <span className="material-symbols-outlined">history</span>
              </button>
            </div>
          </div>
          {/* Background Decorative Elements */}
          <div className="absolute left-0 top-0 w-1/3 h-full opacity-5 pointer-events-none">
            <div className="w-full h-full bg-primary rounded-full blur-[150px] -ml-32 -mt-32"></div>
          </div>
          <div className="absolute right-0 bottom-0 w-1/4 h-full opacity-5 pointer-events-none">
            <div className="w-full h-full bg-secondary rounded-full blur-[120px] -mr-32 -mb-32"></div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-24">
          <div className="text-center mb-16">
            <h2 className="font-headline-md text-3xl text-on-background mb-4">Streamlined Fulfillment</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">Our automated workflow ensures your academic credentials reach you through a secure three-step process.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="group relative p-10 bg-surface-container-lowest border border-outline-variant rounded-2xl hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <div className="mb-8 w-14 h-14 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary transition-all duration-500">
                <span className="material-symbols-outlined text-3xl">edit_document</span>
              </div>
              <div className="absolute top-10 right-10 text-surface-container-high font-bold text-5xl opacity-30 group-hover:opacity-100 transition-opacity">01</div>
              <h3 className="font-headline-sm text-xl text-on-background mb-4">1. Fill out Request</h3>
              <p className="text-on-surface-variant text-body-md leading-relaxed">Complete the digital application form with your specific document requirements and personal details.</p>
            </div>
            {/* Step 2 */}
            <div className="group relative p-10 bg-surface-container-lowest border border-outline-variant rounded-2xl hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <div className="mb-8 w-14 h-14 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary transition-all duration-500">
                <span className="material-symbols-outlined text-3xl">payments</span>
              </div>
              <div className="absolute top-10 right-10 text-surface-container-high font-bold text-5xl opacity-30 group-hover:opacity-100 transition-opacity">02</div>
              <h3 className="font-headline-sm text-xl text-on-background mb-4">2. Pay Processing Fee</h3>
              <p className="text-on-surface-variant text-body-md leading-relaxed">Securely settle document processing fees via our integrated payment gateway to initiate your request.</p>
            </div>
            {/* Step 3 */}
            <div className="group relative p-10 bg-surface-container-lowest border border-outline-variant rounded-2xl hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <div className="mb-8 w-14 h-14 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary transition-all duration-500">
                <span className="material-symbols-outlined text-3xl">analytics</span>
              </div>
              <div className="absolute top-10 right-10 text-surface-container-high font-bold text-5xl opacity-30 group-hover:opacity-100 transition-opacity">03</div>
              <h3 className="font-headline-sm text-xl text-on-background mb-4">3. Track Approval</h3>
              <p className="text-on-surface-variant text-body-md leading-relaxed">Monitor your request's progress in real-time through your personalized student dashboard until completion.</p>
            </div>
          </div>
        </section>

        {/* Stats/Info Bento Grid */}
        <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pb-32">
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[500px]">
            <div className="md:col-span-2 md:row-span-2 bg-primary-container p-12 rounded-3xl text-on-primary flex flex-col justify-between overflow-hidden relative group hover:shadow-2xl transition-all">
              <div className="relative z-10">
                <h4 className="font-headline-md text-3xl mb-6">Fast Processing</h4>
                <p className="font-body-lg opacity-90 max-w-xs">Most requests are reviewed and processed within 3-5 business days from payment verification.</p>
              </div>
              <div className="relative z-10 mt-8 flex items-baseline gap-2">
                <span className="text-6xl font-bold">98%</span>
                <div className="flex flex-col">
                  <p className="text-label-md font-bold uppercase tracking-widest">Satisfaction</p>
                  <p className="text-label-sm opacity-80">Annual Student Rate</p>
                </div>
              </div>
              <div className="absolute -right-16 -bottom-16 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                <span className="material-symbols-outlined text-[320px]" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
              </div>
            </div>
            
            <div className="md:col-span-2 bg-surface-container p-10 rounded-3xl flex items-center gap-8 hover:bg-surface-container-high transition-colors">
              <div className="bg-primary/10 p-5 rounded-2xl">
                <span className="material-symbols-outlined text-primary text-4xl">security</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-2xl mb-2">Encrypted Data</h4>
                <p className="text-body-md text-on-surface-variant">Your records are protected with industry-standard TLS 1.3 encryption and SOC2 compliant protocols.</p>
              </div>
            </div>
            
            <div className="bg-secondary-container p-10 rounded-3xl flex flex-col justify-center text-center hover:scale-[1.02] transition-transform">
              <span className="text-5xl font-bold text-on-secondary-container mb-2">24/7</span>
              <p className="text-label-md font-bold text-on-secondary-container uppercase tracking-widest">Global Access</p>
            </div>
            
            <div className="bg-tertiary-fixed p-10 rounded-3xl flex flex-col justify-center text-center hover:scale-[1.02] transition-transform">
              <span className="text-5xl font-bold text-on-tertiary-fixed-variant mb-2">HD</span>
              <p className="text-label-md font-bold text-on-tertiary-fixed-variant uppercase tracking-widest">Digital Copy</p>
            </div>
          </div>
        </section>
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
                <a 
                  className="text-body-sm text-on-surface-variant hover:text-primary transition-colors" 
                  href="/request"
                  onClick={handleRequestClick}
                >
                  Request Form
                </a>
                <a 
                  className="text-body-sm text-on-surface-variant hover:text-primary transition-colors" 
                  href="/track"
                  onClick={handleTrackClick}
                >
                  Track Status
                </a>
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
          className="flex flex-col items-center justify-center text-primary bg-primary-fixed rounded-full px-5 py-1.5 active:scale-95 transition-transform cursor-pointer"
        >
          <span className="material-symbols-outlined">home</span>
          <span className="font-label-sm text-[10px] font-bold">HOME</span>
        </button>
        <button 
          onClick={handleRequestClick}
          className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-1.5 active:scale-95 transition-transform cursor-pointer"
        >
          <span className="material-symbols-outlined">add_circle</span>
          <span className="font-label-sm text-[10px] font-bold">REQUEST</span>
        </button>
        <button 
          onClick={handleTrackClick}
          className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-1.5 active:scale-95 transition-transform cursor-pointer"
        >
          <span className="material-symbols-outlined">analytics</span>
          <span className="font-label-sm text-[10px] font-bold">TRACK</span>
        </button>
      </nav>

      {/* FAB (Mobile Only) */}
      <div className="fixed bottom-20 right-6 md:hidden z-50">
        <button 
          onClick={handleRequestClick}
          className="w-14 h-14 bg-primary text-on-primary rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>
    </div>
  );
}

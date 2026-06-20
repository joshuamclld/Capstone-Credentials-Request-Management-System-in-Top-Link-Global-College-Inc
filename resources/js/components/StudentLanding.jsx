import React, { useState, useEffect } from 'react';
import StudentNavbar from './student/StudentNavbar';
import StudentHeroSection from './student/StudentHeroSection';
import StudentFeatureCard from './student/StudentFeatureCard';
import StudentFooter from './student/StudentFooter';
import StudentAuthModal from './student/StudentAuthModal';

export default function StudentLanding({ student, onLogout, onNavigate, currentPath, initialAuthTab, onStudentLogin }) {
  const [authModal, setAuthModal] = useState({ open: false, tab: 'login' });

  useEffect(() => {
    if (initialAuthTab) openAuth(initialAuthTab);
  }, [initialAuthTab]);

  const openAuth = (tab) => setAuthModal({ open: true, tab });
  const closeAuth = () => setAuthModal({ open: false, tab: 'login' });

  const handleLoginSuccess = (studentData) => {
    if (onStudentLogin) onStudentLogin(studentData);
    if (window.location.pathname === '/request') onNavigate('/request');
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  return (
    <div className="font-body-md text-on-surface bg-surface min-h-screen flex flex-col">
      <StudentNavbar student={student} onLogout={handleLogout} onNavigate={onNavigate} onOpenAuth={openAuth} currentPath={currentPath} />

      <main className="flex-grow">
        <StudentHeroSection onNavigate={onNavigate} onOpenAuth={openAuth} student={student} />

        <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-20">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="font-headline-md text-xl sm:text-2xl md:text-3xl text-on-background mb-3 sm:mb-4">What Documents Can You Request?</h2>
            <p className="text-body-sm sm:text-body-md text-on-surface-variant max-w-xl mx-auto">Select from the following academic credentials offered by TLGC.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <StudentFeatureCard icon="description" title="Certificate of Enrollment & Good Moral" description="Proof of current enrollment and certificate of good moral character for administrative or personal purposes." />
            <StudentFeatureCard icon="badge" title="Certificate of Registration & Grades" description="Official registration record and detailed grade certification per semester." />
            <StudentFeatureCard icon="history_edu" title="Transcript of Records" description="Complete academic history and permanent record of all subjects taken and grades earned." />
          </div>
        </section>

        <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-24 bg-surface-container-low rounded-3xl mx-4 md:mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="font-headline-md text-xl sm:text-2xl md:text-3xl text-on-background mb-3 sm:mb-4">How It Works</h2>
            <p className="text-body-sm sm:text-body-md text-on-surface-variant max-w-xl mx-auto">From submission to release — the full request lifecycle.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="group relative p-6 sm:p-10 bg-surface-container-lowest border border-outline-variant rounded-2xl hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <div className="mb-5 sm:mb-8 w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary transition-all duration-500">
                <span className="material-symbols-outlined text-xl sm:text-3xl">edit_document</span>
              </div>
              <div className="absolute top-6 sm:top-10 right-6 sm:right-10 text-surface-container-high font-bold text-3xl sm:text-5xl opacity-30 group-hover:opacity-100 transition-opacity">01</div>
              <h3 className="font-headline-sm text-lg sm:text-xl text-on-background mb-2 sm:mb-4">1. Submit Request</h3>
              <p className="text-body-sm sm:text-body-md text-on-surface-variant leading-relaxed">Select your documents (COE, CGM, COR, Grades, or TOR), choose payment method and release type, then submit.</p>
            </div>
            <div className="group relative p-6 sm:p-10 bg-surface-container-lowest border border-outline-variant rounded-2xl hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <div className="mb-5 sm:mb-8 w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary transition-all duration-500">
                <span className="material-symbols-outlined text-xl sm:text-3xl">payments</span>
              </div>
              <div className="absolute top-6 sm:top-10 right-6 sm:right-10 text-surface-container-high font-bold text-3xl sm:text-5xl opacity-30 group-hover:opacity-100 transition-opacity">02</div>
              <h3 className="font-headline-sm text-lg sm:text-xl text-on-background mb-2 sm:mb-4">2. Pay Fee</h3>
               <p className="text-body-sm sm:text-body-md text-on-surface-variant leading-relaxed">Pay via GCash / Maya online or select cash payment for on-campus pickup. Your request is queued after verification.</p>
            </div>
            <div className="group relative p-6 sm:p-10 bg-surface-container-lowest border border-outline-variant rounded-2xl hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <div className="mb-5 sm:mb-8 w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary transition-all duration-500">
                <span className="material-symbols-outlined text-xl sm:text-3xl">task_alt</span>
              </div>
              <div className="absolute top-6 sm:top-10 right-6 sm:right-10 text-surface-container-high font-bold text-3xl sm:text-5xl opacity-30 group-hover:opacity-100 transition-opacity">03</div>
              <h3 className="font-headline-sm text-lg sm:text-xl text-on-background mb-2 sm:mb-4">3. Track & Release</h3>
              <p className="text-body-sm sm:text-body-md text-on-surface-variant leading-relaxed">Monitor your request status — Pending → Processing → Ready for Release → Claimed.</p>
            </div>
          </div>
        </section>

        <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pb-12 md:pb-20 pt-8 md:pt-16">
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 sm:gap-6 h-auto md:h-[500px]">
            <div className="md:col-span-2 md:row-span-2 bg-primary-container p-6 sm:p-8 md:p-12 rounded-3xl text-on-primary flex flex-col justify-between overflow-hidden relative group hover:shadow-2xl transition-all">
              <div className="relative z-10">
                <h4 className="font-headline-md text-xl sm:text-2xl md:text-3xl mb-3 sm:mb-6">Pick up at Registrar</h4>
                <p className="font-body-md sm:font-body-lg opacity-90 max-w-xs">Pick up your printed documents at the registrar's office.</p>
              </div>
              <div className="relative z-10 mt-4 sm:mt-8">
                <div className="flex items-center gap-3">
                  <span className="text-4xl sm:text-5xl md:text-6xl font-bold leading-none">5</span>
                  <p className="text-label-md font-bold uppercase tracking-widest">Document Types</p>
                </div>
                <p className="text-label-sm opacity-80 mt-1">COE, CGM, COR, Grades & TOR</p>
              </div>
              <div className="absolute -right-16 -bottom-16 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                <span className="material-symbols-outlined text-[180px] sm:text-[320px]" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
              </div>
            </div>
            <div className="md:col-span-2 bg-surface-container p-5 sm:p-6 md:p-10 rounded-3xl flex items-center gap-4 sm:gap-8 hover:bg-surface-container-high transition-colors">
              <div className="bg-primary/10 p-3 sm:p-5 rounded-2xl">
                <span className="material-symbols-outlined text-primary text-2xl sm:text-4xl">payments</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2">Pay Online or On-Site</h4>
                <p className="text-body-sm sm:text-body-md text-on-surface-variant">Scan the school's GCash / Maya QR code to pay online, or pay in cash when you pick up your documents at the cashier.</p>
              </div>
            </div>
            <div className="bg-secondary-container p-5 sm:p-10 rounded-3xl flex flex-col justify-center text-center hover:scale-[1.02] transition-transform">
              <span className="text-3xl sm:text-5xl font-bold text-on-secondary-container mb-1 sm:mb-2">Real-Time</span>
              <p className="text-label-md font-bold text-on-secondary-container uppercase tracking-widest">Status Tracking</p>
            </div>
            <div className="bg-tertiary-fixed p-5 sm:p-10 rounded-3xl flex flex-col justify-center text-center hover:scale-[1.02] transition-transform">
              <span className="text-3xl sm:text-5xl font-bold text-on-tertiary-fixed-variant mb-1 sm:mb-2">Pickup</span>
              <p className="text-label-md font-bold text-on-tertiary-fixed-variant uppercase tracking-widest">or Digital Release</p>
            </div>
          </div>
        </section>
      </main>

      <StudentFooter student={student} onNavigate={onNavigate} onOpenAuth={openAuth} />

      <StudentAuthModal
        isOpen={authModal.open}
        defaultTab={authModal.tab}
        onClose={closeAuth}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

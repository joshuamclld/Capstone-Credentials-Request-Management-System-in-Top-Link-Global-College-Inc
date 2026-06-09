import React, { useState, useEffect } from 'react';
import StudentNavbar from './student/StudentNavbar';
import StudentHeroSection from './student/StudentHeroSection';
import StudentFeatureCard from './student/StudentFeatureCard';
import StudentFooter from './student/StudentFooter';
import StudentMobileNav from './student/StudentMobileNav';
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
            <h2 className="font-headline-md text-xl sm:text-2xl md:text-3xl text-on-background mb-3 sm:mb-4">Why Create an Account?</h2>
            <p className="text-body-sm sm:text-body-md text-on-surface-variant max-w-xl mx-auto">Secure, verified access to manage your credential requests.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <StudentFeatureCard icon="verified_user" title="Secure Student Access" description="Only verified students can manage credential requests." />
            <StudentFeatureCard icon="mail_lock" title="Email OTP Verification" description="Your email is verified to prevent impersonation." />
            <StudentFeatureCard icon="lock" title="Secure Request Management" description="Only account owners can cancel requests." />
          </div>
        </section>

        <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-24 bg-surface-container-low rounded-3xl mx-4 md:mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="font-headline-md text-xl sm:text-2xl md:text-3xl text-on-background mb-3 sm:mb-4">Streamlined Fulfillment</h2>
            <p className="text-body-sm sm:text-body-md text-on-surface-variant max-w-xl mx-auto">Our automated workflow ensures your academic credentials reach you through a secure three-step process.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="group relative p-6 sm:p-10 bg-surface-container-lowest border border-outline-variant rounded-2xl hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <div className="mb-5 sm:mb-8 w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary transition-all duration-500">
                <span className="material-symbols-outlined text-xl sm:text-3xl">edit_document</span>
              </div>
              <div className="absolute top-6 sm:top-10 right-6 sm:right-10 text-surface-container-high font-bold text-3xl sm:text-5xl opacity-30 group-hover:opacity-100 transition-opacity">01</div>
              <h3 className="font-headline-sm text-lg sm:text-xl text-on-background mb-2 sm:mb-4">1. Fill out Request</h3>
              <p className="text-body-sm sm:text-body-md text-on-surface-variant leading-relaxed">Complete the digital application form with your specific document requirements and personal details.</p>
            </div>
            <div className="group relative p-6 sm:p-10 bg-surface-container-lowest border border-outline-variant rounded-2xl hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <div className="mb-5 sm:mb-8 w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary transition-all duration-500">
                <span className="material-symbols-outlined text-xl sm:text-3xl">payments</span>
              </div>
              <div className="absolute top-6 sm:top-10 right-6 sm:right-10 text-surface-container-high font-bold text-3xl sm:text-5xl opacity-30 group-hover:opacity-100 transition-opacity">02</div>
              <h3 className="font-headline-sm text-lg sm:text-xl text-on-background mb-2 sm:mb-4">2. Pay Processing Fee</h3>
              <p className="text-body-sm sm:text-body-md text-on-surface-variant leading-relaxed">Securely settle document processing fees via our integrated payment gateway to initiate your request.</p>
            </div>
            <div className="group relative p-6 sm:p-10 bg-surface-container-lowest border border-outline-variant rounded-2xl hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <div className="mb-5 sm:mb-8 w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary transition-all duration-500">
                <span className="material-symbols-outlined text-xl sm:text-3xl">analytics</span>
              </div>
              <div className="absolute top-6 sm:top-10 right-6 sm:right-10 text-surface-container-high font-bold text-3xl sm:text-5xl opacity-30 group-hover:opacity-100 transition-opacity">03</div>
              <h3 className="font-headline-sm text-lg sm:text-xl text-on-background mb-2 sm:mb-4">3. Track Approval</h3>
              <p className="text-body-sm sm:text-body-md text-on-surface-variant leading-relaxed">Monitor your request's progress in real-time through your personalized student dashboard until completion.</p>
            </div>
          </div>
        </section>

        <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pb-12 md:pb-20 pt-8 md:pt-16">
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 sm:gap-6 h-auto md:h-[500px]">
            <div className="md:col-span-2 md:row-span-2 bg-primary-container p-6 sm:p-8 md:p-12 rounded-3xl text-on-primary flex flex-col justify-between overflow-hidden relative group hover:shadow-2xl transition-all">
              <div className="relative z-10">
                <h4 className="font-headline-md text-xl sm:text-2xl md:text-3xl mb-3 sm:mb-6">Fast Processing</h4>
                <p className="font-body-md sm:font-body-lg opacity-90 max-w-xs">Most requests are reviewed and processed within 3-5 business days from payment verification.</p>
              </div>
              <div className="relative z-10 mt-4 sm:mt-8 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl md:text-6xl font-bold">98%</span>
                <div className="flex flex-col">
                  <p className="text-label-md font-bold uppercase tracking-widest">Satisfaction</p>
                  <p className="text-label-sm opacity-80">Annual Student Rate</p>
                </div>
              </div>
              <div className="absolute -right-16 -bottom-16 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                <span className="material-symbols-outlined text-[180px] sm:text-[320px]" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
              </div>
            </div>
            <div className="md:col-span-2 bg-surface-container p-5 sm:p-6 md:p-10 rounded-3xl flex items-center gap-4 sm:gap-8 hover:bg-surface-container-high transition-colors">
              <div className="bg-primary/10 p-3 sm:p-5 rounded-2xl">
                <span className="material-symbols-outlined text-primary text-2xl sm:text-4xl">security</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2">Encrypted Data</h4>
                <p className="text-body-sm sm:text-body-md text-on-surface-variant">Your records are protected with industry-standard TLS 1.3 encryption and SOC2 compliant protocols.</p>
              </div>
            </div>
            <div className="bg-secondary-container p-5 sm:p-10 rounded-3xl flex flex-col justify-center text-center hover:scale-[1.02] transition-transform">
              <span className="text-3xl sm:text-5xl font-bold text-on-secondary-container mb-1 sm:mb-2">24/7</span>
              <p className="text-label-md font-bold text-on-secondary-container uppercase tracking-widest">Global Access</p>
            </div>
            <div className="bg-tertiary-fixed p-5 sm:p-10 rounded-3xl flex flex-col justify-center text-center hover:scale-[1.02] transition-transform">
              <span className="text-3xl sm:text-5xl font-bold text-on-tertiary-fixed-variant mb-1 sm:mb-2">HD</span>
              <p className="text-label-md font-bold text-on-tertiary-fixed-variant uppercase tracking-widest">Digital Copy</p>
            </div>
          </div>
        </section>
      </main>

      <StudentFooter student={student} onNavigate={onNavigate} onOpenAuth={openAuth} />

      <StudentMobileNav active={currentPath} student={student} onNavigate={onNavigate} onOpenAuth={openAuth} onLogout={handleLogout} />

      <StudentAuthModal
        isOpen={authModal.open}
        defaultTab={authModal.tab}
        onClose={closeAuth}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

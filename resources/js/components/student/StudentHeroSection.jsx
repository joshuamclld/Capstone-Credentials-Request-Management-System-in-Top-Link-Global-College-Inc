import React from 'react';
import { CheckCircle } from 'lucide-react';

const benefits = [
  'Request COE, CGM, COR, Grades & TOR online',
  'Pay online via PayMongo or cash on pickup',
  'Real-time tracking from submission to release',
];

export default function StudentHeroSection({ onNavigate, onOpenAuth, student }) {
  return (
    <section className="relative overflow-hidden bg-surface-container-low max-md:py-6 md:py-28">
      <div className="relative z-10 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col lg:flex-row items-center gap-8 md:gap-16">
        {/* Left */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant mb-4 sm:mb-8 border border-primary-container/20 animate-fade-in-up">
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">verified</span>
            <span className="font-label-md text-label-md">Official Student Credentials Request</span>
          </div>

          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-5xl text-on-background mb-4 sm:mb-6 leading-[1.1]">
            Request Credentials Online
          </h1>

          <p className="font-body-md sm:font-body-lg text-body-md sm:text-body-lg text-on-surface-variant mb-6 sm:mb-10 max-w-xl">
            Submit requests for Certificate of Enrollment, Good Moral, Registration, Grades, or Transcript of Records. Pay online or on pickup, and track your request from submission to release.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
            {student ? (
              <button
                onClick={(e) => { e.preventDefault(); onNavigate('/request'); }}
                className="bg-primary text-on-primary font-label-md text-label-md px-6 sm:px-10 py-3 sm:py-5 rounded-xl flex items-center justify-center gap-2 sm:gap-3 hover:opacity-90 hover:scale-[1.02] transition-all shadow-lg shadow-primary/20 cursor-pointer"
              >
                Request Documents
                <span className="material-symbols-outlined text-lg sm:text-2xl">edit_document</span>
              </button>
            ) : (
              <button
                onClick={(e) => { e.preventDefault(); onOpenAuth('register'); }}
                className="bg-primary text-on-primary font-label-md text-label-md px-6 sm:px-10 py-3 sm:py-5 rounded-xl flex items-center justify-center gap-2 sm:gap-3 hover:opacity-90 hover:scale-[1.02] transition-all shadow-lg shadow-primary/20 cursor-pointer"
              >
                Create Student Account
                <span className="material-symbols-outlined text-lg sm:text-2xl">arrow_forward</span>
              </button>
            )}
            {!student && (
              <button
                onClick={(e) => { e.preventDefault(); onOpenAuth('login'); }}
                className="border-2 border-primary/20 text-primary font-label-md text-label-md px-6 sm:px-10 py-3 sm:py-5 rounded-xl flex items-center justify-center gap-2 sm:gap-3 hover:bg-primary/5 transition-all cursor-pointer"
              >
                Sign In
                <span className="material-symbols-outlined text-lg sm:text-2xl">login</span>
              </button>
            )}
            <button
              onClick={(e) => { e.preventDefault(); onNavigate('/track'); }}
              className="border-2 border-outline-variant text-on-surface-variant font-label-md text-label-md px-6 sm:px-10 py-3 sm:py-5 rounded-xl flex items-center justify-center gap-2 sm:gap-3 hover:bg-surface-container-high transition-all cursor-pointer"
            >
              Track Request
              <span className="material-symbols-outlined text-lg sm:text-2xl">search</span>
            </button>
          </div>
        </div>

        {/* Right */}
        <div className="flex-1 w-full max-w-md">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 sm:p-8 shadow-sm">
            <h3 className="text-headline-sm font-bold text-on-surface mb-4 sm:mb-6 text-center lg:text-left">Why Register?</h3>
            <div className="space-y-3 sm:space-y-5">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 sm:gap-4">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <span className="text-body-sm sm:text-body-md text-on-surface font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-0 top-0 w-1/3 h-full opacity-5 pointer-events-none">
        <div className="w-full h-full bg-primary rounded-full blur-[150px] -ml-32 -mt-32"></div>
      </div>
      <div className="absolute right-0 bottom-0 w-1/4 h-full opacity-5 pointer-events-none">
        <div className="w-full h-full bg-secondary rounded-full blur-[120px] -mr-32 -mb-32"></div>
      </div>
    </section>
  );
}

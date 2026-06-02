import React, { useState, useEffect } from 'react';

const GRADE_YEARS = ['1st Year', '2nd Year', '3rd Year'];
const GRADE_SEMESTERS = ['1st Semester', '2nd Semester'];

const DOCUMENT_META = {
  enrollment: { icon: 'badge', color: 'primary', daysLabel: 'Same Day' },
  'good-moral': { icon: 'verified', color: 'secondary', daysLabel: 'Same Day' },
  registration: { icon: 'assignment', color: 'tertiary', daysLabel: 'Same Day' },
  grades: { icon: 'school', color: 'on-surface-variant', tag: 'Per Semester', daysLabel: 'Every Friday' },
  tor: { icon: 'history_edu', color: 'primary', tag: 'Most Requested', daysLabel: '7 Working Days' },
};

export default function StudentRequestForm({ onNavigate }) {
  const [step, setStep] = useState(1);
  
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    studentId: '',
    contactNo: '',
    email: '',
    course: ''
  });

  const [selectedDoc, setSelectedDoc] = useState('');
  const [selectedSemesters, setSelectedSemesters] = useState([]);
  const [purpose, setPurpose] = useState('');

  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);

  useEffect(() => {
    fetch('/documents', { headers: { 'Accept': 'application/json' } })
      .then(res => res.json())
      .then(data => {
        setDocuments(data);
        setDocsLoading(false);
      })
      .catch(() => setDocsLoading(false));
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [generatedRef, setGeneratedRef] = useState('');
  const [stepError, setStepError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const getCsrfToken = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const resetForm = () => {
    setStep(1);
    setPersonalInfo({ fullName: '', studentId: '', contactNo: '', email: '', course: '' });
    setSelectedDoc('');
    setSelectedSemesters([]);
    setPurpose('');
    setSubmitError('');
  };

  // Calculations
  const selectedDocument = documents.find(d => d.code === selectedDoc);
  const totalPrice = (() => {
    if (!selectedDocument) return 0;
    if (selectedDocument.is_per_semester) return Number(selectedDocument.price) * selectedSemesters.length;
    return Number(selectedDocument.price);
  })();

  const handlePersonalChange = (e) => {
    setPersonalInfo({
      ...personalInfo,
      [e.target.name]: e.target.value
    });
  };

  const selectDocument = (code) => {
    setSelectedDoc(code);
    if (code !== 'grades') setSelectedSemesters([]);
  };

  const toggleSemester = (combo) => {
    if (selectedSemesters.includes(combo)) {
      setSelectedSemesters(selectedSemesters.filter(s => s !== combo));
    } else {
      setSelectedSemesters([...selectedSemesters, combo]);
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setStepError('');
    if (step === 2) {
      if (!selectedDoc) {
        setStepError('Please select a document.');
        return;
      }
      if (selectedDoc === 'grades' && selectedSemesters.length === 0) {
        setStepError('Please select at least one year-semester combination for Certificate of Grades.');
        return;
      }
    }
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBackStep = (e) => {
    e.preventDefault();
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({
          fullName: personalInfo.fullName,
          studentId: personalInfo.studentId,
          contactNo: personalInfo.contactNo,
          email: personalInfo.email,
          course: personalInfo.course,
          selectedDoc: selectedDoc,
          selectedSemesters: selectedSemesters,
          purpose: purpose,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const messages = Object.values(data.errors).flat().join(' ');
          setSubmitError(messages);
        } else {
          setSubmitError(data.message || 'Submission failed. Please try again.');
        }
        setIsSubmitting(false);
        return;
      }

      setGeneratedRef(data.tracking_number);
      setIsSubmitting(false);
      setSubmitSuccess(true);
    } catch (err) {
      setSubmitError('Network error. Please check your connection and try again.');
      setIsSubmitting(false);
    }
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
            className="text-primary font-bold font-label-md text-label-md hover:bg-primary/10 transition-all px-5 py-2.5 rounded-full" 
            href="/request"
            onClick={(e) => e.preventDefault()}
          >
            Request
          </a>
          <a 
            className="text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high transition-all px-5 py-2.5 rounded-full" 
            href="/track"
            onClick={(e) => { e.preventDefault(); onNavigate('/track'); }}
          >
            Track
          </a>
        </nav>
      </header>

      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 animate-card">
        {submitSuccess ? (
          /* Submission Success State */
          <div className="max-w-xl mx-auto text-center py-16 px-6 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="material-symbols-outlined text-5xl">check_circle</span>
            </div>
            <h2 className="font-headline-md text-3xl text-primary mb-4">Request Submitted Successfully!</h2>
            <p className="text-body-lg text-on-surface-variant mb-6">
              Thank you! Your document request has been received. Please use your reference number below to track the live progress.
            </p>
            <div className="bg-surface-container p-6 rounded-xl border border-outline-variant mb-8 inline-block">
              <p className="text-label-sm text-on-surface-variant uppercase tracking-widest mb-1">Reference Number</p>
              <p className="text-2xl font-bold text-primary tracking-wider">{generatedRef}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={(e) => { e.preventDefault(); onNavigate('/track'); }}
                className="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold hover:opacity-95 transition-all cursor-pointer"
              >
                Track Status Page
              </button>
              <button 
                onClick={(e) => { e.preventDefault(); setSubmitSuccess(false); resetForm(); }}
                className="border-2 border-primary/20 text-primary px-8 py-4 rounded-xl font-bold hover:bg-primary/5 transition-all cursor-pointer"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : (
          /* Multi-step Form State */
          <div className="w-full max-w-4xl mx-auto">
            {/* Multi-step Progress Bar */}
            <div className="mb-10 w-full max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-4 relative">
                {/* Progress Lines */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-container-high -translate-y-1/2 z-0"></div>
                <div 
                  className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500 ease-in-out"
                  style={{ width: `${(step - 1) * 50}%` }}
                ></div>
                
                {/* Step 1: Personal */}
                <div className="z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shadow-sm transition-all duration-300 ${
                    step >= 1 ? 'bg-primary text-on-primary ring-4 ring-primary-container/20' : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <span className={`font-label-md text-label-md mt-2 ${step >= 1 ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>Personal</span>
                </div>

                {/* Step 2: Documents */}
                <div className="z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shadow-sm transition-all duration-300 ${
                    step >= 2 ? 'bg-primary text-on-primary ring-4 ring-primary-container/20' : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    <span className="material-symbols-outlined">description</span>
                  </div>
                  <span className={`font-label-md text-label-md mt-2 ${step >= 2 ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>Documents</span>
                </div>

                {/* Step 3: Pickup */}
                <div className="z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shadow-sm transition-all duration-300 ${
                    step >= 3 ? 'bg-primary text-on-primary ring-4 ring-primary-container/20' : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    <span className="material-symbols-outlined">store</span>
                  </div>
                  <span className={`font-label-md text-label-md mt-2 ${step >= 3 ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>Pickup &amp; Pay</span>
                </div>
              </div>
            </div>

            {/* Form Canvas */}
            <form onSubmit={step === 3 ? handleSubmit : handleNextStep}>
              <section className="bg-surface-container-lowest rounded-lg border border-outline-variant p-6 md:p-10 mb-8 shadow-sm">
                
                {/* STEP 1: Personal Info */}
                {step === 1 && (
                  <div className="animate-fade-in-up">
                    <header className="mb-8">
                      <h2 className="font-headline-md text-headline-md text-primary mb-2">Personal Information</h2>
                      <p className="font-body-md text-body-md text-on-surface-variant">Provide your registry details to identify your academic records.</p>
                    </header>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface-variant mb-2">Full Name (Last, First, Middle Name)</label>
                        <input 
                          required
                          type="text" 
                          name="fullName"
                          value={personalInfo.fullName}
                          onChange={handlePersonalChange}
                          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          placeholder="e.g. Dela Cruz, Juan" 
                        />
                      </div>
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface-variant mb-2">Student ID Number</label>
                        <input 
                          required
                          type="text" 
                          name="studentId"
                          value={personalInfo.studentId}
                          onChange={handlePersonalChange}
                          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          placeholder="e.g. TLGC-2022-0941" 
                        />
                      </div>
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface-variant mb-2">Contact Number</label>
                        <input 
                          required
                          type="tel" 
                          name="contactNo"
                          value={personalInfo.contactNo}
                          onChange={handlePersonalChange}
                          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          placeholder="e.g. +63 917 123 4567" 
                        />
                      </div>
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface-variant mb-2">Email Address</label>
                        <input 
                          required
                          type="email" 
                          name="email"
                          value={personalInfo.email}
                          onChange={handlePersonalChange}
                          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          placeholder="e.g. juan.delacruz@example.com" 
                        />
                      </div>
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface-variant mb-2">Course / Program</label>
                        <input 
                          required
                          type="text" 
                          name="course"
                          value={personalInfo.course}
                          onChange={handlePersonalChange}
                          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          placeholder="e.g. BS in Information Technology" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Document Selection */}
                {step === 2 && (
                  <div className="animate-fade-in-up">
                    <header className="mb-8">
                      <h2 className="font-headline-md text-headline-md text-primary mb-2">Document Selection</h2>
                      <p className="font-body-md text-body-md text-on-surface-variant">Choose the official credentials you wish to request from the Registrar's Office.</p>
                    </header>

                    {docsLoading ? (
                      <div className="text-center py-12 text-on-surface-variant">
                        <span className="material-symbols-outlined animate-spin text-4xl block mx-auto mb-4">sync</span>
                        Loading documents...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {documents.map((doc) => {
                          const meta = DOCUMENT_META[doc.code] || {};
                          const isChecked = selectedDoc === doc.code;
                          return (
                            <div 
                              key={doc.code}
                              onClick={() => selectDocument(doc.code)}
                              className={`relative flex flex-col p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-md active:scale-95 group ${
                                isChecked ? 'border-primary bg-surface-container-low shadow-sm' : 'border-outline-variant bg-surface-container-lowest'
                              }`}
                            >
                              <div className={`absolute top-6 right-6 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                isChecked ? 'border-primary' : 'border-outline'
                              }`}>
                                {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>}
                              </div>
                              <div className="flex items-center gap-3 mb-3">
                                <span className={`material-symbols-outlined p-2 rounded-lg transition-transform duration-300 group-hover:rotate-6 ${
                                  isChecked ? 'bg-primary-fixed text-primary' : 'bg-surface-container text-on-surface-variant'
                                }`}>
                                  {meta.icon || 'description'}
                                </span>
                                {meta.tag && (
                                  <span className="font-label-sm text-label-sm text-on-primary-fixed-variant bg-primary-fixed px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    {meta.tag}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">{doc.name}</h3>
                              {doc.description && (
                                <p className="font-body-sm text-body-sm text-on-surface-variant flex-grow">{doc.description}</p>
                              )}
                              <div className="mt-4 pt-4 border-t border-outline-variant flex justify-between items-center">
                                <span className="font-body-md text-body-md font-bold text-primary">₱ {Number(doc.price).toFixed(2)}</span>
                                <span className="font-label-sm text-label-sm text-on-surface-variant">{meta.daysLabel || `${doc.processing_days} Working Day(s)`}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Semester Selection — year + semester combos for Certificate of Grades */}
                    {selectedDoc === 'grades' && (
                      <div className="mt-8">
                        <label className="block font-label-md text-label-md text-on-surface-variant mb-4">
                          Semester/s Needed <span className="font-normal">(₱50 per year-semester combination)</span>
                        </label>
                        <div className="space-y-4">
                          {GRADE_YEARS.map(year => (
                            <div key={year} className="border border-outline-variant rounded-xl p-4 bg-surface-container-lowest">
                              <p className="font-label-md text-label-md font-bold text-on-surface mb-3">{year}</p>
                              <div className="flex flex-wrap gap-3">
                                {GRADE_SEMESTERS.map(sem => {
                                  const combo = `${year} - ${sem}`;
                                  const isSelected = selectedSemesters.includes(combo);
                                  return (
                                    <button
                                      key={combo}
                                      type="button"
                                      onClick={() => toggleSemester(combo)}
                                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 font-bold text-label-md transition-all duration-200 cursor-pointer ${
                                        isSelected
                                          ? 'border-primary bg-primary-fixed text-primary'
                                          : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary/50'
                                      }`}
                                    >
                                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                        isSelected ? 'border-primary bg-primary' : 'border-outline'
                                      }`}>
                                        {isSelected && <span className="material-symbols-outlined text-[14px] text-white" style={{fontSize:'14px'}}>check</span>}
                                      </span>
                                      {sem}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                        {selectedSemesters.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {selectedSemesters.map(combo => (
                              <span key={combo} className="bg-primary-fixed text-primary font-label-sm text-label-sm px-3 py-1.5 rounded-full border border-primary/20">
                                {combo}
                              </span>
                            ))}
                          </div>
                        )}
                        {selectedSemesters.length > 0 && (
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-3">
                            {selectedSemesters.length} combination(s) × ₱{Number(selectedDocument?.price || 50).toFixed(2)} = <span className="font-bold text-primary">₱{(Number(selectedDocument?.price || 50) * selectedSemesters.length).toFixed(2)}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Step Error */}
                    {stepError && (
                      <div className="mt-4 p-4 rounded-lg bg-error/10 border border-error/30">
                        <p className="font-body-sm text-body-sm text-error">{stepError}</p>
                      </div>
                    )}

                    {/* Purpose Field */}
                    <div className="mt-8">
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-2">Purpose of Request</label>
                      <textarea 
                        required
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
                        placeholder="e.g., Employment, Graduate School Application, Board Exam..." 
                        rows="3"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 3: Pickup Method & Review */}
                {step === 3 && (
                  <div className="animate-fade-in-up">
                    <header className="mb-8">
                      <h2 className="font-headline-md text-headline-md text-primary mb-2">Pickup &amp; Payment Options</h2>
                      <p className="font-body-md text-body-md text-on-surface-variant">Review your request details and pickup method before submitting.</p>
                    </header>

                    <div className="max-w-lg mx-auto mb-8">
                      <div className="p-6 rounded-lg border-2 border-primary bg-surface-container-low">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="material-symbols-outlined p-2 rounded-lg bg-primary-fixed text-primary">
                            store
                          </span>
                          <span className="font-headline-sm text-lg font-bold">Claim at Registrar Office</span>
                        </div>
                        <p className="text-body-sm text-on-surface-variant">
                          Visit TLGC campus to claim your requested document at the Registrar Office.
                        </p>
                      </div>
                    </div>

                    {/* Summary Review */}
                    <div className="border border-outline-variant rounded-xl p-6 bg-surface-container-low">
                      <h3 className="font-headline-sm text-lg text-on-surface mb-4">Request Summary</h3>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between border-b border-outline-variant pb-2">
                          <span className="text-on-surface-variant font-medium">Student Name:</span>
                          <span className="font-bold text-on-surface">{personalInfo.fullName}</span>
                        </div>
                        <div className="flex justify-between border-b border-outline-variant pb-2">
                          <span className="text-on-surface-variant font-medium">Student ID:</span>
                          <span className="font-bold text-on-surface">{personalInfo.studentId}</span>
                        </div>
                        <div className="flex justify-between border-b border-outline-variant pb-2">
                          <span className="text-on-surface-variant font-medium">Selected Document:</span>
                          <span className="font-bold text-on-surface text-right">
                            {selectedDocument?.name || ''}
                          </span>
                        </div>
                        {selectedDoc === 'grades' && selectedSemesters.length > 0 && (
                          <div className="flex justify-between border-b border-outline-variant pb-2">
                            <span className="text-on-surface-variant font-medium">Semester/s:</span>
                            <span className="font-bold text-on-surface text-right">
                              {selectedSemesters.join(', ')}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between pb-2">
                          <span className="text-on-surface-variant font-medium">Pickup Method:</span>
                          <span className="font-bold text-on-surface">Registrar Office Claim</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t-2 border-primary/20">
                        <span className="text-headline-sm text-xl font-bold text-on-surface">Total Processing Fee:</span>
                        <span className="text-2xl font-bold text-primary">₱ {totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Submit Error */}
              {submitError && (
                <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/30">
                  <p className="font-body-sm text-body-sm text-error">{submitError}</p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between gap-6">
                {step > 1 ? (
                  <button 
                    type="button"
                    onClick={handleBackStep}
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-5 rounded-xl bg-surface-container-high text-primary font-bold hover:bg-surface-container-highest transition-all duration-300 active:scale-95 group cursor-pointer"
                  >
                    <span className="material-symbols-outlined transition-transform duration-300 group-hover:-translate-x-1">arrow_back</span>
                    Back
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); onNavigate('/'); }}
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-5 rounded-xl bg-surface-container-high text-primary font-bold hover:bg-surface-container-highest transition-all duration-300 active:scale-95 group cursor-pointer"
                  >
                    Cancel
                  </button>
                )}

                {step < 3 ? (
                  <button 
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-5 rounded-xl bg-primary text-on-primary font-bold hover:opacity-90 shadow-lg transition-all duration-300 active:scale-95 group cursor-pointer"
                  >
                    Next Step
                    <span className="material-symbols-outlined transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
                  </button>
                ) : (
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-5 rounded-xl bg-primary text-on-primary font-bold hover:opacity-90 shadow-lg transition-all duration-300 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">sync</span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit &amp; Pay
                        <span className="material-symbols-outlined">send</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
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
                <a className="text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="/request" onClick={(e) => e.preventDefault()}>Request Form</a>
                <a className="text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="/track" onClick={(e) => { e.preventDefault(); onNavigate('/track'); }}>Track Status</a>
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
          onClick={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center text-primary bg-primary-fixed rounded-full px-5 py-1.5 active:scale-95 transition-transform cursor-pointer"
        >
          <span className="material-symbols-outlined">add_circle</span>
          <span className="font-label-sm text-[10px] font-bold">REQUEST</span>
        </button>
        <button 
          onClick={(e) => { e.preventDefault(); onNavigate('/track'); }}
          className="flex flex-col items-center justify-center text-on-surface-variant px-5 py-1.5 active:scale-95 transition-transform cursor-pointer"
        >
          <span className="material-symbols-outlined">analytics</span>
          <span className="font-label-sm text-[10px] font-bold">TRACK</span>
        </button>
      </nav>
    </div>
  );
}

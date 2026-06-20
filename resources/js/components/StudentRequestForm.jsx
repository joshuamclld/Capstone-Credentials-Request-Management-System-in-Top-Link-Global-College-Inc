import React, { useState, useEffect } from 'react';
import FormSelect from './ui/FormSelect';
import StudentDashboardLayout from './student/StudentDashboardLayout';
import ProtectedImage from './ui/ProtectedImage';

const GRADE_YEARS = ['1st Year', '2nd Year', '3rd Year'];
const GRADE_SEMESTERS = ['1st Semester', '2nd Semester'];
const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const SECTION_OPTIONS = SECTIONS.map(s => ({ value: s, label: `Section ${s}` }));

const DOCUMENT_META = {
  enrollment: { icon: 'badge', color: 'primary', daysLabel: 'Same Day' },
  'good-moral': { icon: 'verified', color: 'secondary', daysLabel: 'Same Day' },
  registration: { icon: 'assignment', color: 'tertiary', daysLabel: 'Same Day' },
  grades: { icon: 'school', color: 'on-surface-variant', tag: 'Per Semester', daysLabel: 'Every Friday' },
  tor: { icon: 'history_edu', color: 'primary', daysLabel: '7 Working Days' },
};

const cardBgColors = {
  enrollment: 'bg-emerald-50',
  'good-moral': 'bg-cyan-50',
  registration: 'bg-amber-50',
  grades: 'bg-violet-50',
  tor: 'bg-blue-50',
};

const fallbackBgColors = ['bg-rose-50', 'bg-pink-50', 'bg-orange-50', 'bg-lime-50', 'bg-teal-50', 'bg-indigo-50', 'bg-fuchsia-50', 'bg-yellow-50'];

export default function StudentRequestForm({ onNavigate, student, onLogout, currentPath }) {
  const [step, setStep] = useState(1);

  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    studentId: '',
    contactNo: '',
    email: '',
    course: '',
    yearLevel: '',
    section: ''
  });

  const [selectedDocs, setSelectedDocs] = useState([]);
  const [selectedSemesters, setSelectedSemesters] = useState([]);
  const [pages, setPages] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentQrUrl, setPaymentQrUrl] = useState(null);
  const [deliveryType, setDeliveryType] = useState('pickup');
  const [purpose, setPurpose] = useState('');

  const [confirmations, setConfirmations] = useState({
    infoCorrect: false,
    understandDelay: false,
    agreeRules: false,
  });

  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const isAuthenticated = Boolean(student);
  const isProfileComplete = !isAuthenticated || (
    student?.date_of_birth &&
    student?.gender &&
    student?.emergency_contact_person &&
    student?.emergency_contact_number &&
    student?.complete_address
  );

  useEffect(() => {
    if (student) {
      setPersonalInfo(prev => ({
        ...prev,
        fullName: `${student.last_name}, ${student.first_name}`,
        studentId: student.student_number,
        email: student.email,
      }));
    }
  }, [student]);

  useEffect(() => {
    fetch('/documents', { headers: { 'Accept': 'application/json' } })
      .then(res => res.json())
      .then(data => {
        setDocuments(Array.isArray(data) ? data : data.documents);
        setDocsLoading(false);
      })
      .catch(() => setDocsLoading(false));
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [generatedRef, setGeneratedRef] = useState('');
  const [stepError, setStepError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(true);

  useEffect(() => {
    fetch('/online-payment-status')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setOnlinePaymentEnabled(data.enabled);
          if (!data.enabled && paymentMethod === 'online') setPaymentMethod('');
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (paymentMethod === 'online') {
      fetch('/admin/payment-qr')
        .then(res => res.json())
        .then(data => { if (data.success) setPaymentQrUrl(data.qr_url); })
        .catch(() => { });
    } else {
      setPaymentQrUrl(null);
    }
  }, [paymentMethod]);


  const getCsrfToken = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const resetForm = () => {
    setStep(1);
    setPersonalInfo(student ? {
      fullName: `${student.last_name}, ${student.first_name}`,
      studentId: student.student_number,
      contactNo: '',
      email: student.email,
      course: '',
      yearLevel: '',
      section: ''
    } : { fullName: '', studentId: '', contactNo: '', email: '', course: '', yearLevel: '', section: '' });
    setSelectedDocs([]);
    setSelectedSemesters([]);
    setPages(1);
    setPaymentMethod('');
    setDeliveryType('pickup');
    setPurpose('');
    setConfirmations({
      infoCorrect: false,
      understandDelay: false,
      agreeRules: false,
    });
    setSubmitError('');
  };

  const selectedDocObjects = documents.filter(d => selectedDocs.includes(d.code));

  const hasSemesterDoc = selectedDocObjects.some(d => d.is_per_semester);
  const hasPerPageDoc = selectedDocObjects.some(d => d.is_per_page);

  const gradesPrice = documents.find(d => d.code === 'grades')?.price ?? 50;
  const torPrice = documents.find(d => d.code === 'tor')?.price ?? 150;

  const allConfirmed = confirmations.infoCorrect && confirmations.understandDelay && confirmations.agreeRules;

  const totalPrice = (() => {
    if (selectedDocObjects.length === 0) return 0;
    return selectedDocObjects.reduce((sum, doc) => {
      if (doc.is_per_semester) return sum + Number(doc.price) * selectedSemesters.length;
      if (doc.is_per_page) return sum + Number(doc.price) * pages;
      return sum + Number(doc.price);
    }, 0);
  })();

  const lockedFields = ['fullName', 'studentId', 'email'];

  const handlePersonalChange = (e) => {
    if (isAuthenticated && lockedFields.includes(e.target.name)) return;
    setPersonalInfo({
      ...personalInfo,
      [e.target.name]: e.target.value
    });
  };

  const toggleDocument = (code) => {
    setSelectedDocs(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      }
      return [...prev, code];
    });
  };

  const toggleSemester = (combo) => {
    if (selectedSemesters.includes(combo)) {
      setSelectedSemesters(selectedSemesters.filter(s => s !== combo));
    } else {
      setSelectedSemesters([...selectedSemesters, combo]);
    }
  };

  const toggleConfirmation = (key) => {
    setConfirmations(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setStepError('');
    if (isAuthenticated && !isProfileComplete) {
      setStepError('Please complete your profile before proceeding.');
      return;
    }
    if (step === 2) {
      if (selectedDocs.length === 0) {
        setStepError('Please select at least one document.');
        return;
      }
      if (hasSemesterDoc && selectedSemesters.length === 0) {
        setStepError('Please select at least one year-semester combination for the selected document.');
        return;
      }
      if (hasPerPageDoc && (!pages || pages < 1)) {
        setStepError('Please specify the number of pages.');
        return;
      }
      if (!purpose.trim()) {
        setStepError('Please enter the purpose of your request.');
        return;
      }
    }
    if (step < 4) {
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
    if (isSubmitting) return;
    if (isAuthenticated && !isProfileComplete) {
      setSubmitError('Please complete your profile before submitting.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');

    if (!allConfirmed) {
      setSubmitError('Please verify and confirm all required statements before submitting.');
      setIsSubmitting(false);
      return;
    }

    if (!paymentMethod) {
      setSubmitError('Please select a payment method.');
      setIsSubmitting(false);
      return;
    }

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
          yearLevel: personalInfo.yearLevel,
          section: personalInfo.section,
          selectedDocs: selectedDocs,
          selectedSemesters: selectedSemesters,
          pages: hasPerPageDoc ? pages : null,
          paymentMethod: paymentMethod,
          deliveryType: 'pickup',
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
    <StudentDashboardLayout title="Request Documents" subtitle="Submit a new credential request." student={student} onLogout={onLogout} onNavigate={onNavigate} currentPath={currentPath}>
      <div className="max-w-container-max mx-auto">
        {submitSuccess ? (
          <div className="max-w-xl mx-auto text-center bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 sm:p-10 shadow-xl mt-8">
            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-8">
              <span className="material-symbols-outlined text-3xl sm:text-5xl">check_circle</span>
            </div>
            <h2 className="font-headline-md text-xl sm:text-3xl text-primary mb-2 sm:mb-4">Request Submitted Successfully!</h2>
            <p className="text-body-sm sm:text-body-lg text-on-surface-variant mb-4 sm:mb-6">
              Thank you! Your document request has been received. Please use your reference number below to track the live progress.
            </p>
            <div className="bg-surface-container p-4 sm:p-6 rounded-xl border border-outline-variant mb-6 sm:mb-8 inline-block">
              <p className="text-label-sm text-on-surface-variant uppercase tracking-widest mb-1">Reference Number</p>
              <p className="text-lg sm:text-2xl font-bold text-primary tracking-wider">{generatedRef}</p>
            </div>
            {paymentMethod === 'online' && paymentQrUrl && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs font-bold text-amber-800 mb-3">Scan to Pay via GCash / Maya</p>
                <div className="flex justify-center">
                  <ProtectedImage src={paymentQrUrl} alt="Payment QR" className="w-40 h-40 object-contain" />
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={(e) => { e.preventDefault(); onNavigate('/student/requests/' + generatedRef); }}
                className="bg-primary/10 text-primary px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:bg-primary/15 transition-all cursor-pointer"
              >
                View Request Details
              </button>
              <button
                onClick={(e) => { e.preventDefault(); setSubmitSuccess(false); resetForm(); }}
                className="border-2 border-primary/20 text-primary px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:bg-primary/5 transition-all cursor-pointer"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto">
            {/* Multi-step Progress Bar */}
            <div className="mb-6 sm:mb-10 w-full max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-4 relative">
                <div className="absolute top-1/2 left-[20px] right-[20px] h-0.5 -translate-y-1/2 z-0 overflow-hidden">
                  <div className="absolute inset-0 bg-surface-container-high"></div>
                  <div
                    className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-in-out"
                    style={{ width: `${(step - 1) * 33.33}%` }}
                  ></div>
                </div>

                <div className="z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shadow-sm transition-all duration-300 ${step >= 1 ? 'bg-primary text-on-primary ring-4 ring-primary-container/20' : 'bg-surface-container-high text-on-surface-variant'
                    }`}>
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <span className={`font-label-md text-label-md mt-2 ${step >= 1 ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>Personal</span>
                </div>

                <div className="z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shadow-sm transition-all duration-300 ${step >= 2 ? 'bg-primary text-on-primary ring-4 ring-primary-container/20' : 'bg-surface-container-high text-on-surface-variant'
                    }`}>
                    <span className="material-symbols-outlined">description</span>
                  </div>
                  <span className={`font-label-md text-label-md mt-2 ${step >= 2 ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>Documents</span>
                </div>

                <div className="z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shadow-sm transition-all duration-300 ${step >= 3 ? 'bg-primary text-on-primary ring-4 ring-primary-container/20' : 'bg-surface-container-high text-on-surface-variant'
                    }`}>
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <span className={`font-label-md text-label-md mt-2 ${step >= 3 ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>Payment</span>
                </div>

                <div className="z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shadow-sm transition-all duration-300 ${step >= 4 ? 'bg-primary text-on-primary ring-4 ring-primary-container/20' : 'bg-surface-container-high text-on-surface-variant'
                    }`}>
                    <span className="material-symbols-outlined">checklist</span>
                  </div>
                  <span className={`font-label-md text-label-md mt-2 ${step >= 4 ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>Verify</span>
                </div>
              </div>
            </div>

            <form onSubmit={step === 4 ? handleSubmit : handleNextStep}>
              {isAuthenticated && !isProfileComplete && (
                <div className="mb-6 p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-amber-600 text-2xl shrink-0 mt-0.5">warning</span>
                    <div>
                      <h3 className="text-sm font-bold text-amber-800 mb-1">Complete Your Profile First</h3>
                      <p className="text-body-sm text-amber-700">
                        Please fill in your Date of Birth, Gender, Emergency Contact, and Complete Address in your{' '}
                        <button type="button" onClick={() => onNavigate('/student/profile')} className="font-bold underline hover:text-amber-900 cursor-pointer">Profile Settings</button>
                        {' '}before you can submit a request.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 mb-5 sm:mb-6">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className={`w-2 h-2 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-outline-variant'}`} />
                ))}
                <span className="text-label-sm text-on-surface-variant ml-2">Step {step} of 4</span>
              </div>
              <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 sm:p-5 md:p-6 mb-6 sm:mb-8 shadow-sm">

                {/* STEP 1: Personal Info */}
                {step === 1 && (
                  <div className="animate-fade-in-up">
                    <header className="mb-4 sm:mb-6">
                      <h2 className="font-headline-md text-lg sm:text-headline-md text-primary mb-1 sm:mb-2">Personal Information</h2>
                      <p className="font-body-sm sm:font-body-md text-body-sm sm:text-body-md text-on-surface-variant">Provide your registry details to identify your academic records.</p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block font-label-md text-label-md text-on-surface-variant">Full Name (Last Name and First Name)</label>
                            {isAuthenticated && <span className="text-label-sm text-primary/60 font-medium">Auto-filled</span>}
                          </div>
                          <input
                            required
                            type="text"
                            name="fullName"
                            value={personalInfo.fullName}
                            onChange={handlePersonalChange}
                            readOnly={isAuthenticated}
                            className={`w-full rounded-lg border px-4 py-3 text-body-md outline-none ${isAuthenticated ? 'border-surface-container-high bg-surface-container-high text-on-surface/60 cursor-not-allowed' : 'border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary'}`}
                            placeholder="e.g. Dela Cruz, Juan"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block font-label-md text-label-md text-on-surface-variant">Student ID Number</label>
                            {isAuthenticated && <span className="text-label-sm text-primary/60 font-medium">Auto-filled</span>}
                          </div>
                          <input
                            required
                            type="text"
                            name="studentId"
                            value={personalInfo.studentId}
                            onChange={handlePersonalChange}
                            readOnly={isAuthenticated}
                            className={`w-full rounded-lg border px-4 py-3 text-body-md outline-none ${isAuthenticated ? 'border-surface-container-high bg-surface-container-high text-on-surface/60 cursor-not-allowed' : 'border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary'}`}
                            placeholder="e.g. TLGC-2022-0941"
                          />
                        </div>
                        <div>
                          <FormSelect
                            label="Year Level"
                            name="yearLevel"
                            value={personalInfo.yearLevel}
                            onChange={handlePersonalChange}
                            options={YEAR_LEVELS}
                            placeholder="Select Year Level"
                            required
                          />
                        </div>
                        <div>
                          <FormSelect
                            label="Block / Section"
                            name="section"
                            value={personalInfo.section}
                            onChange={handlePersonalChange}
                            options={SECTION_OPTIONS}
                            placeholder="Select Section"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block font-label-md text-label-md text-on-surface-variant">Email Address</label>
                            {isAuthenticated && <span className="text-label-sm text-primary/60 font-medium">Auto-filled</span>}
                          </div>
                          <input
                            required
                            type="email"
                            name="email"
                            value={personalInfo.email}
                            onChange={handlePersonalChange}
                            readOnly={isAuthenticated}
                            className={`w-full rounded-lg border px-4 py-3 text-body-md outline-none ${isAuthenticated ? 'border-surface-container-high bg-surface-container-high text-on-surface/60 cursor-not-allowed' : 'border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary'}`}
                            placeholder="e.g. juan.delacruz@example.com"
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
                  </div>
                )}

                {/* STEP 2: Document Selection */}
                {step === 2 && (
                  <div className="animate-fade-in-up">
                    <header className="mb-4 sm:mb-8">
                      <h2 className="font-headline-md text-lg sm:text-headline-md text-primary mb-1 sm:mb-2">Document Selection</h2>
                      <p className="font-body-sm sm:font-body-md text-body-sm sm:text-body-md text-on-surface-variant">Choose the official credentials you wish to request from the Registrar's Office. You may select multiple documents.</p>
                    </header>

                    {docsLoading ? (
                      <div className="text-center py-12 text-on-surface-variant">
                        <span className="material-symbols-outlined animate-spin text-4xl block mx-auto mb-4">sync</span>
                        Loading documents...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {documents.map((doc, docIdx) => {
                          const meta = DOCUMENT_META[doc.code] || {};
                          const isChecked = selectedDocs.includes(doc.code);
                          const bgColor = cardBgColors[doc.code] || fallbackBgColors[docIdx % fallbackBgColors.length];
                          return (
                            <div
                              key={doc.code}
                              onClick={() => toggleDocument(doc.code)}
                              className={`relative flex flex-col p-4 sm:p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-md active:scale-95 group ${bgColor} ${isChecked ? 'border-primary shadow-sm' : 'border-outline-variant'
                                }`}
                            >
                              <div className={`absolute top-4 sm:top-6 right-4 sm:right-6 w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-all ${isChecked ? 'border-primary bg-primary' : 'border-outline'
                                }`}>
                                {isChecked && <span className="material-symbols-outlined text-[14px] text-white" style={{ fontSize: '14px' }}>check</span>}
                              </div>
                              <div className="flex items-center gap-3 mb-3">
                                <span className={`material-symbols-outlined p-2 rounded-lg transition-transform duration-300 group-hover:rotate-6 ${isChecked ? 'bg-primary-fixed text-white' : 'bg-surface-container text-on-surface-variant'
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
                                <span className="font-body-md text-body-md font-bold text-primary">₱ {(Number(doc.price) || 0).toFixed(2)}</span>
                                <span className="font-label-sm text-label-sm text-on-surface-variant">{meta.daysLabel || `${doc.processing_days} Working Day(s)`}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Semester Selection for per-semester documents */}
                    {hasSemesterDoc && (
                      <div className="mt-8">
                        <label className="block font-label-md text-label-md text-on-surface-variant mb-4">
                          Semester/s Needed <span className="font-normal">(₱{Number(gradesPrice).toFixed(2)} per year-semester combination)</span>
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
                                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 font-bold text-label-md transition-all duration-200 cursor-pointer ${isSelected
                                        ? 'border-primary bg-primary-fixed text-on-primary'
                                        : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary/50'
                                        }`}
                                    >
                                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'border-primary bg-primary' : 'border-outline'
                                        }`}>
                                        {isSelected && <span className="material-symbols-outlined text-[14px] text-white" style={{ fontSize: '14px' }}>check</span>}
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
                              <span key={combo} className="bg-primary-fixed text-on-primary font-label-sm text-label-sm px-3 py-1.5 rounded-full border border-primary/20">
                                {combo}
                              </span>
                            ))}
                          </div>
                        )}
                        {selectedSemesters.length > 0 && (
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-3">
                            {selectedSemesters.length} combination(s) × ₱{Number(gradesPrice).toFixed(2)} = <span className="font-bold text-primary">₱{(Number(gradesPrice) * selectedSemesters.length).toFixed(2)}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Page count for per-page documents */}
                    {hasPerPageDoc && (
                      <div className="mt-8">
                        <label className="block font-label-md text-label-md text-on-surface-variant mb-4">
                          Number of Pages <span className="font-normal">(₱{Number(torPrice).toFixed(2)} per page)</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={pages}
                          onChange={(e) => setPages(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-32 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        />
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-3">
                          {pages} page(s) × ₱{Number(torPrice).toFixed(2)} = <span className="font-bold text-primary">₱{(Number(torPrice) * pages).toFixed(2)}</span>
                        </p>
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

                {/* STEP 3: Release Type & Payment Options */}
                {step === 3 && (
                  <div className="animate-fade-in-up">
                    <header className="mb-4 sm:mb-8">
                      <h2 className="font-headline-md text-lg sm:text-headline-md text-primary mb-1 sm:mb-2">Payment</h2>
                      <p className="font-body-sm sm:font-body-md text-body-sm sm:text-body-md text-on-surface-variant">Select your payment method.</p>
                    </header>

                    {/* Pickup Info - default, not selectable */}
                    <div className="max-w-lg mx-auto mb-6">
                      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-primary-container/20 border-l-4 border-l-primary">
                        <div className="w-5 h-5 shrink-0 flex items-center justify-center mt-0.5">
                          <span className="material-symbols-outlined text-primary text-lg">info</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-label-md font-bold text-on-surface">Pick up at Registrar Office</p>
                          <p className="text-body-sm text-on-surface-variant">Your documents will be available for claiming at TLGC campus.</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="max-w-lg mx-auto mb-8">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">Payment Method</h3>
                      <div className="space-y-3">
                        <div
                          onClick={() => setPaymentMethod('cash')}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-primary bg-surface-container-low' : 'border-outline-variant bg-surface-container-lowest'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 shrink-0 aspect-square rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cash' ? 'border-primary' : 'border-outline'
                              }`}>
                              {paymentMethod === 'cash' && <div className="w-2.5 h-2.5 shrink-0 aspect-square rounded-full bg-primary"></div>}
                            </div>
                            <div className="min-w-0">
                              <p className="font-label-md font-bold text-on-surface">Cash Payment</p>
                              <p className="text-body-sm text-on-surface-variant">Pay at the Registrar Office during claiming.</p>
                            </div>
                          </div>
                        </div>

                        {onlinePaymentEnabled && (
                          <div
                            onClick={() => setPaymentMethod('online')}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-primary bg-surface-container-low' : 'border-outline-variant bg-surface-container-lowest'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 shrink-0 aspect-square rounded-full border-2 flex items-center justify-center ${paymentMethod === 'online' ? 'border-primary' : 'border-outline'
                                }`}>
                                {paymentMethod === 'online' && <div className="w-2.5 h-2.5 shrink-0 aspect-square rounded-full bg-primary"></div>}
                              </div>
                              <div className="min-w-0">
                                <p className="font-label-md font-bold text-on-surface">Online Payment</p>
                                <p className="text-body-sm text-on-surface-variant">Pay via GCash / Maya and upload a screenshot of your payment.</p>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>

                  </div>
                )}

                {/* STEP 4: Verify Request */}
                {step === 4 && (
                  <div className="animate-fade-in-up">
                    <header className="mb-4 sm:mb-8">
                      <h2 className="font-headline-md text-lg sm:text-headline-md text-primary mb-1 sm:mb-2">Verify Your Request</h2>
                      <p className="font-body-sm sm:font-body-md text-body-sm sm:text-body-md text-on-surface-variant">Please review your information carefully before submitting.</p>
                    </header>

                    {/* Request Summary */}
                    <div className="border border-outline-variant rounded-xl p-6 bg-surface-container-low mb-8">
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
                          <span className="text-on-surface-variant font-medium">Selected Documents:</span>
                          <span className="font-bold text-on-surface text-right">
                            {selectedDocObjects.map(d => d.name).join(', ')}
                          </span>
                        </div>
                        {hasSemesterDoc && selectedSemesters.length > 0 && (
                          <div className="flex justify-between border-b border-outline-variant pb-2">
                            <span className="text-on-surface-variant font-medium">Semester/s:</span>
                            <span className="font-bold text-on-surface text-right">
                              {selectedSemesters.join(', ')}
                            </span>
                          </div>
                        )}
                        {hasPerPageDoc && (
                          <div className="flex justify-between border-b border-outline-variant pb-2">
                            <span className="text-on-surface-variant font-medium">Pages:</span>
                            <span className="font-bold text-on-surface text-right">{pages}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-b border-outline-variant pb-2">
                          <span className="text-on-surface-variant font-medium">Release Method:</span>
                          <span className="font-bold text-on-surface">Pick up at Registrar Office</span>
                        </div>
                        <div className="flex justify-between border-b border-outline-variant pb-2">
                          <span className="text-on-surface-variant font-medium">Payment Method:</span>
                          <span className="font-bold text-on-surface">{paymentMethod === 'online' ? 'Online Payment' : 'Cash Payment'}</span>
                        </div>
                        <div className="flex justify-between pb-2">
                          <span className="text-on-surface-variant font-medium">Payment Status:</span>
                          <span className="font-bold text-on-surface">Unpaid</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t-2 border-primary/20">
                        <span className="text-headline-sm text-xl font-bold text-on-surface">Total Processing Fee:</span>
                        <span className="text-2xl font-bold text-primary">₱ {totalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Verification Section */}
                    <div className="mb-8">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Confirm Your Information</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mb-5">Please review your information carefully before submitting.</p>
                      <div className="space-y-3">
                        <label onClick={() => toggleConfirmation('infoCorrect')} className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${confirmations.infoCorrect ? 'border-primary bg-surface-container-low' : 'border-outline-variant bg-surface-container-lowest'}`}>
                          <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${confirmations.infoCorrect ? 'border-primary bg-primary' : 'border-outline'}`}>
                            {confirmations.infoCorrect && <span className="material-symbols-outlined text-[14px] text-white" style={{ fontSize: '14px' }}>check</span>}
                          </div>
                          <span className="font-body-sm text-body-sm text-on-surface">I confirm that all information provided is true and correct.</span>
                        </label>
                        <label onClick={() => toggleConfirmation('understandDelay')} className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${confirmations.understandDelay ? 'border-primary bg-surface-container-low' : 'border-outline-variant bg-surface-container-lowest'}`}>
                          <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${confirmations.understandDelay ? 'border-primary bg-primary' : 'border-outline'}`}>
                            {confirmations.understandDelay && <span className="material-symbols-outlined text-[14px] text-white" style={{ fontSize: '14px' }}>check</span>}
                          </div>
                          <span className="font-body-sm text-body-sm text-on-surface">I understand that incorrect information may delay the processing of my request.</span>
                        </label>
                        <label onClick={() => toggleConfirmation('agreeRules')} className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${confirmations.agreeRules ? 'border-primary bg-surface-container-low' : 'border-outline-variant bg-surface-container-lowest'}`}>
                          <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${confirmations.agreeRules ? 'border-primary bg-primary' : 'border-outline'}`}>
                            {confirmations.agreeRules && <span className="material-symbols-outlined text-[14px] text-white" style={{ fontSize: '14px' }}>check</span>}
                          </div>
                          <span className="font-body-sm text-body-sm text-on-surface">I agree to follow the registrar office requirements.</span>
                        </label>
                      </div>
                    </div>

                    {/* Step Error */}
                    {stepError && (
                      <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/30">
                        <p className="font-body-sm text-body-sm text-error">{stepError}</p>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Submit Error */}
              {submitError && (
                <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/30">
                  <p className="font-body-sm text-body-sm text-error">{submitError}</p>
                </div>
              )}

              {/* Warning Box */}
              {step === 4 && (
                <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="font-body-sm text-body-sm text-amber-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-600 text-[20px]">info</span>
                    Please review all details carefully. Submitted requests cannot be edited.
                  </p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between gap-3 sm:gap-6 pt-2">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBackStep}
                    className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-8 h-12 sm:h-14 rounded-xl bg-surface-container-high text-primary font-bold text-sm sm:text-base hover:bg-surface-container-highest transition-all duration-300 active:scale-95 group cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg transition-transform duration-300 group-hover:-translate-x-1">arrow_back</span>
                    <span className="whitespace-nowrap">Back</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); onNavigate('/'); }}
                    className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-8 h-12 sm:h-14 rounded-xl bg-surface-container-high text-primary font-bold text-sm sm:text-base hover:bg-surface-container-highest transition-all duration-300 active:scale-95 group cursor-pointer"
                  >
                    Cancel
                  </button>
                )}

                {step < 4 ? (
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-8 h-12 sm:h-14 rounded-xl bg-primary text-on-primary font-bold text-sm sm:text-base hover:opacity-90 shadow-lg transition-all duration-300 active:scale-95 group cursor-pointer"
                  >
                    <span className="whitespace-nowrap">Next Step</span>
                    <span className="material-symbols-outlined text-lg transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !allConfirmed}
                    className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-8 h-12 sm:h-14 rounded-xl bg-primary text-on-primary font-bold text-sm sm:text-base hover:opacity-90 shadow-lg transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <span className="whitespace-nowrap">Submit Request</span>
                        <span className="material-symbols-outlined text-lg">send</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>


    </StudentDashboardLayout>
  );
}

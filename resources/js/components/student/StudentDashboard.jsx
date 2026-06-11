import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import StudentDashboardLayout from './StudentDashboardLayout';

const STATUS_BADGES = {
  'Pending': 'bg-amber-100 text-amber-800 border-amber-300',
  'Processing': 'bg-blue-100 text-blue-800 border-blue-300',
  'Ready for Release': 'bg-purple-100 text-purple-800 border-purple-300',
  'Claimed': 'bg-slate-200 text-slate-700 border-slate-300',
  'Cancelled': 'bg-red-100 text-red-800 border-red-200',
};

const STATUS_SUMMARY = [
  { label: 'Pending', key: 'Pending', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' },
  { label: 'Processing', key: 'Processing', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
  { label: 'Ready for Release', key: 'Ready for Release', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800' },
  { label: 'Claimed', key: 'Claimed', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-800' },
];

export default function StudentDashboard({ student, onLogout, onNavigate, currentPath }) {
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = () => {
    setLoading(true);
    setError('');
    fetch('/student/requests', { headers: { 'Accept': 'application/json' } })
      .then(res => res.json())
      .then(data => {
        if (data.success) setAllRequests(data.requests);
        else setError(data.message || 'Failed to load requests.');
        setLoading(false);
      })
      .catch(() => {
        setError('Unable to load requests. Please try again.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const recentRequests = allRequests.slice(0, 5);

  const statusCounts = {};
  STATUS_SUMMARY.forEach(s => { statusCounts[s.key] = 0; });
  allRequests.forEach(req => {
    if (statusCounts.hasOwnProperty(req.status)) statusCounts[req.status]++;
  });

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <StudentDashboardLayout title="Dashboard" subtitle="Student Portal" student={student} onLogout={onLogout} onNavigate={onNavigate} currentPath={currentPath}>
      <div className="max-w-container-max mx-auto">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 sm:p-7 mb-6 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-primary mb-1">{getGreeting()}, {student?.first_name}</h2>
          <p className="text-body-md text-on-surface-variant mb-4">Welcome to your student portal. Manage and monitor your credential requests.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-surface-container-low rounded-xl px-4 py-3 border border-outline-variant">
              <span className="text-label-sm text-on-surface-variant">Full Name</span>
              <p className="font-bold text-on-surface text-body-md truncate">{student?.last_name}, {student?.first_name}</p>
            </div>
            <div className="bg-surface-container-low rounded-xl px-4 py-3 border border-outline-variant">
              <span className="text-label-sm text-on-surface-variant">Student Number</span>
              <p className="font-bold text-on-surface text-body-md">{student?.student_number}</p>
            </div>
            <div className="bg-surface-container-low rounded-xl px-4 py-3 border border-outline-variant">
              <span className="text-label-sm text-on-surface-variant">Email</span>
              <p className="font-bold text-on-surface text-body-md truncate">{student?.email}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {STATUS_SUMMARY.map(({ label, key, bg, border, text }) => {
            const count = statusCounts[key] || 0;
            return (
              <div key={key} className={`${bg} border ${border} rounded-xl p-4`}>
                <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-2xl font-bold ${text}`}>{count}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 sm:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-on-surface">Recent Requests</h3>
            {!error && recentRequests.length > 0 && (
              <button onClick={() => onNavigate('/student/requests')} className="text-label-sm font-bold text-primary hover:underline cursor-pointer">
                View All
              </button>
            )}
          </div>

          {error ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-error" />
                <p className="text-body-md text-error">{error}</p>
              </div>
              <button onClick={fetchRequests} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-bold text-label-sm hover:opacity-90 transition-all cursor-pointer">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-surface-container-high rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentRequests.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">inbox</span>
              <p className="text-body-md text-on-surface-variant">No requests yet.</p>
              <button onClick={() => onNavigate('/request')} className="mt-3 text-label-sm font-bold text-primary hover:underline cursor-pointer">
                Submit your first request
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentRequests.map(req => (
                <div
                  key={req.tracking_number}
                  onClick={() => onNavigate(`/student/requests/${req.tracking_number}`)}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-surface-container-low border border-outline-variant hover:border-primary/30 hover:bg-surface-container-high transition-all cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-body-md text-on-surface truncate">{req.documents.join(', ')}</p>
                    <p className="text-label-sm text-on-surface-variant">{req.tracking_number} · {req.created_at}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <span className={`text-label-sm font-bold px-2.5 py-1 rounded-full border shrink-0 ${STATUS_BADGES[req.status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                      {req.status}
                    </span>
                    <span className="material-symbols-outlined text-on-surface-variant text-xl">chevron_right</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentDashboardLayout>
  );
}

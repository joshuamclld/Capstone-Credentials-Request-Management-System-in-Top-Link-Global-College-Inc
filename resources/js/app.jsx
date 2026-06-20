import React, { useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import StudentLanding from './components/StudentLanding';
import StudentRequestForm from './components/StudentRequestForm';
import StudentTrackDashboard from './components/StudentTrackDashboard';
import StudentDashboard from './components/student/StudentDashboard';
import StudentMyRequests from './components/student/StudentMyRequests';
import StudentRequestDetail from './components/student/StudentRequestDetail';
import StudentProfile from './components/student/StudentProfile';
import AdminLogin from './components/AdminLogin';
import ErrorBoundary from './components/ErrorBoundary';

import RegistrarDashboard from './components/dashboard/pages/RegistrarDashboard';
import RequestManagement from './components/dashboard/pages/RequestManagement';
import RequestDetails from './components/dashboard/pages/RequestDetails';
import ProcessRequests from './components/dashboard/pages/ProcessRequests';
import ReleaseCredentials from './components/dashboard/pages/ReleaseCredentials';
import SearchRecords from './components/dashboard/pages/SearchRecords';
import NotificationList from './components/dashboard/pages/NotificationList';
import CashierDashboard from './components/dashboard/pages/CashierDashboard';
import PaymentQueue from './components/dashboard/pages/PaymentQueue';
import PaymentDetails from './components/dashboard/pages/PaymentDetails';
import PaidTransactions from './components/dashboard/pages/PaidTransactions';
import CashierSettings from './components/dashboard/pages/CashierSettings';
import SystemAdminDashboard from './components/dashboard/pages/system-admin/SystemAdminDashboard';
import SystemAdminUserManagement from './components/dashboard/pages/system-admin/SystemAdminUserManagement';
import SystemAdminUserDetails from './components/dashboard/pages/system-admin/SystemAdminUserDetails';
import SystemAdminCredentialTypes from './components/dashboard/pages/system-admin/SystemAdminCredentialTypes';
import SystemAdminReportsAnalytics from './components/dashboard/pages/system-admin/SystemAdminReportsAnalytics';
import SystemAdminAuditLogs from './components/dashboard/pages/system-admin/SystemAdminAuditLogs';
import StudentManagement from './components/dashboard/pages/system-admin/StudentManagement';
import '../css/app.css';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [user, setUser] = useState(null);

    const [studentUser, setStudentUser] = useState(null);
    const [studentAuthChecked, setStudentAuthChecked] = useState(false);

    const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Check authentication status on app load
  useEffect(() => {
    const controller = new AbortController();
    fetch('/admin/check-auth', { signal: controller.signal })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'authenticated') {
          setIsAuthenticated(true);
          setUser(data.user);
        }
        setAuthChecked(true);
      })
      .catch(() => {
        setAuthChecked(true);
      });
    return () => controller.abort();
  }, []);

  // Check student authentication status on app load
  useEffect(() => {
    const controller = new AbortController();
    fetch('/student/check', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) setStudentUser(data.student);
        setStudentAuthChecked(true);
      })
      .catch(() => setStudentAuthChecked(true));
    return () => controller.abort();
  }, []);

  // Listen to popstate event (browser back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // SPA navigation function
  const navigate = (path) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleStudentModalLogin = (studentData) => {
    setStudentUser(studentData);
    navigate('/student/dashboard');
  };

  // Auto-redirect authenticated students away from guest pages
  useEffect(() => {
    if (studentUser && studentAuthChecked) {
      const guestPaths = ['/', '/student/login', '/login'];
      if (guestPaths.includes(currentPath)) {
        navigate('/student/dashboard');
      }
    }
  }, [studentUser, studentAuthChecked, currentPath]);

  const handleStudentLogout = async () => {
    if (!studentUser) return;
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    try {
      await fetch('/student/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token },
      });
    } catch {
      // Fallback: session might already be expired
    }
    setStudentUser(null);
    navigate('/');
  };

  const clearAuth = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  const refreshCurrentUser = useCallback(() => {
    fetch('/admin/check-auth')
      .then(response => response.json())
      .then(data => {
        if (data.status === 'authenticated') {
          setUser(data.user);
        }
      })
      .catch(err => console.error('Auth check failed:', err));
  }, []);

  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    fetch('/csrf-token')
      .then(r => r.json())
      .then(data => {
        document.querySelector('meta[name="csrf-token"]')?.setAttribute('content', data.token);
      })
      .catch(() => {});
    const dashboard = userData.role === 'cashier'
      ? '/cashier-dashboard'
      : userData.role === 'system_admin'
        ? '/system-admin-dashboard'
        : '/admin-dashboard';
    navigate(dashboard);
  };

  // Poll auth status every 5 minutes to detect session expiry
  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    const interval = setInterval(() => {
      fetch('/admin/check-auth', { signal: controller.signal })
        .then(res => res.json())
        .then(data => {
          if (data.status !== 'authenticated') {
            clearAuth();
            navigate('/admin-login?expired=1');
          }
        })
        .catch(() => {
          clearAuth();
          navigate('/admin-login?expired=1');
        });
    }, 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [isAuthenticated]);

  // Refresh CSRF token every 30 minutes to prevent token mismatch on network changes
  useEffect(() => {
    const refresh = () => {
      fetch('/csrf-token')
        .then(r => r.json())
        .then(data => {
          document.querySelector('meta[name="csrf-token"]')?.setAttribute('content', data.token);
        })
        .catch(() => {});
    };
    const interval = setInterval(refresh, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    fetch('/admin/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      }
    })
    .then(() => {
      setIsAuthenticated(false);
      setUser(null);
      navigate('/admin-login');
    })
    .catch(() => {
      setIsAuthenticated(false);
      setUser(null);
      navigate('/admin-login');
    });
  };

  // Route resolver
  if (currentPath === '/admin-login') {
    if (isAuthenticated && authChecked) {
      const dashboard = user?.role === 'cashier'
        ? '/cashier-dashboard'
        : user?.role === 'system_admin'
          ? '/system-admin-dashboard'
          : '/admin-dashboard';
      setTimeout(() => navigate(dashboard), 0);
      return null;
    }
    
    // Show loading state while checking auth
    if (!authChecked) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // Auth check helper for all admin/cashier routes
  if (currentPath.startsWith('/admin-') || currentPath.startsWith('/admin/') || currentPath.startsWith('/cashier-') || currentPath.startsWith('/cashier/') || currentPath.startsWith('/system-') || currentPath.startsWith('/system-admin-') || currentPath.startsWith('/system-admin/')) {
    if (!isAuthenticated && authChecked) {
      setTimeout(() => navigate('/admin-login'), 0);
      return null;
    }

    if (!authChecked) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    // Role-based route guarding
    const registrarPaths = ['/admin-dashboard', '/admin/requests', '/admin/process', '/admin/release', '/admin/search'];
    const isRegistrarPath = registrarPaths.some(p => currentPath === p || (currentPath.startsWith('/admin/requests/') && p === '/admin/requests'));
    const isCashierPath = currentPath.startsWith('/cashier');

    if (isRegistrarPath && user.role !== 'registrar') {
      const fallback = user.role === 'system_admin' ? '/system-admin-dashboard' : '/cashier-dashboard';
      setTimeout(() => navigate(fallback), 0);
      return null;
    }

    if (isCashierPath && user.role !== 'cashier' && user.role !== 'registrar') {
      const fallback = user.role === 'system_admin' ? '/system-admin-dashboard' : '/admin-dashboard';
      setTimeout(() => navigate(fallback), 0);
      return null;
    }

    const isSystemAdminPath = currentPath.startsWith('/system-admin-') || currentPath.startsWith('/system-admin/');
    if (isSystemAdminPath && user.role !== 'system_admin') {
      const fallback = user.role === 'registrar' ? '/admin-dashboard' : '/cashier-dashboard';
      setTimeout(() => navigate(fallback), 0);
      return null;
    }

    // Non-super-admin system_admin cannot access user management
    const isUserMgmtPath = currentPath === '/system-admin/users' || currentPath.startsWith('/system-admin/users/');
    if (isUserMgmtPath && user.role === 'system_admin' && !user.is_super_admin) {
      setTimeout(() => navigate('/system-admin-dashboard'), 0);
      return null;
    }

    // Unknown role — redirect to login
    if (user.role !== 'registrar' && user.role !== 'cashier' && user.role !== 'system_admin') {
      setTimeout(() => navigate('/admin-login'), 0);
      return null;
    }
  }

  if (currentPath === '/admin/notifications') {
    return <NotificationList user={user} onLogout={handleLogout} onNavigate={navigate} />;
  }

  if (currentPath === '/admin-dashboard') {
    return <RegistrarDashboard user={user} onLogout={handleLogout} onNavigate={navigate} />;
  }

  if (currentPath === '/admin/requests') {
    return <RequestManagement user={user} onLogout={handleLogout} onNavigate={navigate} />;
  }

  if (currentPath.startsWith('/admin/requests/')) {
    return <RequestDetails user={user} onLogout={handleLogout} onNavigate={navigate} />;
  }

  if (currentPath === '/admin/process') {
    return <ProcessRequests user={user} onLogout={handleLogout} onNavigate={navigate} />;
  }

  if (currentPath === '/admin/release') {
    return <ReleaseCredentials user={user} onLogout={handleLogout} onNavigate={navigate} />;
  }

  if (currentPath === '/admin/search') {
    return <SearchRecords user={user} onLogout={handleLogout} onNavigate={navigate} />;
  }

  // Cashier routes
  if (currentPath === '/cashier-dashboard') {
    return <CashierDashboard user={user} onLogout={handleLogout} onNavigate={navigate} />;
  }

  if (currentPath === '/cashier/payments') {
    return <PaymentQueue user={user} onLogout={handleLogout} onNavigate={navigate} />;
  }

  if (currentPath.startsWith('/cashier/payments/')) {
    return <PaymentDetails user={user} onLogout={handleLogout} onNavigate={navigate} />;
  }

  if (currentPath === '/cashier/transactions') {
    return <PaidTransactions user={user} onLogout={handleLogout} onNavigate={navigate} />;
  }

  if (currentPath === '/cashier/settings') {
    return <CashierSettings user={user} onLogout={handleLogout} onNavigate={navigate} />;
  }

  if (currentPath === '/request') {
    if (!studentAuthChecked) return <div className="flex items-center justify-center min-h-screen text-on-surface-variant">Loading...</div>;
    if (!studentUser) return <StudentLanding student={studentUser} onLogout={handleStudentLogout} onNavigate={navigate} currentPath={currentPath} initialAuthTab="login" onStudentLogin={handleStudentModalLogin} />;
    return <StudentRequestForm onNavigate={navigate} student={studentUser} onLogout={handleStudentLogout} currentPath={currentPath} />;
  }

  if (currentPath === '/track') {
    return <StudentTrackDashboard studentUser={studentUser} onLogout={handleStudentLogout} onNavigate={navigate} onStudentLogin={handleStudentModalLogin} currentPath={currentPath} />;
  }

  // Student Dashboard - authenticated only
  if (currentPath === '/student/dashboard') {
    if (!studentAuthChecked) return <div className="flex items-center justify-center min-h-screen text-on-surface-variant">Loading...</div>;
    if (!studentUser) return <StudentLanding student={studentUser} onLogout={handleStudentLogout} onNavigate={navigate} currentPath={currentPath} initialAuthTab="login" onStudentLogin={handleStudentModalLogin} />;
    return <StudentDashboard student={studentUser} onLogout={handleStudentLogout} onNavigate={navigate} currentPath={currentPath} />;
  }

  // My Requests - authenticated only
  if (currentPath === '/student/requests') {
    if (!studentAuthChecked) return <div className="flex items-center justify-center min-h-screen text-on-surface-variant">Loading...</div>;
    if (!studentUser) return <StudentLanding student={studentUser} onLogout={handleStudentLogout} onNavigate={navigate} currentPath={currentPath} initialAuthTab="login" onStudentLogin={handleStudentModalLogin} />;
    return <StudentMyRequests student={studentUser} onLogout={handleStudentLogout} onNavigate={navigate} currentPath={currentPath} />;
  }

  // Student Request Detail (plural - dashboard layout) - authenticated only
  if (currentPath.startsWith('/student/requests/')) {
    if (!studentAuthChecked) return <div className="flex items-center justify-center min-h-screen text-on-surface-variant">Loading...</div>;
    if (!studentUser) return <StudentLanding student={studentUser} onLogout={handleStudentLogout} onNavigate={navigate} currentPath={currentPath} initialAuthTab="login" onStudentLogin={handleStudentModalLogin} />;
    const trackingNumber = currentPath.replace('/student/requests/', '');
    return <StudentRequestDetail student={studentUser} onLogout={handleStudentLogout} onNavigate={navigate} currentPath={currentPath} trackingNumber={trackingNumber} />;
  }

  // Student Profile - authenticated only
  if (currentPath === '/student/profile') {
    if (!studentAuthChecked) return <div className="flex items-center justify-center min-h-screen text-on-surface-variant">Loading...</div>;
    if (!studentUser) return <StudentLanding student={studentUser} onLogout={handleStudentLogout} onNavigate={navigate} currentPath={currentPath} initialAuthTab="login" onStudentLogin={handleStudentModalLogin} />;
    return <StudentProfile student={studentUser} onLogout={handleStudentLogout} onNavigate={navigate} currentPath={currentPath} onStudentUpdate={setStudentUser} />;
  }

  // Student Request Detail (singular - public layout) - authenticated only
  if (currentPath.startsWith('/student/request/')) {
    if (!studentAuthChecked) return <div className="flex items-center justify-center min-h-screen text-on-surface-variant">Loading...</div>;
    if (!studentUser) return <StudentLanding student={studentUser} onLogout={handleStudentLogout} onNavigate={navigate} currentPath={currentPath} initialAuthTab="login" onStudentLogin={handleStudentModalLogin} />;
    const trackingNumber = currentPath.replace('/student/request/', '');
    return <StudentTrackDashboard studentUser={studentUser} onLogout={handleStudentLogout} onNavigate={navigate} onStudentLogin={handleStudentModalLogin} currentPath={currentPath} preloadTrackingNumber={trackingNumber} />;
  }

  // Student Authentication Routes
  if (currentPath === '/student/login') {
    return <StudentLanding student={studentUser} onLogout={handleStudentLogout} onNavigate={navigate} currentPath={currentPath} initialAuthTab="login" onStudentLogin={handleStudentModalLogin} />;
  }

  // Legacy redirect — /system/* and /system-* → /system-admin/*
  if ((currentPath.startsWith('/system/') || currentPath.startsWith('/system-')) && !currentPath.startsWith('/system-admin')) {
    setTimeout(() => navigate(currentPath.replace('/system', '/system-admin')), 0);
    return null;
  }

  // System Administrator routes
  if (currentPath === '/system-admin-dashboard') {
    return <SystemAdminDashboard user={user} onLogout={handleLogout} onNavigate={navigate} />;
  }

  if (currentPath === '/system-admin/users') {
    return <SystemAdminUserManagement user={user} onLogout={handleLogout} onNavigate={navigate} onUserUpdate={refreshCurrentUser} />;
  }

  if (currentPath.startsWith('/system-admin/users/')) {
    return <SystemAdminUserDetails user={user} onLogout={handleLogout} onNavigate={navigate} />;
  }

  if (currentPath === '/system-admin/credentials') {
    return <SystemAdminCredentialTypes user={user} onLogout={handleLogout} onNavigate={navigate} />;
  }

  if (currentPath === '/system-admin/reports') {
    return <SystemAdminReportsAnalytics user={user} onLogout={handleLogout} onNavigate={navigate} />;
  }

  if (currentPath === '/system-admin/audit-logs') {
    return <SystemAdminAuditLogs user={user} onLogout={handleLogout} onNavigate={navigate} />;
  }

  if (currentPath === '/system-admin/students') {
    return <StudentManagement user={user} onLogout={handleLogout} onNavigate={navigate} />;
  }

  // Fallback: Default to Student Landing Page
  return <StudentLanding student={studentUser} onLogout={handleStudentLogout} onNavigate={navigate} currentPath={currentPath} onStudentLogin={handleStudentModalLogin} />;
}

createRoot(document.getElementById('app')).render(<ErrorBoundary><App /></ErrorBoundary>);

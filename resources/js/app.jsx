import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import StudentLanding from './components/StudentLanding';
import StudentRequestForm from './components/StudentRequestForm';
import StudentTrackDashboard from './components/StudentTrackDashboard';
import AdminLogin from './components/AdminLogin';
import Dashboard from './components/Dashboard';
import '../css/app.css';

function App() {
  console.log('App component rendered');
  
  // Auth state - now based on backend session
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  // Current path state for client-side routing
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Health check state
  const [backendStatus, setBackendStatus] = useState('Checking');

  // Check authentication status on app load
  useEffect(() => {
    fetch('/admin/check-auth')
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
  }, []);

  useEffect(() => {
    fetch('/api/health')
      .then((response) => response.json())
      .then((data) => setBackendStatus(data.status ?? 'Online'))
      .catch(() => setBackendStatus('Unavailable'));
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

  const clearAuth = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    navigate('/admin-dashboard');
  };

  // Poll auth status every 5 minutes to detect session expiry
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      fetch('/admin/check-auth')
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
    return () => clearInterval(interval);
  }, [isAuthenticated]);

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
      // Auto-redirect to dashboard if authenticated
      setTimeout(() => navigate('/admin-dashboard'), 0);
      return null;
    }
    
    // Show loading state while checking auth
    if (!authChecked) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentPath === '/admin-dashboard') {
    if (!isAuthenticated && authChecked) {
      // Auto-redirect to login if unauthenticated
      setTimeout(() => navigate('/admin-login'), 0);
      return null;
    }
    
    // Show loading state while checking auth
    if (!authChecked) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    return (
      <Dashboard 
        backendStatus={backendStatus} 
        onLogout={handleLogout} 
      />
    );
  }

  if (currentPath === '/request') {
    return <StudentRequestForm onNavigate={navigate} />;
  }

  if (currentPath === '/track') {
    return <StudentTrackDashboard onNavigate={navigate} />;
  }

  // Fallback: Default to Student Landing Page
  return <StudentLanding onNavigate={navigate} />;
}

createRoot(document.getElementById('app')).render(<App />);

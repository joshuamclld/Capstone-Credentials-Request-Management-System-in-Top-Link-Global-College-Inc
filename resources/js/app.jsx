import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import AdminLogin from './components/AdminLogin';
import Dashboard from './components/Dashboard';
import '../css/app.css';

function App() {
  console.log('App component rendered');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Read auth state from localStorage to persist across dev refreshes
    return localStorage.getItem("crms_admin_authenticated") === "true";
  });

    const [backendStatus, setBackendStatus] = useState('Checking');

    useEffect(() => {
        fetch('/api/health')
            .then((response) => response.json())
            .then((data) => setBackendStatus(data.status ?? 'Online'))
            .catch(() => setBackendStatus('Unavailable'));
    }, []);

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
        localStorage.setItem('crms_admin_authenticated', 'true');
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('crms_admin_authenticated');
    };

    if (isAuthenticated) {
        return (
            <Dashboard 
                backendStatus={backendStatus} 
                onLogout={handleLogout} 
            />
        );
    }

    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
}

createRoot(document.getElementById('app')).render(<App />);

import React, { useEffect, useState } from 'react';

import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldAlert, Loader2, CheckCircle, Clock } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [errorMessage, setErrorMessage] = useState('');
    const [sessionExpired, setSessionExpired] = useState(false);

    useEffect(() => {
        if (window.location.search.includes('expired=1')) {
            setSessionExpired(true);
            window.history.replaceState({}, '', '/admin-login');
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !password) return;

        setStatus('loading');
        setErrorMessage('');

        // Real API call to Laravel backend
        fetch('/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            },
            body: JSON.stringify({ email, password, remember_me: rememberMe })
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.message || 'Login failed');
                    }).catch(e => {
                        if (e instanceof SyntaxError) {
                            throw new Error('Server error. Please try again.');
                        }
                        throw e;
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    setStatus('success');
                    onLoginSuccess(data.user);
                } else {
                    throw new Error(data.message || 'Login failed');
                }
            })
            .catch(error => {
                setStatus('error');
                setErrorMessage(error.message || 'An error occurred during login');
            });
    };

    return (
        <div className="bg-surface font-body-md text-on-surface flex flex-col min-h-screen">
            {/* Main Content Area */}
            <main className="flex-grow flex items-center justify-center px-margin-mobile py-12">
                <div className="animate-card w-full max-w-[440px] bg-surface-container-lowest border border-outline-variant rounded-lg p-8 md:p-10 shadow-sm">

                    {/* Logo and Branding */}
                    <div className="flex flex-col items-center mb-10 text-center">
                        <img
                            alt="Top Link Global College Logo"
                            className="h-24 w-24 mb-6 object-contain"
                            src="/images/logo.png"
                        />
                        <h1 className="text-headline-md font-headline-md text-on-surface mb-1">Registrar Admin Portal</h1>
                        <p className="text-body-sm font-body-sm text-on-surface-variant">Credentials Request Management System</p>
                    </div>

                    {/* Login Form */}
                    <form className="space-row gap-6 flex flex-col" onSubmit={handleSubmit}>

                        {/* Institutional Email */}
                        <div className="flex flex-col gap-2">
                            <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="email">
                                Institutional Email
                            </label>
                            <div className="relative input-focus-ring border border-outline rounded-lg bg-surface transition-all duration-200">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-on-surface-variant" />
                                <input
                                    className="w-full pl-11 pr-4 py-3 bg-transparent border-none rounded-lg focus:outline-none focus:ring-0 text-body-md placeholder:text-outline"
                                    id="email"
                                    placeholder="admin@tlgc.edu.ph"
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={status === 'loading' || status === 'success'}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="password">
                                    Password
                                </label>
                            </div>
                            <div className="relative input-focus-ring border border-outline rounded-lg bg-surface transition-all duration-200">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-on-surface-variant" />
                                <input
                                    className="w-full pl-11 pr-12 py-3 bg-transparent border-none rounded-lg focus:outline-none focus:ring-0 text-body-md placeholder:text-outline"
                                    id="password"
                                    placeholder="••••••••"
                                    required
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={status === 'loading' || status === 'success'}
                                />
                                <button
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={status === 'loading' || status === 'success'}
                                >
                                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between mt-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    className="w-4 h-4 rounded border-outline text-primary focus:ring-primary-container transition-all cursor-pointer"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    disabled={status === 'loading' || status === 'success'}
                                />
                                <span className="text-body-sm font-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                                    Remember me
                                </span>
                            </label>
                            <a
                                className="text-body-sm font-body-sm text-primary hover:underline font-medium cursor-pointer"
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    alert('Please contact the System IT Admin to reset your password.');
                                }}
                            >
                                Forgot Password?
                            </a>
                        </div>

                        {/* Session Expired Message */}
                        {sessionExpired && (
                            <div className="text-amber-800 bg-amber-50 border border-amber-200 px-4 py-3 rounded-lg text-body-sm font-body-sm flex items-center gap-2">
                                <Clock className="size-4 shrink-0" />
                                Your session has expired. Please sign in again.
                            </div>
                        )}

                        {/* Error Message */}
                        {status === 'error' && (
                            <div className="text-error bg-error-container/20 px-4 py-3 rounded-lg text-body-sm font-body-sm">
                                {errorMessage}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            className={`mt-4 w-full py-4 px-6 rounded-lg font-headline-sm text-headline-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer 
                                ${status === 'success'
                                    ? 'bg-on-primary-container text-primary font-semibold'
                                    : status === 'error'
                                        ? 'bg-error text-on-error'
                                        : 'bg-primary text-on-primary'
                                }`}
                            type="submit"
                            disabled={status === 'loading' || status === 'success'}
                        >
                            {status === 'idle' && (
                                <>
                                    Sign In to Dashboard
                                    <ArrowRight className="size-5" />
                                </>
                            )}
                            {status === 'loading' && (
                                <>
                                    <Loader2 className="size-5 animate-spin" />
                                    Authenticating...
                                </>
                            )}
                            {status === 'success' && (
                                <>
                                    <CheckCircle className="size-5" />
                                    Verified
                                </>
                            )}
                            {status === 'error' && (
                                <>
                                    <ShieldAlert className="size-5" />
                                    Try Again
                                </>
                            )}
                        </button>
                    </form>

                    {/* Security Info */}
                    <div className="mt-10 pt-6 border-t border-outline-variant flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 text-on-error-container bg-error-container/20 px-3 py-1.5 rounded-full">
                            <ShieldAlert className="size-4 text-error" />
                            <span className="text-label-sm font-label-sm text-error font-semibold">Authorized Personnel Only</span>
                        </div>
                        <p className="text-center text-label-sm font-label-sm text-on-surface-variant leading-relaxed">
                            This is a secure system. Unauthorized access is strictly prohibited and subject to institutional discipline and legal action.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}

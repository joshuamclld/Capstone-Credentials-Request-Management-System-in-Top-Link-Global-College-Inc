import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 text-center shadow-xl">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-error/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-error">error_outline</span>
            </div>
            <h1 className="font-headline-md text-headline-md text-on-surface mb-2">Something went wrong</h1>
            <p className="text-body-md text-on-surface-variant mb-8">An unexpected error occurred. Please refresh the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-label-md text-label-md font-bold hover:opacity-90 transition-opacity cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

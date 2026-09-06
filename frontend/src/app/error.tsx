// ===========================================
// DealFlow360 - App Error Boundary
// ===========================================
// Catches unhandled errors in the app and displays a user-friendly fallback.
// ===========================================

'use client';

import { useEffect } from 'react';
import { errorLogger, ErrorCode, getUserFriendlyMessage } from '@/lib/errors';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error for debugging
    errorLogger.error('AppError', error, {
      digest: error.digest,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    });
  }, [error]);

  const userMessage = getUserFriendlyMessage(ErrorCode.INTERNAL_ERROR);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg 
            className="w-8 h-8 text-red-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Something went wrong
        </h1>
        <p className="text-slate-600 mb-8">
          {userMessage}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-primary"
          >
            Try Again
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              }
            }}
            className="btn-secondary"
          >
            Go to Home
          </button>
        </div>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left">
            <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-700">
              Technical Details (Development)
            </summary>
            <div className="mt-2 p-4 bg-slate-100 rounded-lg overflow-auto">
              <p className="text-xs font-mono text-red-600 whitespace-pre-wrap break-all">
                {error.message}
              </p>
              {error.stack && (
                <pre className="mt-2 text-xs font-mono text-slate-600 whitespace-pre-wrap break-all">
                  {error.stack}
                </pre>
              )}
              {error.digest && (
                <p className="mt-2 text-xs text-slate-500">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

// ===========================================
// DealFlow360 - Global Error Boundary
// ===========================================
// Catches errors in root layout. Must include its own html/body tags.
// ===========================================

'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log to console since our error logger might not be available
    console.error('[GlobalError] Critical application error:', error);
    console.error('[GlobalError] Error digest:', error.digest);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          padding: '1rem',
        }}>
          <div style={{ maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
            {/* Error Icon */}
            <div style={{
              width: '4rem',
              height: '4rem',
              backgroundColor: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}>
              <svg 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            {/* Error Message */}
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#0f172a',
              marginBottom: '0.5rem',
            }}>
              Application Error
            </h1>
            <p style={{
              color: '#64748b',
              marginBottom: '2rem',
              lineHeight: 1.5,
            }}>
              We apologize for the inconvenience. The application encountered a critical error. 
              Please try refreshing the page.
            </p>

            {/* Actions */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              alignItems: 'center',
            }}>
              <button
                onClick={reset}
                style={{
                  backgroundColor: '#0f172a',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: '200px',
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/';
                  }
                }}
                style={{
                  backgroundColor: 'white',
                  color: '#374151',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: '200px',
                }}
              >
                Go to Home
              </button>
            </div>

            {/* Error ID */}
            {error.digest && (
              <p style={{
                marginTop: '2rem',
                fontSize: '0.75rem',
                color: '#94a3b8',
              }}>
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}

// ===========================================
// DealFlow360 - Error Fallback Component
// ===========================================
// Reusable error display component for inline error states.
// ===========================================

'use client';

import { getUserFriendlyMessage, ErrorCode } from '@/lib/errors';

export interface ErrorFallbackProps {
  /** Error code for looking up user-friendly message */
  code?: string;
  /** Custom error message (overrides code lookup) */
  message?: string;
  /** Error title */
  title?: string;
  /** Callback for retry action */
  onRetry?: () => void;
  /** Label for retry button */
  retryLabel?: string;
  /** Additional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the icon */
  showIcon?: boolean;
  /** Custom class name */
  className?: string;
}

const sizeClasses = {
  sm: {
    container: 'py-6 px-4',
    icon: 'w-10 h-10 mb-3',
    iconSvg: 'w-5 h-5',
    title: 'text-base mb-1',
    message: 'text-sm mb-4',
    button: 'btn-sm',
  },
  md: {
    container: 'py-8 px-4',
    icon: 'w-12 h-12 mb-4',
    iconSvg: 'w-6 h-6',
    title: 'text-lg mb-1',
    message: 'text-sm mb-6',
    button: 'btn-md',
  },
  lg: {
    container: 'py-12 px-4',
    icon: 'w-16 h-16 mb-6',
    iconSvg: 'w-8 h-8',
    title: 'text-xl mb-2',
    message: 'text-base mb-8',
    button: 'btn-md',
  },
};

export function ErrorFallback({
  code,
  message,
  title = 'Something went wrong',
  onRetry,
  retryLabel = 'Try Again',
  action,
  size = 'md',
  showIcon = true,
  className = '',
}: ErrorFallbackProps) {
  const displayMessage = message || getUserFriendlyMessage(code || ErrorCode.UNKNOWN);
  const classes = sizeClasses[size];

  return (
    <div className={`flex flex-col items-center justify-center text-center ${classes.container} ${className}`}>
      {showIcon && (
        <div className={`bg-red-100 rounded-full flex items-center justify-center ${classes.icon}`}>
          <svg 
            className={`text-red-600 ${classes.iconSvg}`}
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
      )}

      <h3 className={`font-semibold text-slate-900 ${classes.title}`}>
        {title}
      </h3>
      
      <p className={`text-slate-600 max-w-sm ${classes.message}`}>
        {displayMessage}
      </p>

      {(onRetry || action) && (
        <div className="flex gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className={`btn-primary ${classes.button}`}
            >
              {retryLabel}
            </button>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className={`btn-secondary ${classes.button}`}
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Inline error message component for forms and smaller UI elements
 */
export interface InlineErrorProps {
  message: string;
  className?: string;
}

export function InlineError({ message, className = '' }: InlineErrorProps) {
  return (
    <div className={`flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <svg 
        className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
      </svg>
      <span className="text-sm text-red-700">{message}</span>
    </div>
  );
}

/**
 * Alert banner for page-level error messages
 */
export interface ErrorBannerProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

export function ErrorBanner({ 
  title,
  message, 
  onDismiss,
  onRetry,
  className = '' 
}: ErrorBannerProps) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <svg 
          className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-semibold text-red-800 mb-1">
              {title}
            </h4>
          )}
          <p className="text-sm text-red-700">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm font-medium text-red-700 underline hover:no-underline"
            >
              Try again
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 text-red-500 hover:text-red-700 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ===========================================
// DealFlow360 - Toast Notification Provider
// ===========================================
// Context provider for showing user-friendly toast notifications.
// Supports success, error, warning, and info types.
// ===========================================

'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { getUserFriendlyMessage, ErrorCode } from '@/lib/errors';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  // Convenience methods
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  // Error-specific methods
  showApiError: (error: { code?: string; message?: string } | string | unknown) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const DEFAULT_DURATION = 5000;
const ERROR_DURATION = 7000;

// Toast icons as SVG components
const ToastIcons = {
  success: (
    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// Toast item component
function ToastItem({ 
  toast, 
  onRemove 
}: { 
  toast: Toast; 
  onRemove: (id: string) => void;
}) {
  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200',
  };

  const textColors = {
    success: 'text-emerald-800',
    error: 'text-red-800',
    warning: 'text-amber-800',
    info: 'text-blue-800',
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        animate-slide-in-right
        ${bgColors[toast.type]}
      `}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex-shrink-0 mt-0.5">
        {ToastIcons[toast.type]}
      </div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className={`text-sm font-semibold ${textColors[toast.type]}`}>
            {toast.title}
          </p>
        )}
        <p className={`text-sm ${textColors[toast.type]} ${toast.title ? 'mt-1' : ''}`}>
          {toast.message}
        </p>
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              onRemove(toast.id);
            }}
            className={`mt-2 text-sm font-medium underline hover:no-underline ${textColors[toast.type]}`}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className={`flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors ${textColors[toast.type]}`}
        aria-label="Dismiss notification"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Toast container component
function ToastContainer({ 
  toasts, 
  onRemove 
}: { 
  toasts: Toast[]; 
  onRemove: (id: string) => void;
}) {
  if (typeof window === 'undefined') return null;
  
  return createPortal(
    <div 
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>,
    document.body
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const duration = toast.duration ?? (toast.type === 'error' ? ERROR_DURATION : DEFAULT_DURATION);
    
    const newToast: Toast = { ...toast, id };
    
    setToasts((prev) => {
      // Limit to 5 toasts max
      const limited = prev.length >= 5 ? prev.slice(1) : prev;
      return [...limited, newToast];
    });
    
    // Auto-remove after duration (unless duration is 0)
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  }, [removeToast]);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((message: string, title?: string) => {
    return addToast({ type: 'success', message, title });
  }, [addToast]);

  const error = useCallback((message: string, title?: string) => {
    return addToast({ type: 'error', message, title });
  }, [addToast]);

  const warning = useCallback((message: string, title?: string) => {
    return addToast({ type: 'warning', message, title });
  }, [addToast]);

  const info = useCallback((message: string, title?: string) => {
    return addToast({ type: 'info', message, title });
  }, [addToast]);

  // Special method for API errors - converts error codes to user-friendly messages
  const showApiError = useCallback((err: { code?: string; message?: string } | string | unknown) => {
    let message: string;
    
    if (typeof err === 'string') {
      message = err;
    } else if (err && typeof err === 'object' && 'code' in err) {
      const apiErr = err as { code?: string; message?: string };
      // Get user-friendly message based on error code
      message = getUserFriendlyMessage(apiErr.code || ErrorCode.UNKNOWN, apiErr.message);
    } else if (err && typeof err === 'object' && 'message' in err) {
      message = (err as { message: string }).message;
    } else {
      message = getUserFriendlyMessage(ErrorCode.UNKNOWN);
    }
    
    return addToast({ type: 'error', message, title: 'Error' });
  }, [addToast]);

  const value = useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
      clearAllToasts,
      success,
      error,
      warning,
      info,
      showApiError,
    }),
    [toasts, addToast, removeToast, clearAllToasts, success, error, warning, info, showApiError]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Singleton for accessing toast outside of React components (e.g., in API client)
let globalToastFunctions: {
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  showApiError: (error: unknown) => string;
} | null = null;

export function setGlobalToastFunctions(functions: typeof globalToastFunctions) {
  globalToastFunctions = functions;
}

export function getGlobalToastFunctions() {
  return globalToastFunctions;
}

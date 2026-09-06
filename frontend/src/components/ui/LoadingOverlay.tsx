'use client';

import { useLoading } from '@/components/providers/LoadingProvider';
import { cn } from '@/lib/utils';

export function LoadingOverlay() {
  const { isLoading, loadingMessage, isGlobalLoaderSuppressed } = useLoading();

  // Don't render if not loading or if a page has its own loader
  if (!isLoading || isGlobalLoaderSuppressed) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <div className="bg-white rounded-xl shadow-xl p-6 flex items-center gap-4 max-w-sm mx-4 animate-slide-up">
        <div className="relative">
          <div className="w-10 h-10 border-4 border-slate-200 rounded-full" />
          <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <div>
          <p className="text-slate-900 font-medium">
            {loadingMessage || 'Loading...'}
          </p>
          <p className="text-slate-500 text-sm mt-0.5">Please wait</p>
        </div>
      </div>
    </div>
  );
}

// Inline loading spinner
export function Spinner({ 
  size = 'md', 
  className 
}: { 
  size?: 'sm' | 'md' | 'lg'; 
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div 
      className={cn(
        'animate-spin rounded-full border-slate-900 border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  );
}

// Page loading skeleton
export function PageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-48 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="h-4 bg-slate-200 rounded w-24 mb-4" />
            <div className="h-8 bg-slate-200 rounded w-20 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-32" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="h-6 bg-slate-200 rounded w-40 mb-4" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-slate-100 rounded mb-3" />
        ))}
      </div>
    </div>
  );
}

// Content loading placeholder
export function LoadingPlaceholder({ 
  message = 'Loading...',
  className 
}: { 
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <Spinner size="lg" />
      <p className="text-slate-500 text-sm mt-4">{message}</p>
    </div>
  );
}

export default LoadingOverlay;

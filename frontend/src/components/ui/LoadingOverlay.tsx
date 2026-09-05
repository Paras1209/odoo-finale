// ===========================================
// DealFlow360 - Global Loading Overlay Component
// ===========================================
// Displays a loading spinner overlay during API calls
// ===========================================

'use client';

import { useLoading } from '@/components/providers/LoadingProvider';

export function LoadingOverlay() {
  const { isLoading, loadingMessage } = useLoading();

  if (!isLoading) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999]"
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 flex items-center gap-4 max-w-sm mx-4">
        <div className="relative">
          <div className="w-10 h-10 border-4 border-indigo-200 rounded-full"></div>
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <div>
          <p className="text-gray-700 font-medium">
            {loadingMessage || 'Loading...'}
          </p>
          <p className="text-gray-500 text-sm mt-0.5">Please wait</p>
        </div>
      </div>
    </div>
  );
}

export default LoadingOverlay;

// ===========================================
// DealFlow360 - Toast Initializer
// ===========================================
// Client component that initializes the global toast functions
// This allows the API client to access toast notifications outside of React
// ===========================================

'use client';

import { useEffect } from 'react';
import { useToast, setGlobalToastFunctions } from './ToastProvider';

export function ToastInitializer() {
  const { success, error, warning, info, showApiError } = useToast();

  useEffect(() => {
    // Set the global toast functions so they can be used outside of React components
    setGlobalToastFunctions({ success, error, warning, info, showApiError });
    
    // Cleanup on unmount
    return () => {
      setGlobalToastFunctions(null);
    };
  }, [success, error, warning, info, showApiError]);

  return null;
}

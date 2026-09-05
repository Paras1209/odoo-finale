// ===========================================
// DealFlow360 - Loading Initializer
// ===========================================
// Client component that initializes the global loading functions
// This allows the API client to access loading state outside of React
// ===========================================

'use client';

import { useEffect } from 'react';
import { useLoading, setGlobalLoadingFunctions } from './LoadingProvider';

export function LoadingInitializer() {
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    // Set the global loading functions so they can be used by the API client
    setGlobalLoadingFunctions(startLoading, stopLoading);
    
    // Cleanup on unmount
    return () => {
      setGlobalLoadingFunctions(() => {}, () => {});
    };
  }, [startLoading, stopLoading]);

  return null;
}

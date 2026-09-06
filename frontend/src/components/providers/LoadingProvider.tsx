// ===========================================
// DealFlow360 - Global Loading Provider
// ===========================================
// Context provider for managing global loading state during API calls
// Pages can suppress the global loader by calling suppressGlobalLoader()
// ===========================================

'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage: string;
  activeRequests: number;
  isGlobalLoaderSuppressed: boolean;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  withLoading: <T>(promise: Promise<T>, message?: string) => Promise<T>;
  suppressGlobalLoader: () => void;
  unsuppressGlobalLoader: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [activeRequests, setActiveRequests] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isGlobalLoaderSuppressed, setIsGlobalLoaderSuppressed] = useState(false);

  const startLoading = useCallback((message?: string) => {
    setActiveRequests((prev) => {
      if (prev === 0 && message) {
        setLoadingMessage(message);
      }
      return prev + 1;
    });
  }, []);

  const stopLoading = useCallback(() => {
    setActiveRequests((prev) => {
      const newCount = Math.max(0, prev - 1);
      if (newCount === 0) {
        setLoadingMessage('');
      }
      return newCount;
    });
  }, []);

  const withLoading = useCallback(
    async <T,>(promise: Promise<T>, message?: string): Promise<T> => {
      startLoading(message);
      try {
        return await promise;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  const suppressGlobalLoader = useCallback(() => {
    setIsGlobalLoaderSuppressed(true);
  }, []);

  const unsuppressGlobalLoader = useCallback(() => {
    setIsGlobalLoaderSuppressed(false);
  }, []);

  const value = useMemo(
    () => ({
      isLoading: activeRequests > 0,
      loadingMessage,
      activeRequests,
      isGlobalLoaderSuppressed,
      startLoading,
      stopLoading,
      withLoading,
      suppressGlobalLoader,
      unsuppressGlobalLoader,
    }),
    [activeRequests, loadingMessage, isGlobalLoaderSuppressed, startLoading, stopLoading, withLoading, suppressGlobalLoader, unsuppressGlobalLoader]
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading(): LoadingContextType {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

// Singleton for accessing loading state outside of React components
let globalStartLoading: ((message?: string) => void) | null = null;
let globalStopLoading: (() => void) | null = null;

export function setGlobalLoadingFunctions(
  start: (message?: string) => void,
  stop: () => void
) {
  globalStartLoading = start;
  globalStopLoading = stop;
}

export function getGlobalLoadingFunctions() {
  return {
    startLoading: globalStartLoading,
    stopLoading: globalStopLoading,
  };
}

/**
 * Hook for pages that have their own loading UI.
 * Suppresses the global loader while the component is mounted.
 * 
 * Usage:
 * ```tsx
 * function MyPage() {
 *   useSuppressGlobalLoader();
 *   // ... page with its own loading state
 * }
 * ```
 */
export function useSuppressGlobalLoader() {
  const { suppressGlobalLoader, unsuppressGlobalLoader } = useLoading();
  
  useEffect(() => {
    suppressGlobalLoader();
    return () => unsuppressGlobalLoader();
  }, [suppressGlobalLoader, unsuppressGlobalLoader]);
}

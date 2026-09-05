// ===========================================
// DealFlow360 - Global Loading Provider
// ===========================================
// Context provider for managing global loading state during API calls
// ===========================================

'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage: string;
  activeRequests: number;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  withLoading: <T>(promise: Promise<T>, message?: string) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [activeRequests, setActiveRequests] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');

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

  const value = useMemo(
    () => ({
      isLoading: activeRequests > 0,
      loadingMessage,
      activeRequests,
      startLoading,
      stopLoading,
      withLoading,
    }),
    [activeRequests, loadingMessage, startLoading, stopLoading, withLoading]
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

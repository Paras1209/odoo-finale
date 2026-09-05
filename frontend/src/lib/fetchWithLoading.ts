// ===========================================
// DealFlow360 - Fetch with Loading Overlay
// ===========================================
// Wrapper for native fetch that integrates with the global loading overlay
// Use this for components that need to use fetch directly
// ===========================================

import { getGlobalLoadingFunctions } from '@/components/providers/LoadingProvider';

export interface FetchWithLoadingOptions extends RequestInit {
  /** Custom loading message to display */
  loadingMessage?: string;
  /** Whether to show loading overlay (default: true) */
  showLoading?: boolean;
}

/**
 * Wrapper for native fetch that automatically shows/hides the loading overlay
 */
export async function fetchWithLoading(
  url: string,
  options: FetchWithLoadingOptions = {}
): Promise<Response> {
  const { showLoading = true, loadingMessage, ...fetchOptions } = options;
  const { startLoading, stopLoading } = getGlobalLoadingFunctions();

  // Start loading overlay
  if (showLoading && startLoading) {
    startLoading(loadingMessage);
  }

  try {
    const response = await fetch(url, fetchOptions);
    return response;
  } finally {
    // Stop loading overlay
    if (showLoading && stopLoading) {
      stopLoading();
    }
  }
}

/**
 * Hook to get a fetch function that's bound to the loading context
 * This can be used directly in components
 */
export function createLoadingFetch() {
  return fetchWithLoading;
}

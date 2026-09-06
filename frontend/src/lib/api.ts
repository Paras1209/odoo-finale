// ===========================================
// DealFlow360 - API Client
// ===========================================
// Base API client for backend communication.
// Includes global loading overlay integration and user-friendly error handling.
// ===========================================

import { getGlobalLoadingFunctions } from '@/components/providers/LoadingProvider';
import { 
  ErrorCode, 
  httpStatusToErrorCode, 
  getUserFriendlyMessage,
  errorLogger,
  formatValidationErrors,
} from '@/lib/errors';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * API response wrapper type
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    userMessage?: string;
    details?: unknown;
  };
}

/**
 * Request options for API calls
 */
export interface RequestOptions {
  /** Custom loading message to display */
  loadingMessage?: string;
  /** Whether to show loading overlay (default: false - pages handle their own loading) */
  showLoading?: boolean;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Custom error message to use instead of the default */
  customErrorMessage?: string;
}

/**
 * API client for making requests to the backend
 */
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private defaultTimeout = 30000;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set the authentication token
   */
  setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    }
  }

  /**
   * Get the current token
   */
  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  /**
   * Create an error response with user-friendly message
   */
  private createErrorResponse<T>(
    code: ErrorCode | string,
    technicalMessage: string,
    customMessage?: string,
    details?: unknown
  ): ApiResponse<T> {
    const userMessage = customMessage || getUserFriendlyMessage(code as ErrorCode, technicalMessage);
    
    return {
      success: false,
      error: {
        code,
        message: technicalMessage,
        userMessage,
        details,
      },
    };
  }

  /**
   * Process API error response and add user-friendly message
   */
  private processErrorResponse<T>(
    data: ApiResponse<T>,
    status: number,
    customMessage?: string
  ): ApiResponse<T> {
    if (!data.error) {
      const code = httpStatusToErrorCode(status);
      return this.createErrorResponse(code, 'Request failed', customMessage);
    }

    // Add user-friendly message if not already present
    const code = data.error.code || httpStatusToErrorCode(status);
    let userMessage = customMessage;
    
    if (!userMessage) {
      // Handle validation errors specially
      if (code === ErrorCode.VALIDATION_ERROR && data.error.details) {
        userMessage = formatValidationErrors(data.error.details as { fieldErrors?: Record<string, string[]>; formErrors?: string[] });
      } else {
        userMessage = getUserFriendlyMessage(code, data.error.message);
      }
    }

    return {
      ...data,
      error: {
        ...data.error,
        code,
        userMessage,
      },
    };
  }

  /**
   * Make a request to the API
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { 
      showLoading = false, 
      loadingMessage, 
      timeout = this.defaultTimeout,
      customErrorMessage,
    } = options;
    const { startLoading, stopLoading } = getGlobalLoadingFunctions();
    
    // Start loading overlay
    if (showLoading && startLoading) {
      startLoading(loadingMessage);
    }

    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Try to parse response as JSON
      let data: ApiResponse<T>;
      try {
        data = await response.json();
      } catch {
        // Response is not valid JSON
        errorLogger.error('API', new Error('Invalid JSON response'), {
          url,
          method,
          status: response.status,
        });
        
        return this.createErrorResponse(
          httpStatusToErrorCode(response.status),
          'Invalid server response',
          customErrorMessage
        );
      }

      if (!response.ok) {
        // Log error for debugging
        errorLogger.error('API', new Error(`API request failed: ${response.status}`), {
          url,
          method,
          status: response.status,
          errorCode: data.error?.code,
        });

        // Handle 401 - clear token and redirect
        if (response.status === 401) {
          this.setToken(null);
        }

        return this.processErrorResponse(data, response.status, customErrorMessage);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Determine error type and create appropriate response
      let code = ErrorCode.NETWORK_ERROR;
      let message = 'Failed to connect to the server';

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          code = ErrorCode.TIMEOUT;
          message = 'Request timed out';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          code = ErrorCode.NETWORK_ERROR;
          message = 'Network connection failed';
        }

        // Log the error
        errorLogger.error('API', error, {
          url,
          method,
          errorType: error.name,
        });
      }

      return this.createErrorResponse(code, message, customErrorMessage);
    } finally {
      // Stop loading overlay
      if (showLoading && stopLoading) {
        stopLoading();
      }
    }
  }

  // HTTP methods
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, body, options);
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, body, options);
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }
}

// Export singleton instance
export const api = new ApiClient(API_URL);

/**
 * Helper function to get the user-friendly error message from an API response
 */
export function getErrorMessage(response: ApiResponse<unknown>): string {
  if (!response.error) {
    return getUserFriendlyMessage(ErrorCode.UNKNOWN);
  }
  return response.error.userMessage || response.error.message || getUserFriendlyMessage(ErrorCode.UNKNOWN);
}

/**
 * Helper function to check if an error is a specific error code
 */
export function isErrorCode(response: ApiResponse<unknown>, code: ErrorCode | string): boolean {
  return response.error?.code === code;
}

// ===========================================
// AUTH API
// ===========================================

export interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  token: string;
}

export interface PortalLoginResponse {
  customer: {
    id: string;
    companyName: string;
    email: string;
    tier: string;
  };
  token: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),

  portalLogin: (email: string, password: string) =>
    api.post<PortalLoginResponse>('/auth/portal/login', { email, password }),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<LoginResponse['user']>('/auth/me'),
};

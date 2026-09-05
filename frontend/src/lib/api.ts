// ===========================================
// DealFlow360 - API Client
// ===========================================
// PHASE 0: Base API client for backend communication.
// Includes global loading overlay integration.
// ===========================================

import { getGlobalLoadingFunctions } from '@/components/providers/LoadingProvider';

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
    details?: unknown;
  };
}

/**
 * Request options for API calls
 */
export interface RequestOptions {
  /** Custom loading message to display */
  loadingMessage?: string;
  /** Whether to show loading overlay (default: true) */
  showLoading?: boolean;
}

/**
 * API client for making requests to the backend
 */
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

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
   * Make a request to the API
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { showLoading = true, loadingMessage } = options;
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

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle 401 - clear token
        if (response.status === 401) {
          this.setToken(null);
        }
        return data as ApiResponse<T>;
      }

      return data as ApiResponse<T>;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to the server',
        },
      };
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

// ===========================================
// DealFlow360 - Shared Types Index
// ===========================================
// PHASE 0: Central export for all shared types.
// Import from '@/shared/types' in your modules.
// ===========================================

// Re-export all enums
export * from './enums.js';

// Re-export all model interfaces
export * from './models.js';

// Re-export all DTOs
export * from './dto.js';

// ===========================================
// ADDITIONAL UTILITY TYPES
// ===========================================

/**
 * JWT Payload for internal users
 */
export interface JWTPayload {
  sub: string;          // User ID
  email: string;
  role: string;
  actorType: 'INTERNAL';
  iat: number;
  exp: number;
}

/**
 * JWT Payload for portal customers
 */
export interface PortalJWTPayload {
  sub: string;          // Customer ID
  email: string;
  tier: string;
  actorType: 'CUSTOMER';
  iat: number;
  exp: number;
}

/**
 * Authenticated request context
 */
export interface AuthContext {
  userId: string;
  email: string;
  role: string;
  actorType: 'INTERNAL' | 'CUSTOMER';
}

/**
 * Express request with auth context
 */
export interface AuthenticatedRequest {
  auth: AuthContext;
}

/**
 * Pagination query params
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Date range filter
 */
export interface DateRangeFilter {
  from?: string;
  to?: string;
}

/**
 * Generic ID param
 */
export interface IdParam {
  id: string;
}

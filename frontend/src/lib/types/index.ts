// ===========================================
// DealFlow360 - Shared Types Index
// ===========================================

// Re-export all enums
export * from './enums';

// Re-export all model interfaces
export * from './models';

// Re-export all DTOs
export * from './dto';

// ===========================================
// ADDITIONAL UTILITY TYPES
// ===========================================

/**
 * Authenticated request context
 */
export interface AuthContext {
  id: string;
  email: string;
  name: string;
  role?: string;
  tier?: string;
  actorType: 'INTERNAL' | 'CUSTOMER';
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

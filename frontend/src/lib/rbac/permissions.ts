// ===========================================
// DealFlow360 - Role-Based Access Control Permissions
// ===========================================
// Centralized permission definitions for all routes.
// This is the single source of truth for authorization.
// ===========================================

import { UserRole, ActorType } from '@/lib/types';

// ===========================================
// PERMISSION TYPES
// ===========================================

/**
 * Actions that can be performed on resources
 */
export type Permission =
  // Quotations
  | 'quotation:view'
  | 'quotation:create'
  | 'quotation:edit'
  | 'quotation:delete'
  | 'quotation:submit'
  | 'quotation:approve'
  | 'quotation:reject'
  // Approvals
  | 'approval:view'
  | 'approval:manage'
  | 'approval:manager'
  | 'approval:finance'
  // Catalog
  | 'catalog:view'
  | 'catalog:manage'
  | 'pricelist:view'
  | 'pricelist:manage'
  // Fulfillment
  | 'fulfillment:view'
  | 'fulfillment:manage'
  | 'warehouse:view'
  | 'warehouse:manage'
  // Billing
  | 'billing:view'
  | 'billing:manage'
  | 'invoice:view'
  | 'invoice:create'
  // Subscriptions
  | 'subscription:view'
  | 'subscription:manage'
  // Reports & Analytics
  | 'reports:view'
  | 'deal-health:view'
  // Admin
  | 'admin:access'
  | 'admin:users'
  | 'admin:settings'
  // Dashboard
  | 'dashboard:view';

/**
 * Route access configuration
 */
export interface RouteConfig {
  /** Path pattern (supports wildcards) */
  path: string;
  /** Required permissions (OR logic - user needs at least one) */
  permissions?: Permission[];
  /** Required roles (OR logic - user needs at least one) */
  roles?: UserRole[];
  /** Actor type required */
  actorType?: ActorType;
  /** If true, route is public (no auth required) */
  public?: boolean;
  /** Description for documentation */
  description?: string;
}

// ===========================================
// ROLE-PERMISSION MAPPINGS
// ===========================================

/**
 * Maps each role to its granted permissions.
 * Permissions are additive - higher roles include lower role permissions.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SALES_REP]: [
    'dashboard:view',
    'quotation:view',
    'quotation:create',
    'quotation:edit',
    'quotation:delete',
    'quotation:submit',
    'catalog:view',
    'pricelist:view',
    'fulfillment:view',
    'subscription:view',
    'billing:view',
    'invoice:view',
  ],
  
  [UserRole.SALES_MANAGER]: [
    // Inherits SALES_REP permissions
    'dashboard:view',
    'quotation:view',
    'quotation:create',
    'quotation:edit',
    'quotation:delete',
    'quotation:submit',
    'quotation:approve',
    'quotation:reject',
    'approval:view',
    'approval:manage',
    'approval:manager',
    'catalog:view',
    'pricelist:view',
    'fulfillment:view',
    'fulfillment:manage',
    'warehouse:view',
    'subscription:view',
    'subscription:manage',
    'billing:view',
    'invoice:view',
    'invoice:create',
    'reports:view',
    'deal-health:view',
  ],
  
  [UserRole.FINANCE_OPS]: [
    'dashboard:view',
    'quotation:view',
    'quotation:approve',
    'quotation:reject',
    'approval:view',
    'approval:manage',
    'approval:finance',
    'catalog:view',
    'pricelist:view',
    'pricelist:manage',
    'fulfillment:view',
    'billing:view',
    'billing:manage',
    'invoice:view',
    'invoice:create',
    'subscription:view',
    'subscription:manage',
    'reports:view',
    'deal-health:view',
  ],
  
  [UserRole.ADMIN]: [
    // Full access to everything
    'dashboard:view',
    'quotation:view',
    'quotation:create',
    'quotation:edit',
    'quotation:delete',
    'quotation:submit',
    'quotation:approve',
    'quotation:reject',
    'approval:view',
    'approval:manage',
    'approval:manager',
    'approval:finance',
    'catalog:view',
    'catalog:manage',
    'pricelist:view',
    'pricelist:manage',
    'fulfillment:view',
    'fulfillment:manage',
    'warehouse:view',
    'warehouse:manage',
    'billing:view',
    'billing:manage',
    'invoice:view',
    'invoice:create',
    'subscription:view',
    'subscription:manage',
    'reports:view',
    'deal-health:view',
    'admin:access',
    'admin:users',
    'admin:settings',
  ],
};

// ===========================================
// ROUTE CONFIGURATIONS
// ===========================================

/**
 * Protected routes configuration.
 * Routes are matched in order - first match wins.
 * Use more specific patterns before wildcards.
 */
export const ROUTE_CONFIGS: RouteConfig[] = [
  // ============ PUBLIC ROUTES ============
  { path: '/auth/**', public: true, description: 'Auth pages' },
  { path: '/portal/login', public: true, description: 'Portal login' },
  { path: '/api/auth/**', public: true, description: 'Auth API routes' },
  
  // ============ ADMIN ROUTES ============
  {
    path: '/workspace/admin/**',
    permissions: ['admin:access'],
    roles: [UserRole.ADMIN],
    actorType: ActorType.INTERNAL,
    description: 'Admin section - Admin only',
  },
  {
    path: '/api/admin/**',
    permissions: ['admin:access'],
    roles: [UserRole.ADMIN],
    actorType: ActorType.INTERNAL,
    description: 'Admin API routes',
  },
  
  // ============ APPROVAL ROUTES ============
  {
    path: '/workspace/approvals/**',
    permissions: ['approval:view'],
    roles: [UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN],
    actorType: ActorType.INTERNAL,
    description: 'Approval management',
  },
  {
    path: '/api/approval/**',
    permissions: ['approval:view'],
    roles: [UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN],
    actorType: ActorType.INTERNAL,
    description: 'Approval API routes',
  },
  
  // ============ CATALOG ROUTES ============
  {
    path: '/workspace/catalog/price-lists/**',
    permissions: ['pricelist:view'],
    actorType: ActorType.INTERNAL,
    description: 'Price list management',
  },
  {
    path: '/workspace/catalog/**',
    permissions: ['catalog:view'],
    actorType: ActorType.INTERNAL,
    description: 'Catalog browsing',
  },
  {
    path: '/api/catalog/**',
    permissions: ['catalog:view'],
    actorType: ActorType.INTERNAL,
    description: 'Catalog API routes',
  },
  {
    path: '/api/products/**',
    permissions: ['catalog:view'],
    actorType: ActorType.INTERNAL,
    description: 'Products API routes',
  },
  {
    path: '/api/price-lists/**',
    permissions: ['pricelist:view'],
    actorType: ActorType.INTERNAL,
    description: 'Price lists API routes',
  },
  
  // ============ FULFILLMENT ROUTES ============
  {
    path: '/workspace/fulfillment/warehouses/**',
    permissions: ['warehouse:view'],
    roles: [UserRole.SALES_MANAGER, UserRole.ADMIN],
    actorType: ActorType.INTERNAL,
    description: 'Warehouse management',
  },
  {
    path: '/workspace/fulfillment/**',
    permissions: ['fulfillment:view'],
    actorType: ActorType.INTERNAL,
    description: 'Fulfillment management',
  },
  {
    path: '/api/fulfillment/**',
    permissions: ['fulfillment:view'],
    actorType: ActorType.INTERNAL,
    description: 'Fulfillment API routes',
  },
  {
    path: '/api/warehouses/**',
    permissions: ['warehouse:view'],
    roles: [UserRole.SALES_MANAGER, UserRole.ADMIN],
    actorType: ActorType.INTERNAL,
    description: 'Warehouse API routes',
  },
  
  // ============ BILLING ROUTES ============
  {
    path: '/workspace/billing/**',
    permissions: ['billing:view'],
    actorType: ActorType.INTERNAL,
    description: 'Billing management',
  },
  {
    path: '/workspace/invoices/**',
    permissions: ['invoice:view'],
    actorType: ActorType.INTERNAL,
    description: 'Invoice management',
  },
  {
    path: '/api/billing/**',
    permissions: ['billing:view'],
    actorType: ActorType.INTERNAL,
    description: 'Billing API routes',
  },
  {
    path: '/api/invoices/**',
    permissions: ['invoice:view'],
    actorType: ActorType.INTERNAL,
    description: 'Invoice API routes',
  },
  
  // ============ REPORTS ROUTES ============
  {
    path: '/workspace/reports/**',
    permissions: ['reports:view'],
    roles: [UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN],
    actorType: ActorType.INTERNAL,
    description: 'Reports and analytics',
  },
  {
    path: '/workspace/deal-health/**',
    permissions: ['deal-health:view'],
    roles: [UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN],
    actorType: ActorType.INTERNAL,
    description: 'Deal health dashboard',
  },
  {
    path: '/api/reports/**',
    permissions: ['reports:view'],
    roles: [UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN],
    actorType: ActorType.INTERNAL,
    description: 'Reports API routes',
  },
  
  // ============ SUBSCRIPTION ROUTES ============
  {
    path: '/workspace/subscriptions/**',
    permissions: ['subscription:view'],
    actorType: ActorType.INTERNAL,
    description: 'Subscription management',
  },
  {
    path: '/api/subscriptions/**',
    permissions: ['subscription:view'],
    actorType: ActorType.INTERNAL,
    description: 'Subscriptions API routes',
  },
  
  // ============ QUOTATION ROUTES ============
  {
    path: '/workspace/quotations/**',
    permissions: ['quotation:view'],
    actorType: ActorType.INTERNAL,
    description: 'Quotation management',
  },
  {
    path: '/api/quotations/**',
    permissions: ['quotation:view'],
    actorType: ActorType.INTERNAL,
    description: 'Quotations API routes',
  },
  
  // ============ PORTAL ROUTES ============
  {
    path: '/portal/**',
    actorType: ActorType.CUSTOMER,
    description: 'Customer portal',
  },
  {
    path: '/api/portal/**',
    actorType: ActorType.CUSTOMER,
    description: 'Portal API routes',
  },
  
  // ============ WORKSPACE DEFAULT ============
  {
    path: '/workspace/**',
    permissions: ['dashboard:view'],
    actorType: ActorType.INTERNAL,
    description: 'Default workspace access',
  },
  {
    path: '/workspace',
    permissions: ['dashboard:view'],
    actorType: ActorType.INTERNAL,
    description: 'Workspace dashboard',
  },
];

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Converts a route pattern to a regex for matching
 */
export function patternToRegex(pattern: string): RegExp {
  // Escape special regex characters except * 
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '.*')  // ** matches any characters including /
    .replace(/\*/g, '[^/]*'); // * matches any characters except /
  
  return new RegExp(`^${escaped}$`);
}

/**
 * Finds the route configuration for a given path
 */
export function findRouteConfig(path: string): RouteConfig | null {
  for (const config of ROUTE_CONFIGS) {
    const regex = patternToRegex(config.path);
    if (regex.test(path)) {
      return config;
    }
  }
  return null;
}

/**
 * Checks if a user has the required permission
 */
export function hasPermission(
  userRole: UserRole | undefined,
  requiredPermission: Permission
): boolean {
  if (!userRole) return false;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(requiredPermission);
}

/**
 * Checks if a user has any of the required permissions
 */
export function hasAnyPermission(
  userRole: UserRole | undefined,
  requiredPermissions: Permission[]
): boolean {
  if (!userRole) return false;
  if (requiredPermissions.length === 0) return true;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return requiredPermissions.some(p => permissions.includes(p));
}

/**
 * Checks if a user has the required role
 */
export function hasRole(
  userRole: UserRole | undefined,
  requiredRoles: UserRole[]
): boolean {
  if (!userRole) return false;
  if (requiredRoles.length === 0) return true;
  return requiredRoles.includes(userRole);
}

/**
 * Gets all permissions for a given role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Checks if a route is accessible by a user
 */
export function canAccessRoute(
  path: string,
  user: { role?: UserRole; actorType?: ActorType } | null
): { allowed: boolean; reason?: string } {
  const config = findRouteConfig(path);
  
  // No config means no protection (allow by default for undefined routes)
  if (!config) {
    return { allowed: true };
  }
  
  // Public routes are always accessible
  if (config.public) {
    return { allowed: true };
  }
  
  // No user means unauthorized
  if (!user) {
    return { allowed: false, reason: 'Authentication required' };
  }
  
  // Check actor type if specified
  if (config.actorType && user.actorType !== config.actorType) {
    return { 
      allowed: false, 
      reason: `This route is for ${config.actorType === ActorType.INTERNAL ? 'internal users' : 'portal customers'} only` 
    };
  }
  
  // Check roles if specified (OR logic)
  if (config.roles && config.roles.length > 0) {
    if (!hasRole(user.role, config.roles)) {
      return { allowed: false, reason: 'Insufficient role privileges' };
    }
  }
  
  // Check permissions if specified (OR logic)
  if (config.permissions && config.permissions.length > 0) {
    if (!hasAnyPermission(user.role, config.permissions)) {
      return { allowed: false, reason: 'Insufficient permissions' };
    }
  }
  
  return { allowed: true };
}

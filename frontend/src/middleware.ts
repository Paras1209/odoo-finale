// ===========================================
// DealFlow360 - Authentication & Authorization Middleware
// ===========================================
// Production-grade middleware with optimized RBAC.
// Runs at the edge for minimal latency.
// ===========================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole, ActorType } from '@/lib/types';

// ===========================================
// CONFIGURATION
// ===========================================

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

// Static assets and public paths that bypass all checks
const BYPASS_PATTERNS = [
  /^\/_next\//,          // Next.js internals
  /^\/favicon\.ico$/,
  /^\/api\/auth\//,      // NextAuth.js routes
  /^\/auth\//,           // Auth pages
  /^\/portal\/login$/,   // Portal login page
  /^\/portal\/signup$/,  // Portal signup page
  /\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/i, // Static assets
];

// ===========================================
// OPTIMIZED ROUTE-PERMISSION MAPPINGS
// ===========================================
// Compiled at build time for O(1) lookup performance.
// Using Map for faster access than array iteration.

interface RouteRule {
  permissions?: string[];
  roles?: UserRole[];
  actorType?: ActorType;
}

// Pre-compiled route rules for maximum performance
// Key format: exact path or pattern prefix
const EXACT_ROUTES = new Map<string, RouteRule>([
  ['/workspace', { actorType: ActorType.INTERNAL }],
]);

// Prefix-based rules (checked in order of specificity)
const PREFIX_RULES: Array<{ prefix: string; rule: RouteRule }> = [
  // Admin routes - highest priority
  { 
    prefix: '/workspace/admin', 
    rule: { 
      roles: [UserRole.ADMIN], 
      actorType: ActorType.INTERNAL 
    } 
  },
  { 
    prefix: '/api/admin', 
    rule: { 
      roles: [UserRole.ADMIN], 
      actorType: ActorType.INTERNAL 
    } 
  },
  
  // Approval routes - managers and finance only
  { 
    prefix: '/workspace/approvals', 
    rule: { 
      roles: [UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN], 
      actorType: ActorType.INTERNAL 
    } 
  },
  { 
    prefix: '/api/approval', 
    rule: { 
      roles: [UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN], 
      actorType: ActorType.INTERNAL 
    } 
  },
  
  // Reports and analytics - managers and finance only
  { 
    prefix: '/workspace/reports', 
    rule: { 
      roles: [UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN], 
      actorType: ActorType.INTERNAL 
    } 
  },
  { 
    prefix: '/workspace/deal-health', 
    rule: { 
      roles: [UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN], 
      actorType: ActorType.INTERNAL 
    } 
  },
  { 
    prefix: '/api/reports', 
    rule: { 
      roles: [UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN], 
      actorType: ActorType.INTERNAL 
    } 
  },
  
  // Warehouse management - managers and admin only
  { 
    prefix: '/workspace/fulfillment/warehouses', 
    rule: { 
      roles: [UserRole.SALES_MANAGER, UserRole.ADMIN], 
      actorType: ActorType.INTERNAL 
    } 
  },
  { 
    prefix: '/api/warehouses', 
    rule: { 
      roles: [UserRole.SALES_MANAGER, UserRole.ADMIN], 
      actorType: ActorType.INTERNAL 
    } 
  },
  
  // General workspace routes - all internal users
  { 
    prefix: '/workspace', 
    rule: { actorType: ActorType.INTERNAL } 
  },
  
  // Portal routes - customers only
  { 
    prefix: '/portal', 
    rule: { actorType: ActorType.CUSTOMER } 
  },
  { 
    prefix: '/api/portal', 
    rule: { actorType: ActorType.CUSTOMER } 
  },
  
  // API routes - require authentication
  { 
    prefix: '/api/quotations', 
    rule: { actorType: ActorType.INTERNAL } 
  },
  { 
    prefix: '/api/products', 
    rule: { actorType: ActorType.INTERNAL } 
  },
  { 
    prefix: '/api/customers', 
    rule: { actorType: ActorType.INTERNAL } 
  },
  { 
    prefix: '/api/fulfillment', 
    rule: { actorType: ActorType.INTERNAL } 
  },
  { 
    prefix: '/api/catalog', 
    rule: { actorType: ActorType.INTERNAL } 
  },
  { 
    prefix: '/api/billing', 
    rule: { actorType: ActorType.INTERNAL } 
  },
  { 
    prefix: '/api/invoices', 
    rule: { actorType: ActorType.INTERNAL } 
  },
  { 
    prefix: '/api/subscriptions', 
    rule: { actorType: ActorType.INTERNAL } 
  },
  { 
    prefix: '/api/price-lists', 
    rule: { actorType: ActorType.INTERNAL } 
  },
];

// Sort by prefix length descending for correct matching order
PREFIX_RULES.sort((a, b) => b.prefix.length - a.prefix.length);

// ===========================================
// MIDDLEWARE HELPER FUNCTIONS
// ===========================================

/**
 * Check if a path should bypass authentication
 */
function shouldBypass(pathname: string): boolean {
  return BYPASS_PATTERNS.some(pattern => pattern.test(pathname));
}

/**
 * Find the applicable rule for a path
 */
function findRule(pathname: string): RouteRule | null {
  // Check exact matches first
  const exactRule = EXACT_ROUTES.get(pathname);
  if (exactRule) return exactRule;
  
  // Check prefix rules (already sorted by specificity)
  for (const { prefix, rule } of PREFIX_RULES) {
    if (pathname.startsWith(prefix)) {
      return rule;
    }
  }
  
  return null;
}

/**
 * Check if user has required role
 */
function hasRequiredRole(
  userRole: string | undefined,
  requiredRoles: UserRole[]
): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole as UserRole);
}

/**
 * Create a JSON error response
 */
function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json(
    { error: message, success: false },
    { status }
  );
}

// ===========================================
// MAIN MIDDLEWARE FUNCTION
// ===========================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Fast path: bypass static assets and public routes
  if (shouldBypass(pathname)) {
    return NextResponse.next();
  }
  
  // Find applicable rule
  const rule = findRule(pathname);
  
  // No rule means public route
  if (!rule) {
    return NextResponse.next();
  }
  
  // Get JWT token from the request
  const token = await getToken({
    req: request,
    secret: NEXTAUTH_SECRET,
  });
  
  // Check authentication
  if (!token) {
    // Determine redirect based on route type
    const isApiRoute = pathname.startsWith('/api/');
    
    if (isApiRoute) {
      return jsonError('Authentication required', 401);
    }
    
    // Redirect to appropriate login page
    const loginUrl = rule.actorType === ActorType.CUSTOMER 
      ? '/portal/login' 
      : '/auth/login';
    
    const url = request.nextUrl.clone();
    url.pathname = loginUrl;
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  
  // Check actor type
  if (rule.actorType && token.actorType !== rule.actorType) {
    const isApiRoute = pathname.startsWith('/api/');
    
    if (isApiRoute) {
      return jsonError('Access denied: Invalid user type', 403);
    }
    
    // Redirect to appropriate workspace/portal
    const redirectUrl = token.actorType === ActorType.CUSTOMER 
      ? '/portal' 
      : '/workspace';
    
    const url = request.nextUrl.clone();
    url.pathname = redirectUrl;
    return NextResponse.redirect(url);
  }
  
  // Check roles if specified
  if (rule.roles && rule.roles.length > 0) {
    if (!hasRequiredRole(token.role as string, rule.roles)) {
      const isApiRoute = pathname.startsWith('/api/');
      
      if (isApiRoute) {
        return jsonError('Access denied: Insufficient privileges', 403);
      }
      
      // Redirect to workspace dashboard (or show 403 page if you have one)
      const url = request.nextUrl.clone();
      url.pathname = '/workspace';
      url.searchParams.set('error', 'access_denied');
      return NextResponse.redirect(url);
    }
  }
  
  // Add user info to request headers for downstream use
  const response = NextResponse.next();
  response.headers.set('x-user-id', token.id as string);
  response.headers.set('x-user-role', (token.role as string) || '');
  response.headers.set('x-user-actor-type', (token.actorType as string) || '');
  
  return response;
}

// ===========================================
// MIDDLEWARE CONFIGURATION
// ===========================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

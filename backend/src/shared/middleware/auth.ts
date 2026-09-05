// ===========================================
// DealFlow360 - Authentication Middleware
// ===========================================
// PHASE 0: JWT authentication for both internal users and portal customers.
// This file is FROZEN after Phase 0 - do not modify individually.
// ===========================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserRole, ActorType } from '../types/index.js';

// ===========================================
// TYPE DEFINITIONS
// ===========================================

/**
 * JWT payload for internal users
 */
export interface InternalJWTPayload {
  sub: string;          // User ID
  email: string;
  name: string;
  role: UserRole;
  actorType: ActorType.INTERNAL;
  iat?: number;
  exp?: number;
}

/**
 * JWT payload for portal customers
 */
export interface PortalJWTPayload {
  sub: string;          // Customer ID
  email: string;
  name: string;
  tier: string;
  actorType: ActorType.CUSTOMER;
  iat?: number;
  exp?: number;
}

/**
 * Combined auth context available on authenticated requests
 */
export interface AuthContext {
  id: string;
  email: string;
  name: string;
  actorType: ActorType;
  role?: UserRole;      // Only for internal users
  tier?: string;        // Only for portal customers
}

/**
 * Extended Express Request with auth context
 */
export interface AuthenticatedRequest extends Request {
  auth: AuthContext;
}

// ===========================================
// JWT TOKEN FUNCTIONS
// ===========================================

/**
 * Generate JWT token for internal users
 */
export function generateInternalToken(payload: Omit<InternalJWTPayload, 'iat' | 'exp' | 'actorType'>): string {
  const tokenPayload: InternalJWTPayload = {
    ...payload,
    actorType: ActorType.INTERNAL,
  };
  
  return jwt.sign(tokenPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Generate JWT token for portal customers
 */
export function generatePortalToken(payload: Omit<PortalJWTPayload, 'iat' | 'exp' | 'actorType'>): string {
  const tokenPayload: PortalJWTPayload = {
    ...payload,
    actorType: ActorType.CUSTOMER,
  };
  
  return jwt.sign(tokenPayload, env.PORTAL_JWT_SECRET, {
    expiresIn: env.PORTAL_JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Verify internal user JWT token
 */
export function verifyInternalToken(token: string): InternalJWTPayload {
  return jwt.verify(token, env.JWT_SECRET) as InternalJWTPayload;
}

/**
 * Verify portal customer JWT token
 */
export function verifyPortalToken(token: string): PortalJWTPayload {
  return jwt.verify(token, env.PORTAL_JWT_SECRET) as PortalJWTPayload;
}

/**
 * Calculate token expiration date
 */
export function getTokenExpiration(expiresIn: string): Date {
  const now = new Date();
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  
  if (!match) {
    // Default to 7 days if format not recognized
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return new Date(now.getTime() + value * 1000);
    case 'm': return new Date(now.getTime() + value * 60 * 1000);
    case 'h': return new Date(now.getTime() + value * 60 * 60 * 1000);
    case 'd': return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
}

// ===========================================
// AUTHENTICATION MIDDLEWARE
// ===========================================

/**
 * Extract Bearer token from Authorization header
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7);
}

/**
 * Middleware to authenticate internal users
 * Use this for internal workspace routes
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  
  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }
  
  try {
    const payload = verifyInternalToken(token);
    
    // Attach auth context to request
    (req as AuthenticatedRequest).auth = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      actorType: ActorType.INTERNAL,
      role: payload.role,
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired',
        },
      });
      return;
    }
    
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
    });
  }
}

/**
 * Middleware to authenticate portal customers
 * Use this for customer portal routes
 */
export function requirePortalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  
  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Portal authentication required',
      },
    });
    return;
  }
  
  try {
    const payload = verifyPortalToken(token);
    
    // Attach auth context to request
    (req as AuthenticatedRequest).auth = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      actorType: ActorType.CUSTOMER,
      tier: payload.tier,
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Portal token has expired',
        },
      });
      return;
    }
    
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid portal authentication token',
      },
    });
  }
}

/**
 * Middleware to authenticate either internal users OR portal customers
 * Use this for routes accessible by both (with different permissions)
 */
export function requireAnyAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  
  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }
  
  // Try internal token first
  try {
    const payload = verifyInternalToken(token);
    (req as AuthenticatedRequest).auth = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      actorType: ActorType.INTERNAL,
      role: payload.role,
    };
    next();
    return;
  } catch {
    // Not an internal token, try portal
  }
  
  // Try portal token
  try {
    const payload = verifyPortalToken(token);
    (req as AuthenticatedRequest).auth = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      actorType: ActorType.CUSTOMER,
      tier: payload.tier,
    };
    next();
    return;
  } catch {
    // Not a valid token
  }
  
  res.status(401).json({
    success: false,
    error: {
      code: 'INVALID_TOKEN',
      message: 'Invalid authentication token',
    },
  });
}

// ===========================================
// ROLE-BASED ACCESS CONTROL
// ===========================================

/**
 * Middleware factory to require specific roles
 * @param allowedRoles - Array of roles that are allowed access
 * @example
 * router.post('/approve', requireAuth, requireRole([UserRole.SALES_MANAGER, UserRole.FINANCE_OPS]), handler);
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.auth) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }
    
    // Portal customers cannot access role-protected routes
    if (authReq.auth.actorType === ActorType.CUSTOMER) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Internal access only',
        },
      });
      return;
    }
    
    const userRole = authReq.auth.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Required role: ${allowedRoles.join(' or ')}`,
        },
      });
      return;
    }
    
    next();
  };
}

/**
 * Middleware to require ADMIN role
 */
export const requireAdmin = requireRole([UserRole.ADMIN]);

/**
 * Middleware to require SALES_MANAGER or higher
 */
export const requireManager = requireRole([UserRole.SALES_MANAGER, UserRole.ADMIN]);

/**
 * Middleware to require FINANCE_OPS or higher
 */
export const requireFinance = requireRole([UserRole.FINANCE_OPS, UserRole.ADMIN]);

/**
 * Middleware to require approval capabilities (manager or finance)
 */
export const requireApprover = requireRole([UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN]);

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get the authenticated user context from request
 * Throws if not authenticated
 */
export function getAuthContext(req: Request): AuthContext {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.auth) {
    throw new Error('Not authenticated');
  }
  
  return authReq.auth;
}

/**
 * Check if the authenticated user is an internal user
 */
export function isInternalUser(req: Request): boolean {
  const authReq = req as AuthenticatedRequest;
  return authReq.auth?.actorType === ActorType.INTERNAL;
}

/**
 * Check if the authenticated user is a portal customer
 */
export function isPortalCustomer(req: Request): boolean {
  const authReq = req as AuthenticatedRequest;
  return authReq.auth?.actorType === ActorType.CUSTOMER;
}

/**
 * Check if the authenticated user has a specific role
 */
export function hasRole(req: Request, role: UserRole): boolean {
  const authReq = req as AuthenticatedRequest;
  return authReq.auth?.role === role;
}

/**
 * Check if the authenticated user has any of the specified roles
 */
export function hasAnyRole(req: Request, roles: UserRole[]): boolean {
  const authReq = req as AuthenticatedRequest;
  return authReq.auth?.role !== undefined && roles.includes(authReq.auth.role);
}

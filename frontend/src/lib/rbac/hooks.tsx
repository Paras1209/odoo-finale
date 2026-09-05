// ===========================================
// DealFlow360 - Client-Side RBAC Hooks
// ===========================================
// React hooks for role-based access control.
// Optimized with memoization for minimal re-renders.
// ===========================================

'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo, useEffect, createContext, useContext, ReactNode } from 'react';
import { UserRole, ActorType } from '@/lib/types';
import {
  Permission,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasRole,
  canAccessRoute,
} from './permissions';

// ===========================================
// AUTH CONTEXT
// ===========================================

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
  tier?: string;
  actorType: ActorType;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInternal: boolean;
  isCustomer: boolean;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
  canAccess: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ===========================================
// AUTH PROVIDER
// ===========================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && !!session?.user;
  
  const user = useMemo((): AuthUser | null => {
    if (!session?.user) return null;
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      tier: session.user.tier,
      actorType: session.user.actorType,
    };
  }, [session?.user]);
  
  const isInternal = useMemo(() => {
    return user?.actorType === ActorType.INTERNAL;
  }, [user?.actorType]);
  
  const isCustomer = useMemo(() => {
    return user?.actorType === ActorType.CUSTOMER;
  }, [user?.actorType]);
  
  // Memoized permission check
  const checkPermission = useCallback((permission: Permission): boolean => {
    if (!user?.role) return false;
    return hasPermission(user.role, permission);
  }, [user?.role]);
  
  // Memoized multi-permission check
  const checkAnyPermission = useCallback((permissions: Permission[]): boolean => {
    if (!user?.role) return false;
    return hasAnyPermission(user.role, permissions);
  }, [user?.role]);
  
  // Memoized role check
  const checkRole = useCallback((roles: UserRole[]): boolean => {
    if (!user?.role) return false;
    return hasRole(user.role, roles);
  }, [user?.role]);
  
  // Memoized route access check
  const canAccess = useCallback((path: string): boolean => {
    const result = canAccessRoute(path, user);
    return result.allowed;
  }, [user]);
  
  // Logout function
  const logout = useCallback(async () => {
    await signOut({ 
      callbackUrl: isCustomer ? '/portal/login' : '/auth/login',
      redirect: true,
    });
  }, [isCustomer]);
  
  const contextValue = useMemo((): AuthContextType => ({
    user,
    isLoading,
    isAuthenticated,
    isInternal,
    isCustomer,
    logout,
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasRole: checkRole,
    canAccess,
  }), [
    user,
    isLoading,
    isAuthenticated,
    isInternal,
    isCustomer,
    logout,
    checkPermission,
    checkAnyPermission,
    checkRole,
    canAccess,
  ]);
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// ===========================================
// AUTH HOOK
// ===========================================

/**
 * Main hook for authentication and authorization.
 * Provides user info, permissions checking, and logout.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// ===========================================
// SPECIALIZED HOOKS
// ===========================================

/**
 * Hook to check if the current user has a specific permission.
 * Optimized for use in conditional rendering.
 */
export function usePermission(permission: Permission): boolean {
  const { hasPermission, isLoading } = useAuth();
  return useMemo(() => {
    if (isLoading) return false;
    return hasPermission(permission);
  }, [hasPermission, permission, isLoading]);
}

/**
 * Hook to check if the current user has any of the specified permissions.
 */
export function useAnyPermission(permissions: Permission[]): boolean {
  const { hasAnyPermission, isLoading } = useAuth();
  return useMemo(() => {
    if (isLoading) return false;
    return hasAnyPermission(permissions);
  }, [hasAnyPermission, permissions, isLoading]);
}

/**
 * Hook to check if the current user has a specific role.
 */
export function useRole(role: UserRole): boolean {
  const { user, isLoading } = useAuth();
  return useMemo(() => {
    if (isLoading || !user?.role) return false;
    return user.role === role;
  }, [user?.role, role, isLoading]);
}

/**
 * Hook to check if the current user has any of the specified roles.
 */
export function useAnyRole(roles: UserRole[]): boolean {
  const { hasRole, isLoading } = useAuth();
  return useMemo(() => {
    if (isLoading) return false;
    return hasRole(roles);
  }, [hasRole, roles, isLoading]);
}

/**
 * Hook to get all permissions for the current user.
 * Useful for debugging and permission displays.
 */
export function usePermissions(): Permission[] {
  const { user } = useAuth();
  return useMemo(() => {
    if (!user?.role) return [];
    return ROLE_PERMISSIONS[user.role] || [];
  }, [user?.role]);
}

/**
 * Hook that redirects if user doesn't have required permission.
 * Useful for protecting entire pages.
 */
export function useRequirePermission(
  permission: Permission,
  redirectTo: string = '/workspace'
): { isAuthorized: boolean; isLoading: boolean } {
  const { hasPermission, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const isAuthorized = useMemo(() => {
    if (isLoading) return false;
    if (!isAuthenticated) return false;
    return hasPermission(permission);
  }, [hasPermission, permission, isLoading, isAuthenticated]);
  
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAuthorized) {
      router.replace(redirectTo);
    }
  }, [isLoading, isAuthenticated, isAuthorized, router, redirectTo]);
  
  return { isAuthorized, isLoading };
}

/**
 * Hook that redirects if user doesn't have any of the required roles.
 */
export function useRequireRole(
  roles: UserRole[],
  redirectTo: string = '/workspace'
): { isAuthorized: boolean; isLoading: boolean } {
  const { hasRole, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const isAuthorized = useMemo(() => {
    if (isLoading) return false;
    if (!isAuthenticated) return false;
    return hasRole(roles);
  }, [hasRole, roles, isLoading, isAuthenticated]);
  
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAuthorized) {
      router.replace(redirectTo);
    }
  }, [isLoading, isAuthenticated, isAuthorized, router, redirectTo]);
  
  return { isAuthorized, isLoading };
}

// ===========================================
// ROLE-SPECIFIC HOOKS
// ===========================================

export function useIsAdmin(): boolean {
  return useRole(UserRole.ADMIN);
}

export function useIsManager(): boolean {
  return useAnyRole([UserRole.SALES_MANAGER, UserRole.ADMIN]);
}

export function useIsFinance(): boolean {
  return useAnyRole([UserRole.FINANCE_OPS, UserRole.ADMIN]);
}

export function useIsApprover(): boolean {
  return useAnyRole([UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN]);
}

export function useIsSalesRep(): boolean {
  return useRole(UserRole.SALES_REP);
}

// ===========================================
// PERMISSION-BASED COMPONENT HELPERS
// ===========================================

interface CanProps {
  permission?: Permission;
  permissions?: Permission[];
  role?: UserRole;
  roles?: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on permissions/roles.
 * Supports both single and multiple permission/role checks.
 */
export function Can({ 
  permission, 
  permissions, 
  role, 
  roles, 
  children, 
  fallback = null 
}: CanProps): ReactNode {
  const { hasPermission, hasAnyPermission, hasRole, isLoading } = useAuth();
  
  const isAllowed = useMemo(() => {
    if (isLoading) return false;
    
    // Check single permission
    if (permission && !hasPermission(permission)) {
      return false;
    }
    
    // Check multiple permissions (OR logic)
    if (permissions && permissions.length > 0 && !hasAnyPermission(permissions)) {
      return false;
    }
    
    // Check single role
    if (role && !hasRole([role])) {
      return false;
    }
    
    // Check multiple roles (OR logic)
    if (roles && roles.length > 0 && !hasRole(roles)) {
      return false;
    }
    
    return true;
  }, [permission, permissions, role, roles, hasPermission, hasAnyPermission, hasRole, isLoading]);
  
  if (isLoading) {
    return fallback;
  }
  
  return isAllowed ? children : fallback;
}

/**
 * Component that renders children only for admin users.
 */
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }): ReactNode {
  return <Can role={UserRole.ADMIN} fallback={fallback}>{children}</Can>;
}

/**
 * Component that renders children only for managers (includes admin).
 */
export function ManagerOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }): ReactNode {
  return <Can roles={[UserRole.SALES_MANAGER, UserRole.ADMIN]} fallback={fallback}>{children}</Can>;
}

/**
 * Component that renders children only for finance users (includes admin).
 */
export function FinanceOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }): ReactNode {
  return <Can roles={[UserRole.FINANCE_OPS, UserRole.ADMIN]} fallback={fallback}>{children}</Can>;
}

/**
 * Component that renders children only for approvers (manager, finance, admin).
 */
export function ApproverOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }): ReactNode {
  return <Can roles={[UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN]} fallback={fallback}>{children}</Can>;
}

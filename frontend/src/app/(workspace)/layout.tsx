// ===========================================
// DealFlow360 - Internal Workspace Layout
// ===========================================
// Authenticated layout with role-based navigation.
// Navigation matches Excalidraw diagram screens 2-15.
// ===========================================

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, Can } from '@/lib/rbac';
import { UserRole } from '@/lib/types';

// ===========================================
// NAVIGATION CONFIGURATION
// ===========================================

interface NavItem {
  name: string;
  href: string;
  icon: string;
  screen?: string;
  // Optional: roles that can see this nav item
  // If not specified, item is visible to all authenticated users
  roles?: UserRole[];
}

// Main navigation items matching Excalidraw diagram
const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/workspace', icon: '📊', screen: '2' },
  { name: 'Quotations', href: '/workspace/quotations', icon: '📝', screen: '3-4' },
  { 
    name: 'Approvals', 
    href: '/workspace/approvals', 
    icon: '✅', 
    screen: '5-6',
    roles: [UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN],
  },
  { name: 'Fulfillment', href: '/workspace/fulfillment', icon: '🚚', screen: '7-8' },
  { name: 'Subscriptions', href: '/workspace/subscriptions', icon: '🔄', screen: '9-10' },
  { name: 'Invoices', href: '/workspace/invoices', icon: '🧾', screen: '12-13' },
  { 
    name: 'Deal Health', 
    href: '/workspace/deal-health', 
    icon: '💊', 
    screen: '14',
    roles: [UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN],
  },
  { 
    name: 'Reports', 
    href: '/workspace/reports', 
    icon: '📈', 
    screen: '15',
    roles: [UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN],
  },
];

// Catalog navigation
const catalogNav: NavItem[] = [
  { name: 'Catalog', href: '/workspace/catalog', icon: '📦' },
];

// Admin navigation - only visible to admins
const adminNav: NavItem[] = [
  { name: 'Users', href: '/workspace/admin/users', icon: '👥' },
  { name: 'Settings', href: '/workspace/admin/settings', icon: '⚙️' },
];

// ===========================================
// NAVIGATION ITEM COMPONENT
// ===========================================

function NavLink({ item, pathname }: { item: NavItem; pathname: string | null }) {
  const isActive = pathname === item.href || 
    (item.href !== '/workspace' && pathname?.startsWith(item.href + '/')) ||
    (item.href === '/workspace' && pathname === '/workspace');
  
  return (
    <Link
      href={item.href}
      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition ${
        isActive
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <span className="mr-3">{item.icon}</span>
      {item.name}
    </Link>
  );
}

// ===========================================
// LOADING SKELETON
// ===========================================

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
        <p className="mt-2 text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

// ===========================================
// USER MENU COMPONENT
// ===========================================

function UserMenu() {
  const { user, logout, isLoading } = useAuth();
  
  if (isLoading || !user) {
    return (
      <div className="flex items-center space-x-4">
        <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }
  
  // Role badge colors
  const roleBadgeColors: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'bg-purple-100 text-purple-800',
    [UserRole.SALES_MANAGER]: 'bg-blue-100 text-blue-800',
    [UserRole.FINANCE_OPS]: 'bg-green-100 text-green-800',
    [UserRole.SALES_REP]: 'bg-gray-100 text-gray-800',
  };
  
  const roleDisplayNames: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'Admin',
    [UserRole.SALES_MANAGER]: 'Manager',
    [UserRole.FINANCE_OPS]: 'Finance',
    [UserRole.SALES_REP]: 'Sales Rep',
  };
  
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">{user.name}</span>
        {user.role && (
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${roleBadgeColors[user.role]}`}>
            {roleDisplayNames[user.role]}
          </span>
        )}
      </div>
      <button
        onClick={logout}
        className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-100 transition"
      >
        Sign out
      </button>
    </div>
  );
}

// ===========================================
// MAIN LAYOUT COMPONENT
// ===========================================

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  
  // Redirect to login if not authenticated (after loading completes)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);
  
  // Show loading skeleton while checking auth or redirecting
  if (isLoading || !isAuthenticated || !user) {
    return <LoadingSkeleton />;
  }
  
  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true;
    return hasRole(item.roles);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Link href="/workspace" className="text-xl font-bold text-indigo-900">
            DealFlow360
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {/* Main navigation */}
          <div className="mb-2">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Main
            </p>
          </div>
          {filteredNavigation.map((item) => (
            <NavLink key={item.name} item={item} pathname={pathname} />
          ))}

          {/* Catalog section */}
          <div className="pt-4 mt-4 border-t border-gray-200">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Catalog
            </p>
          </div>
          {catalogNav.map((item) => (
            <NavLink key={item.name} item={item} pathname={pathname} />
          ))}

          {/* Admin section - only visible to admins */}
          <Can role={UserRole.ADMIN}>
            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Admin
              </p>
            </div>
            {adminNav.map((item) => (
              <NavLink key={item.name} item={item} pathname={pathname} />
            ))}
          </Can>
        </nav>
      </aside>

      {/* Main content */}
      <div className="pl-64">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div>
            {/* Breadcrumb placeholder */}
          </div>
          <UserMenu />
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

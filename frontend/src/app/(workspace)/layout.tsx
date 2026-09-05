'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, Can } from '@/lib/rbac';
import { UserRole } from '@/lib/types';

// Navigation configuration
interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles?: UserRole[];
}

const mainNavigation: NavItem[] = [
  { 
    name: 'Dashboard', 
    href: '/workspace', 
    icon: <LayoutDashboardIcon />,
  },
  { 
    name: 'Quotations', 
    href: '/workspace/quotations', 
    icon: <FileTextIcon />,
  },
  { 
    name: 'Approvals', 
    href: '/workspace/approvals', 
    icon: <CheckCircleIcon />,
    roles: [UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN],
  },
  { 
    name: 'Fulfillment', 
    href: '/workspace/fulfillment', 
    icon: <TruckIcon />,
  },
  { 
    name: 'Subscriptions', 
    href: '/workspace/subscriptions', 
    icon: <RepeatIcon />,
  },
  { 
    name: 'Invoices', 
    href: '/workspace/invoices', 
    icon: <ReceiptIcon />,
  },
];

const analyticsNavigation: NavItem[] = [
  { 
    name: 'Deal Health', 
    href: '/workspace/deal-health', 
    icon: <ActivityIcon />,
    roles: [UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN],
  },
  { 
    name: 'Reports', 
    href: '/workspace/reports', 
    icon: <BarChartIcon />,
    roles: [UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN],
  },
];

const catalogNavigation: NavItem[] = [
  { 
    name: 'Catalog', 
    href: '/workspace/catalog', 
    icon: <PackageIcon />,
  },
];

const adminNavigation: NavItem[] = [
  { 
    name: 'Users', 
    href: '/workspace/admin/users', 
    icon: <UsersIcon />,
  },
  { 
    name: 'Settings', 
    href: '/workspace/admin/settings', 
    icon: <SettingsIcon />,
  },
];

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, hasRole, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);
  
  if (isLoading || !isAuthenticated || !user) {
    return <LoadingSkeleton />;
  }
  
  const filteredMainNav = mainNavigation.filter(item => !item.roles || hasRole(item.roles));
  const filteredAnalyticsNav = analyticsNavigation.filter(item => !item.roles || hasRole(item.roles));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200
        transform transition-transform duration-200 ease-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
            <Link href="/workspace" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-slate-900">DealFlow360</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <XIcon />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-6">
            {/* Main */}
            <NavSection title="Main" items={filteredMainNav} pathname={pathname} />
            
            {/* Analytics */}
            {filteredAnalyticsNav.length > 0 && (
              <NavSection title="Analytics" items={filteredAnalyticsNav} pathname={pathname} />
            )}
            
            {/* Catalog */}
            <NavSection title="Catalog" items={catalogNavigation} pathname={pathname} />
            
            {/* Admin */}
            <Can role={UserRole.ADMIN}>
              <NavSection title="Admin" items={adminNavigation} pathname={pathname} />
            </Can>
          </nav>

          {/* User section */}
          <div className="p-3 border-t border-slate-200">
            <div className="flex items-center gap-3 p-2">
              <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium text-slate-600">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{getRoleDisplayName(user.role)}</p>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Sign out"
              >
                <LogOutIcon />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <MenuIcon />
            </button>

            {/* Breadcrumb */}
            <Breadcrumb pathname={pathname} />

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Quick actions on larger screens */}
              <Link 
                href="/workspace/quotations/new"
                className="hidden sm:inline-flex btn-primary btn-sm"
              >
                <PlusIcon />
                New Quote
              </Link>
              
              {/* User menu for mobile */}
              <div className="lg:hidden flex items-center gap-2">
                <RoleBadge role={user.role} />
              </div>
              
              {/* Desktop user info */}
              <div className="hidden lg:flex items-center gap-3 pl-3 border-l border-slate-200">
                <span className="text-sm text-slate-600">{user.name}</span>
                <RoleBadge role={user.role} />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// Navigation section component
function NavSection({ 
  title, 
  items, 
  pathname 
}: { 
  title: string; 
  items: NavItem[]; 
  pathname: string | null;
}) {
  return (
    <div>
      <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {title}
      </p>
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/workspace' && pathname?.startsWith(item.href + '/')) ||
            (item.href === '/workspace' && pathname === '/workspace');
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive 
                  ? 'bg-slate-900 text-white' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }
              `}
            >
              <span className={isActive ? 'text-white' : 'text-slate-400'}>
                {item.icon}
              </span>
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Breadcrumb component
function Breadcrumb({ pathname }: { pathname: string | null }) {
  if (!pathname) return <div />;
  
  const segments = pathname.split('/').filter(Boolean);
  
  // Don't show breadcrumb on dashboard
  if (segments.length <= 1 || (segments.length === 1 && segments[0] === 'workspace')) {
    return <div className="hidden sm:block" />;
  }
  
  const breadcrumbItems = segments.slice(1).map((segment, index) => {
    const href = '/' + segments.slice(0, index + 2).join('/');
    const isLast = index === segments.length - 2;
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    
    return { href, label, isLast };
  });

  return (
    <nav className="hidden sm:flex items-center gap-2 text-sm">
      <Link href="/workspace" className="text-slate-400 hover:text-slate-600 transition-colors">
        <HomeIcon />
      </Link>
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRightIcon />
          {item.isLast ? (
            <span className="text-slate-900 font-medium">{item.label}</span>
          ) : (
            <Link href={item.href} className="text-slate-500 hover:text-slate-700 transition-colors">
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

// Role badge component
function RoleBadge({ role }: { role: UserRole | undefined }) {
  if (!role) return null;
  
  const colors: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'bg-purple-100 text-purple-700',
    [UserRole.SALES_MANAGER]: 'bg-blue-100 text-blue-700',
    [UserRole.FINANCE_OPS]: 'bg-emerald-100 text-emerald-700',
    [UserRole.SALES_REP]: 'bg-slate-100 text-slate-700',
  };
  
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${colors[role]}`}>
      {getRoleDisplayName(role)}
    </span>
  );
}

function getRoleDisplayName(role: UserRole | undefined): string {
  if (!role) return '';
  const names: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'Admin',
    [UserRole.SALES_MANAGER]: 'Manager',
    [UserRole.FINANCE_OPS]: 'Finance',
    [UserRole.SALES_REP]: 'Sales Rep',
  };
  return names[role];
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

// Icons
function LayoutDashboardIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4l3-9 4 18 3-9h4" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13v6a1 1 0 001 1h3a1 1 0 001-1v-6a1 1 0 00-1-1H4a1 1 0 00-1 1zm7-7v13a1 1 0 001 1h3a1 1 0 001-1V6a1 1 0 00-1-1h-3a1 1 0 00-1 1zm7 4v9a1 1 0 001 1h3a1 1 0 001-1v-9a1 1 0 00-1-1h-3a1 1 0 00-1 1z" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

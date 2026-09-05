'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ActorType } from '@/lib/types';

const portalNav = [
  { name: 'Dashboard', href: '/portal/dashboard', icon: <DashboardIcon /> },
  { name: 'Quotations', href: '/portal/quotations', icon: <DocumentIcon /> },
  { name: 'Orders', href: '/portal/orders', icon: <PackageIcon /> },
  { name: 'Invoices', href: '/portal/invoices', icon: <ReceiptIcon /> },
  { name: 'Account', href: '/portal/account', icon: <UserIcon /> },
];

const tierConfig = {
  GOLD: { label: 'Gold', className: 'bg-amber-100 text-amber-800' },
  SILVER: { label: 'Silver', className: 'bg-slate-200 text-slate-700' },
  BRONZE: { label: 'Bronze', className: 'bg-orange-100 text-orange-800' },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isLoginPage = pathname === '/portal/login';

  useEffect(() => {
    if (isLoginPage) return;
    
    if (status === 'unauthenticated') {
      router.push('/portal/login');
    } else if (status === 'authenticated' && session?.user?.actorType !== ActorType.CUSTOMER) {
      router.push('/workspace');
    }
  }, [status, session, router, isLoginPage]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ redirect: false });
      router.push('/portal/login');
    } catch (error) {
      console.error('Sign out error:', error);
      setIsLoggingOut(false);
    }
  };

  // Don't apply layout to login page
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading states
  if (status === 'loading' || isLoggingOut) {
    return <LoadingScreen message={isLoggingOut ? 'Signing out...' : 'Loading...'} />;
  }

  if (status === 'unauthenticated') {
    return <LoadingScreen message="Redirecting to login..." />;
  }

  if (!session?.user) {
    return null;
  }

  const customer = {
    name: session.user.name || 'Customer',
    email: session.user.email || '',
    tier: (session.user.tier || 'BRONZE') as keyof typeof tierConfig,
  };

  const tierInfo = tierConfig[customer.tier] || tierConfig.BRONZE;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Mobile Nav Backdrop */}
      {mobileNavOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="container-wide">
          <div className="h-16 flex items-center justify-between">
            {/* Logo & Mobile Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="md:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <MenuIcon />
              </button>
              <Link href="/portal/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="hidden sm:block">
                  <span className="text-lg font-bold text-slate-900">DealFlow360</span>
                  <span className="text-xs text-slate-400 ml-2">Customer Portal</span>
                </div>
              </Link>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${tierInfo.className}`}>
                {tierInfo.label}
              </span>
              <span className="hidden sm:inline text-sm text-slate-600">{customer.name}</span>
              <button
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="btn-ghost btn-sm text-slate-500"
              >
                {isLoggingOut ? <Spinner /> : <LogOutIcon />}
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:block border-t border-slate-100 bg-white">
          <div className="container-wide">
            <div className="flex">
              {portalNav.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors
                      ${isActive
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }
                    `}
                  >
                    <span className={isActive ? 'text-emerald-500' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Sheet */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-200 md:hidden
        ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Mobile Nav Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
            <Link href="/portal/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-slate-900">DealFlow360</span>
            </Link>
            <button
              onClick={() => setMobileNavOpen(false)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <XIcon />
            </button>
          </div>

          {/* Mobile Nav Links */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {portalNav.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                >
                  <span className={isActive ? 'text-emerald-500' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Nav Footer */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-medium">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{customer.name}</p>
                <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${tierInfo.className}`}>
                  {tierInfo.label}
                </span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="w-full btn-secondary btn-sm"
            >
              {isLoggingOut ? <Spinner /> : <LogOutIcon />}
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <main className="flex-1">
        <div className="container-wide py-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200">
        <div className="container-wide py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} DealFlow360. All rights reserved.</p>
            <p>Need help? <a href="mailto:support@dealflow360.com" className="text-emerald-600 hover:text-emerald-700">support@dealflow360.com</a></p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30">
        <div className="grid grid-cols-5">
          {portalNav.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors
                  ${isActive ? 'text-emerald-600' : 'text-slate-400'}
                `}
              >
                <span className={isActive ? 'text-emerald-500' : ''}>{item.icon}</span>
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom nav spacer for mobile */}
      <div className="md:hidden h-16" />
    </div>
  );
}

// Loading Screen
function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );
}

// Spinner
function Spinner() {
  return <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />;
}

// Icons
function DashboardIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

function ReceiptIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
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

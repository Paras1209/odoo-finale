// ===========================================
// DealFlow360 - Customer Portal Layout
// ===========================================
// Full auth integration with NextAuth session
// ===========================================

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ActorType } from '@/lib/types';

const portalNav = [
  { name: 'Dashboard', href: '/portal/dashboard', icon: '📊' },
  { name: 'My Quotations', href: '/portal/quotations', icon: '📝' },
  { name: 'Orders', href: '/portal/orders', icon: '📦' },
  { name: 'Invoices', href: '/portal/invoices', icon: '💰' },
  { name: 'Account', href: '/portal/account', icon: '👤' },
];

const tierColors = {
  GOLD: 'bg-yellow-100 text-yellow-800',
  SILVER: 'bg-gray-100 text-gray-800',
  BRONZE: 'bg-orange-100 text-orange-800',
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

  // Don't apply layout to login page
  if (pathname === '/portal/login') {
    return <>{children}</>;
  }

  // Check authentication status
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/portal/login');
    } else if (status === 'authenticated' && session?.user?.actorType !== ActorType.CUSTOMER) {
      // Internal user tried to access portal - redirect to workspace
      router.push('/workspace');
    }
  }, [status, session, router]);

  // Handle sign out
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

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (status !== 'authenticated' || !session?.user) {
    return null;
  }

  const customer = {
    name: session.user.name || 'Customer',
    email: session.user.email || '',
    tier: (session.user.tier || 'BRONZE') as keyof typeof tierColors,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/portal/dashboard" className="text-xl font-bold text-emerald-900">
                DealFlow360
              </Link>
              <span className="text-sm text-gray-500">Customer Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${tierColors[customer.tier]}`}>
                {customer.tier}
              </span>
              <span className="text-sm text-gray-600">{customer.name}</span>
              <button
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            {portalNav.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center py-4 text-sm font-medium border-b-2 transition ${
                    isActive
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="container mx-auto px-4 py-6 flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2024 DealFlow360. Need help? Contact support@dealflow360.com
          </p>
        </div>
      </footer>
    </div>
  );
}

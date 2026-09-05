// ===========================================
// DealFlow360 - Customer Portal Layout
// ===========================================
// PHASE 0: Layout shell for portal customers.
// TODO: Add actual auth check in Phase 1
// ===========================================

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const portalNav = [
  { name: 'Dashboard', href: '/portal/dashboard', icon: '📊' },
  { name: 'My Quotations', href: '/portal/quotations', icon: '📝' },
  { name: 'Orders', href: '/portal/orders', icon: '📦' },
  { name: 'Invoices', href: '/portal/invoices', icon: '💰' },
  { name: 'Account', href: '/portal/account', icon: '👤' },
];

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Don't apply layout to login page
  if (pathname === '/portal/login') {
    return <>{children}</>;
  }

  // TODO: Get actual customer from auth context in Phase 1
  const customer = {
    name: 'Acme Corporation',
    email: 'acme@example.com',
    tier: 'GOLD',
  };

  const tierColors = {
    GOLD: 'bg-yellow-100 text-yellow-800',
    SILVER: 'bg-gray-100 text-gray-800',
    BRONZE: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              <span className={`badge ${tierColors[customer.tier as keyof typeof tierColors]}`}>
                {customer.tier}
              </span>
              <span className="text-sm text-gray-600">{customer.name}</span>
              <button
                onClick={() => alert('Logout not implemented in Phase 0')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
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
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2024 DealFlow360. Need help? Contact support@dealflow360.com
          </p>
        </div>
      </footer>
    </div>
  );
}

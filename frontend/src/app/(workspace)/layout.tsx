// ===========================================
// DealFlow360 - Internal Workspace Layout
// ===========================================
// PHASE 0: Layout shell for authenticated internal users.
// TODO: Add actual auth check in Phase 1
// ===========================================

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/workspace', icon: '📊' },
  { name: 'Quotations', href: '/workspace/quotations', icon: '📝' },
  { name: 'Approvals', href: '/workspace/approvals', icon: '✅' },
  { name: 'Catalog', href: '/workspace/catalog', icon: '📦' },
  { name: 'Fulfillment', href: '/workspace/fulfillment', icon: '🚚' },
  { name: 'Billing', href: '/workspace/billing', icon: '💰' },
];

const adminNav = [
  { name: 'Users', href: '/workspace/admin/users', icon: '👥' },
  { name: 'Settings', href: '/workspace/admin/settings', icon: '⚙️' },
];

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // TODO: Get actual user from auth context in Phase 1
  const user = {
    name: 'John Doe',
    email: 'john@dealflow360.com',
    role: 'ADMIN',
  };

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
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
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
          })}

          {/* Admin section */}
          {user.role === 'ADMIN' && (
            <>
              <div className="pt-4 mt-4 border-t border-gray-200">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Admin
                </p>
              </div>
              {adminNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
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
              })}
            </>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <div className="pl-64">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div>
            {/* Breadcrumb placeholder */}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user.name}</span>
            <button
              onClick={() => alert('Logout not implemented in Phase 0')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

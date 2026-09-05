// ===========================================
// DealFlow360 - Customer Portal Login Page
// ===========================================
// Customer portal authentication using NextAuth.js
// ===========================================

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('portal', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Redirect to portal dashboard on successful login
      router.push('/portal/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="card">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-emerald-900">
              DealFlow360
            </Link>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Customer Portal
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Access your quotes, orders, and invoices
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="your-email@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <span className="spinner mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign in to Portal'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-500">
              ← Internal Staff Login
            </Link>
          </div>

          {/* Dev hint */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
            <strong>Dev credentials:</strong><br />
            acme@example.com / portal123<br />
            globex@example.com / portal123
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// DealFlow360 - Internal Login Page
// ===========================================
// PHASE 0: Stub login page for internal users.
// TODO: Implement actual auth in Phase 1
// ===========================================

'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // TODO: Implement actual login in Phase 1
    // This is a stub that simulates the flow
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      // TODO: Store token and redirect
      // localStorage.setItem('token', data.data.token);
      // router.push('/workspace');
      alert('Login successful! (redirect not implemented in Phase 0)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="card">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-indigo-900">
              DealFlow360
            </Link>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Internal Login
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to access the sales operations platform
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
                placeholder="you@company.com"
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
              className="btn-primary w-full flex items-center justify-center"
            >
              {loading ? (
                <>
                  <span className="spinner mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <Link href="/portal/login" className="text-indigo-600 hover:text-indigo-500">
              Customer Portal Login →
            </Link>
          </div>

          {/* Dev hint */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
            <strong>Dev credentials:</strong><br />
            admin@dealflow360.com / password123<br />
            rep1@dealflow360.com / password123
          </div>
        </div>
      </div>
    </div>
  );
}

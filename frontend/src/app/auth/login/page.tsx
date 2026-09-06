'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/providers';
import { getUserFriendlyMessage, ErrorCode } from '@/lib/errors';

export default function LoginPage() {
  const router = useRouter();
  const { error: showError } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('internal', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Map common auth errors to user-friendly messages
        let userMessage = result.error;
        if (result.error === 'CredentialsSignin' || result.error.includes('credentials')) {
          userMessage = getUserFriendlyMessage(ErrorCode.INVALID_CREDENTIALS);
        } else if (result.error.includes('disabled')) {
          userMessage = getUserFriendlyMessage(ErrorCode.ACCOUNT_DISABLED);
        }
        setError(userMessage);
        showError(userMessage);
        return;
      }

      router.push('/workspace');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error 
        ? err.message 
        : getUserFriendlyMessage(ErrorCode.UNKNOWN);
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900">DealFlow360</span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 mt-2">Sign in to access the sales operations platform</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">
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
                className="input input-lg"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
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
                className="input input-lg"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary btn-lg justify-center"
            >
              {loading ? (
                <>
                  <Spinner />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500 text-center">
              Customer?{' '}
              <Link href="/portal/login" className="font-medium text-slate-900 hover:text-slate-700">
                Sign in to Customer Portal
              </Link>
            </p>
          </div>

          {/* Dev hint */}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Demo Credentials</p>
            <div className="space-y-1 text-sm text-slate-600">
              <p><span className="text-slate-400">Admin:</span> admin@dealflow360.com / password123</p>
              <p><span className="text-slate-400">Sales:</span> rep@dealflow360.com / password123</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex lg:flex-1 bg-slate-900 items-center justify-center p-12">
        <div className="max-w-lg text-center">
          <div className="w-20 h-20 mx-auto mb-8 bg-white/10 rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Intelligent Sales Operations
          </h2>
          <p className="text-slate-400 leading-relaxed">
            Streamline quotations, automate approvals, and accelerate fulfillment with DealFlow360's unified platform.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">99.9%</div>
              <div className="text-sm text-slate-400 mt-1">Uptime</div>
            </div>
            <div className="w-px bg-slate-700" />
            <div className="text-center">
              <div className="text-3xl font-bold text-white">50%</div>
              <div className="text-sm text-slate-400 mt-1">Faster Approvals</div>
            </div>
            <div className="w-px bg-slate-700" />
            <div className="text-center">
              <div className="text-3xl font-bold text-white">2x</div>
              <div className="text-sm text-slate-400 mt-1">Deal Velocity</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
}

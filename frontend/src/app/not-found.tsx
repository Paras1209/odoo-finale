// ===========================================
// DealFlow360 - 404 Not Found Page
// ===========================================
// Custom 404 page with user-friendly message.
// ===========================================

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="mx-auto w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-3xl font-bold text-slate-400">404</span>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Page Not Found
        </h1>
        <p className="text-slate-600 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary">
            Go to Home
          </Link>
          <Link href="/workspace" className="btn-secondary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Quotation {
  id: string;
  quotationNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function PortalQuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    setLoading(true);
    const res = await api.get<any>('/portal/quotations');
    if (res.success && res.data) {
      setQuotations(res.data.data || res.data);
    }
    setLoading(false);
  };

  const awaitingReview = quotations.filter(q => q.status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Quotations</h1>
        <p className="text-slate-500 mt-1">Review and manage your quotations</p>
      </div>

      {/* Action Alert */}
      {awaitingReview > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <BellIcon />
            </div>
            <div>
              <p className="font-medium text-emerald-900">
                {awaitingReview} quotation{awaitingReview !== 1 ? 's' : ''} awaiting your review
              </p>
              <p className="text-sm text-emerald-700">Review and confirm to proceed with your order</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <ListSkeleton />
        ) : quotations.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quote #</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Amount</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotations.map(q => (
                    <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link 
                          href={`/portal/quotations/${q.id}`}
                          className="font-medium text-slate-900 hover:text-emerald-600 transition-colors"
                        >
                          {q.quotationNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {formatCurrency(q.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={q.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {formatDate(q.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link 
                          href={`/portal/quotations/${q.id}`}
                          className={`btn-sm ${q.status === 'APPROVED' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'btn-secondary'}`}
                        >
                          {q.status === 'APPROVED' ? 'Review' : 'View'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden divide-y divide-slate-100">
              {quotations.map(q => (
                <Link 
                  key={q.id}
                  href={`/portal/quotations/${q.id}`}
                  className="block p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="font-medium text-slate-900">{q.quotationNumber}</span>
                      <p className="text-sm text-slate-500 mt-0.5">{formatDate(q.createdAt)}</p>
                    </div>
                    <StatusBadge status={q.status} />
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-semibold text-slate-900">
                      {formatCurrency(q.totalAmount)}
                    </span>
                    <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                      {q.status === 'APPROVED' ? 'Review' : 'View'}
                      <ChevronRightIcon />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <p className="text-sm text-slate-500">
                {quotations.length} quotation{quotations.length !== 1 ? 's' : ''}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    APPROVED: { label: 'Awaiting Review', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' },
    CONFIRMED: { label: 'Confirmed', className: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' },
    PENDING_MANAGER_APPROVAL: { label: 'In Progress', className: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' },
    PENDING_FINANCE_APPROVAL: { label: 'In Progress', className: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' },
    REJECTED: { label: 'Declined', className: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' },
    CANCELLED: { label: 'Cancelled', className: 'bg-slate-100 text-slate-500' },
    FULFILLING: { label: 'Fulfilling', className: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20' },
    BILLED: { label: 'Billed', className: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20' },
  };

  const { label, className } = config[status] || { label: status, className: 'bg-slate-100 text-slate-700' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="py-16 text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
        <DocumentIcon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-1">No quotations yet</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">
        When your sales representative creates a quotation for you, it will appear here for your review.
      </p>
    </div>
  );
}

// List Skeleton Component
function ListSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Desktop */}
      <div className="hidden sm:block">
        <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3">
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-4 bg-slate-200 rounded flex-1" />
            ))}
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="px-4 py-4 border-b border-slate-100">
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map(j => (
                <div key={j} className="h-4 bg-slate-100 rounded flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Mobile */}
      <div className="sm:hidden divide-y divide-slate-100">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4">
            <div className="flex justify-between mb-3">
              <div>
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-3 w-20 bg-slate-100 rounded mt-2" />
              </div>
              <div className="h-5 w-20 bg-slate-100 rounded" />
            </div>
            <div className="h-6 w-24 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Icons
function BellIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function DocumentIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

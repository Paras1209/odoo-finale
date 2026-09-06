'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Approval {
  id: string;
  quotationId: string;
  quotationNumber: string;
  customerName: string;
  customerTier: string;
  repName: string;
  totalAmount: number;
  blendedRiskScore: number | null;
  level: string;
  status: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter, currentPage]);

  const fetchApprovals = async () => {
    if (!hasLoaded) setLoading(true);
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('pageSize', '20');
    params.append('status', statusFilter);
    
    const res = await api.get<any>(`/approval?${params.toString()}`);
    if (res.success && res.data) {
      setApprovals(res.data.data || res.data);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    }
    setLoading(false);
    setHasLoaded(true);
  };

  // Reset to page 1 when filter changes
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const pendingCount = pagination?.totalItems ?? approvals.filter(a => a.status === 'PENDING').length;

  // Only show skeleton on very first load
  const showSkeleton = loading && !hasLoaded;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pending Approvals</h1>
          <p className="text-slate-500 mt-1">Review and approve quotations requiring authorization</p>
        </div>
        <select 
          className="input text-sm w-full sm:w-auto"
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="RETURNED">Returned</option>
        </select>
      </div>

      {/* Alert Banner */}
      {statusFilter === 'PENDING' && pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <ClockIcon />
            </div>
            <div>
              <p className="font-medium text-amber-900">
                {pendingCount} quotation{pendingCount !== 1 ? 's' : ''} awaiting your review
              </p>
              <p className="text-sm text-amber-700">Please review and take action on pending approvals</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {showSkeleton ? (
          <ListSkeleton />
        ) : approvals.length === 0 ? (
          <EmptyState statusFilter={statusFilter} />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quotation</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rep</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Level</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {approvals.map((approval) => (
                    <tr key={approval.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/workspace/quotations/${approval.quotationId}`} className="font-medium text-slate-900 hover:text-indigo-600 transition-colors">
                          {approval.quotationNumber}
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(approval.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{approval.customerName}</span>
                        <TierBadge tier={approval.customerTier} className="ml-2" />
                      </td>
                      <td className="px-4 py-3 text-slate-600">{approval.repName}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {formatCurrency(approval.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <RiskBadge score={approval.blendedRiskScore} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <LevelBadge level={approval.level} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={approval.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/workspace/approvals/${approval.id}`} className="btn-sm btn-primary">
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-slate-100">
              {approvals.map((approval) => (
                <Link 
                  key={approval.id}
                  href={`/workspace/approvals/${approval.id}`}
                  className="block p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="font-medium text-slate-900">{approval.quotationNumber}</span>
                      <p className="text-sm text-slate-500 mt-0.5">{approval.customerName}</p>
                    </div>
                    <StatusBadge status={approval.status} />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <TierBadge tier={approval.customerTier} />
                    <LevelBadge level={approval.level} />
                    <RiskBadge score={approval.blendedRiskScore} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-slate-900">
                      {formatCurrency(approval.totalAmount)}
                    </span>
                    <span className="text-sm text-indigo-600 font-medium flex items-center gap-1">
                      Review <ChevronRightIcon />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Footer with Pagination */}
            {pagination && pagination.totalPages > 1 ? (
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems} approvals
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-slate-200 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-slate-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="px-3 py-1 border border-slate-200 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                <p className="text-sm text-slate-500">
                  {approvals.length} approval{approvals.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Badge Components
function TierBadge({ tier, className = '' }: { tier: string; className?: string }) {
  const config: Record<string, string> = {
    GOLD: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
    SILVER: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20',
    BRONZE: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${config[tier] || config.BRONZE} ${className}`}>
      {tier}
    </span>
  );
}

function RiskBadge({ score }: { score: number | null }) {
  const value = score ?? 0;
  let className = 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20';
  if (value > 10) className = 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20';
  else if (value > 5) className = 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20';
  else if (value > 0) className = 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${className}`}>
      {value.toFixed(1)}
    </span>
  );
}

function LevelBadge({ level }: { level: string }) {
  const className = level === 'MANAGER' 
    ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
    : 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${className}`}>
      {level}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
    APPROVED: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
    REJECTED: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
    RETURNED: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${config[status] || config.PENDING}`}>
      {status}
    </span>
  );
}

function EmptyState({ statusFilter }: { statusFilter: string }) {
  return (
    <div className="py-16 text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
        <CheckIcon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-1">No {statusFilter.toLowerCase()} approvals</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">
        {statusFilter === 'PENDING' 
          ? "All quotations are either approved or don't require approval."
          : `No approvals with ${statusFilter.toLowerCase()} status.`}
      </p>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="hidden lg:block">
        <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3">
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-4 bg-slate-200 rounded flex-1" />
            ))}
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="px-4 py-4 border-b border-slate-100">
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(j => (
                <div key={j} className="h-4 bg-slate-100 rounded flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="lg:hidden divide-y divide-slate-100">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4">
            <div className="flex justify-between mb-3">
              <div>
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-3 w-32 bg-slate-100 rounded mt-2" />
              </div>
              <div className="h-5 w-16 bg-slate-100 rounded" />
            </div>
            <div className="flex gap-2 mb-3">
              <div className="h-5 w-12 bg-slate-100 rounded" />
              <div className="h-5 w-16 bg-slate-100 rounded" />
              <div className="h-5 w-10 bg-slate-100 rounded" />
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
function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

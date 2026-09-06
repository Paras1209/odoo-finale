'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Quotation {
  id: string;
  quotationNumber: string;
  customerName: string;
  customerTier: string;
  totalAmount: number;
  status: string;
  blendedRiskScore: number | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_MANAGER_APPROVAL', label: 'Pending Manager' },
  { value: 'PENDING_FINANCE_APPROVAL', label: 'Pending Finance' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchQuotations();
  }, [statusFilter, currentPage]);

  const fetchQuotations = async () => {
    if (!hasLoaded) setLoading(true);
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('pageSize', '20');
    if (statusFilter) params.append('status', statusFilter);
    
    const res = await api.get<any>(`/quotation?${params.toString()}`);
    if (res.success) {
      // API returns { success, data: [...], pagination: {...} }
      setQuotations(res.data || []);
      // Pagination is at root level of response
      if ((res as any).pagination) {
        setPagination((res as any).pagination);
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

  const filteredQuotations = quotations.filter(q => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      q.quotationNumber.toLowerCase().includes(search) ||
      q.customerName.toLowerCase().includes(search)
    );
  });

  // Only show full skeleton on first load
  const showSkeleton = loading && !hasLoaded;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quotations</h1>
          <p className="text-slate-500 mt-1">Manage customer quotations and track their status</p>
        </div>
        <Link href="/workspace/quotations/new" className="btn-primary">
          <PlusIcon />
          New Quotation
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by quote number or customer..."
              className="input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Status Filter */}
          <select 
            className="select min-w-[180px]"
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {showSkeleton ? (
          <TableSkeleton />
        ) : filteredQuotations.length === 0 ? (
          <EmptyState 
            hasFilters={!!searchQuery || !!statusFilter}
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quote #</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQuotations.map(q => (
                    <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link 
                          href={`/workspace/quotations/${q.id}`} 
                          className="font-medium text-slate-900 hover:text-indigo-600 transition-colors"
                        >
                          {q.quotationNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-700">{q.customerName}</span>
                          <TierBadge tier={q.customerTier} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {formatCurrency(q.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <RiskIndicator score={q.blendedRiskScore} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={q.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {formatDate(q.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link 
                          href={`/workspace/quotations/${q.id}`}
                          className="btn-secondary btn-sm"
                        >
                          {q.status === 'DRAFT' ? 'Edit' : 'View'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredQuotations.map(q => (
                <Link 
                  key={q.id}
                  href={`/workspace/quotations/${q.id}`}
                  className="block p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="font-medium text-slate-900">{q.quotationNumber}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm text-slate-600">{q.customerName}</span>
                        <TierBadge tier={q.customerTier} />
                      </div>
                    </div>
                    <StatusBadge status={q.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-slate-900">
                      {formatCurrency(q.totalAmount)}
                    </span>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <RiskIndicator score={q.blendedRiskScore} compact />
                      <span>{formatDate(q.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Footer with Pagination */}
            {pagination && pagination.totalPages > 1 ? (
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems} quotations
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
                  {pagination ? `Showing all ${pagination.totalItems} quotation${pagination.totalItems !== 1 ? 's' : ''}` : `${filteredQuotations.length} quotation${filteredQuotations.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    DRAFT: { label: 'Draft', className: 'bg-slate-100 text-slate-700' },
    PENDING_MANAGER_APPROVAL: { label: 'Pending Manager', className: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' },
    PENDING_FINANCE_APPROVAL: { label: 'Pending Finance', className: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20' },
    APPROVED: { label: 'Approved', className: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' },
    CONFIRMED: { label: 'Confirmed', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' },
    REJECTED: { label: 'Rejected', className: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' },
    CANCELLED: { label: 'Cancelled', className: 'bg-slate-100 text-slate-500' },
  };

  const { label, className } = config[status] || { label: status, className: 'bg-slate-100 text-slate-700' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

// Tier Badge Component
function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    GOLD: 'bg-amber-100 text-amber-800',
    SILVER: 'bg-slate-200 text-slate-700',
    BRONZE: 'bg-orange-100 text-orange-800',
  };

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${colors[tier] || 'bg-slate-100 text-slate-700'}`}>
      {tier}
    </span>
  );
}

// Risk Indicator Component
function RiskIndicator({ score, compact = false }: { score: number | null; compact?: boolean }) {
  if (score === null || score === 0) {
    return compact ? null : <span className="text-slate-400">-</span>;
  }

  const getColor = () => {
    if (score <= 5) return 'bg-amber-100 text-amber-800';
    if (score <= 10) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs ${score > 5 ? 'text-orange-600' : 'text-amber-600'}`}>
        <AlertTriangleIcon />
        {score.toFixed(1)}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getColor()}`}>
      {score.toFixed(1)}
    </span>
  );
}

// Empty State Component
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="py-16 text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
        <DocumentIcon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-1">
        {hasFilters ? 'No quotations match your criteria' : 'No quotations yet'}
      </h3>
      <p className="text-sm text-slate-500 mb-6">
        {hasFilters 
          ? 'Try adjusting your search or filters' 
          : 'Create your first quotation to get started'
        }
      </p>
      {!hasFilters && (
        <Link href="/workspace/quotations/new" className="btn-primary">
          <PlusIcon />
          Create Quotation
        </Link>
      )}
    </div>
  );
}

// Table Skeleton Component
function TableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="hidden md:block">
        <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3">
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="h-4 bg-slate-200 rounded flex-1" />
            ))}
          </div>
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="px-4 py-4 border-b border-slate-100">
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5, 6, 7].map(j => (
                <div key={j} className="h-4 bg-slate-100 rounded flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="md:hidden divide-y divide-slate-100">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4">
            <div className="flex justify-between mb-3">
              <div className="space-y-2">
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-3 w-32 bg-slate-100 rounded" />
              </div>
              <div className="h-5 w-20 bg-slate-100 rounded" />
            </div>
            <div className="flex justify-between">
              <div className="h-6 w-24 bg-slate-200 rounded" />
              <div className="h-4 w-20 bg-slate-100 rounded" />
            </div>
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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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
function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function DocumentIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

"use client";

// ===========================================
// DealFlow360 - Subscriptions List Page (Screen 9)
// ===========================================
// M4 - Dev A: Active subscriptions with filters
// ===========================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Subscription {
  id: string;
  productId: string;
  productName: string;
  productSku: string | null;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  lineTotal: number;
  billingFrequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  quotationId: string;
  quotationNumber: string;
  quotationStatus: string;
  customer: {
    id: string;
    name: string;
    email: string;
    tier: string;
  };
  rep: {
    id: string;
    name: string;
  };
  subscriptionStatus: 'ACTIVE' | 'CANCELLED' | 'COMPLETED' | 'PENDING';
  totalSchedules: number;
  upcomingCount: number;
  paidCount: number;
  cancelledCount: number;
  nextBillingDate: string | null;
  nextBillingAmount: number | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [frequencyFilter, setFrequencyFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSubscriptions();
  }, [currentPage, statusFilter]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('pageSize', '20');
    if (statusFilter) params.append('status', statusFilter);
    if (searchQuery) params.append('search', searchQuery);
    
    const res = await api.get<any>(`/billing/subscriptions?${params.toString()}`);
    if (res.success && res.data) {
      setSubscriptions(res.data.data || res.data);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSubscriptions();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrequencyBadgeClass = (frequency: string) => {
    switch (frequency) {
      case 'MONTHLY': return 'bg-purple-100 text-purple-700';
      case 'QUARTERLY': return 'bg-indigo-100 text-indigo-700';
      case 'YEARLY': return 'bg-teal-100 text-teal-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTierBadgeClass = (tier: string) => {
    switch (tier) {
      case 'GOLD': return 'bg-yellow-100 text-yellow-700';
      case 'SILVER': return 'bg-gray-200 text-gray-700';
      case 'BRONZE': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatFrequency = (frequency: string) => {
    return frequency.charAt(0) + frequency.slice(1).toLowerCase();
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (frequencyFilter && sub.billingFrequency !== frequencyFilter) return false;
    return true;
  });

  // Calculate summary stats
  const activeCount = subscriptions.filter(s => s.subscriptionStatus === 'ACTIVE').length;
  const totalMRR = subscriptions
    .filter(s => s.subscriptionStatus === 'ACTIVE')
    .reduce((sum, s) => {
      const monthlyAmount = s.billingFrequency === 'YEARLY' 
        ? s.lineTotal / 12 
        : s.billingFrequency === 'QUARTERLY' 
          ? s.lineTotal / 3 
          : s.lineTotal;
      return sum + monthlyAmount;
    }, 0);
  const pendingCount = subscriptions.filter(s => s.subscriptionStatus === 'PENDING').length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-500 text-sm mt-1">Manage recurring billing and subscription schedules</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Est. MRR</p>
              <p className="text-2xl font-bold text-gray-900">${totalMRR.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{pagination?.totalItems || subscriptions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-white shadow rounded-lg">
        <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <input
              type="text"
              placeholder="Search by product, customer, or quote number..."
              className="w-full border rounded-lg pl-10 pr-4 py-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select 
            className="border rounded-lg px-4 py-2 min-w-[150px]"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="UPCOMING">Active (Upcoming)</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select 
            className="border rounded-lg px-4 py-2 min-w-[150px]"
            value={frequencyFilter}
            onChange={(e) => setFrequencyFilter(e.target.value)}
          >
            <option value="">All Frequencies</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="YEARLY">Yearly</option>
          </select>
          <button 
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading subscriptions...</p>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p className="text-gray-500 text-lg font-medium">
              {searchQuery || statusFilter || frequencyFilter ? 'No subscriptions match your criteria' : 'No subscriptions yet'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Subscriptions are created when recurring line items are added to confirmed quotations.
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Product</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Customer</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Quote #</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-center">Frequency</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Amount</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-center">Progress</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-center">Status</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Next Billing</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSubscriptions.map(sub => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <Link href={`/workspace/subscriptions/${sub.id}`} className="text-blue-600 hover:underline font-medium">
                        {sub.productName}
                      </Link>
                      {sub.productSku && (
                        <p className="text-xs text-gray-400">{sub.productSku}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{sub.customer.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getTierBadgeClass(sub.customer.tier)}`}>
                        {sub.customer.tier}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/workspace/quotations/${sub.quotationId}`} className="text-blue-600 hover:underline text-sm">
                      {sub.quotationNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getFrequencyBadgeClass(sub.billingFrequency)}`}>
                      {formatFrequency(sub.billingFrequency)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    ${sub.lineTotal.toFixed(2)}
                    {sub.quantity > 1 && (
                      <span className="text-xs text-gray-400 block">x{sub.quantity}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(sub.paidCount / sub.totalSchedules) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{sub.paidCount}/{sub.totalSchedules}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeClass(sub.subscriptionStatus)}`}>
                      {sub.subscriptionStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {sub.nextBillingDate ? (
                      <div>
                        <span className="text-gray-700">
                          {new Date(sub.nextBillingDate).toLocaleDateString()}
                        </span>
                        {sub.nextBillingAmount && (
                          <span className="text-xs text-gray-400 block">${sub.nextBillingAmount.toFixed(2)}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link 
                      href={`/workspace/subscriptions/${sub.id}`} 
                      className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 text-sm rounded border border-blue-200"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems} subscriptions
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        {!loading && filteredSubscriptions.length > 0 && (!pagination || pagination.totalPages <= 1) && (
          <div className="px-4 py-3 border-t bg-gray-50 text-sm text-gray-500">
            Showing {filteredSubscriptions.length} subscription{filteredSubscriptions.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

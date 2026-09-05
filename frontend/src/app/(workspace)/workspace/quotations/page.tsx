"use client";

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

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchQuotations();
  }, [statusFilter]);

  const fetchQuotations = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    
    const res = await api.get<any>(`/quotation?${params.toString()}`);
    if (res.success && res.data) {
      setQuotations(res.data.data || res.data);
    }
    setLoading(false);
  };

  const filteredQuotations = quotations.filter(q => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      q.quotationNumber.toLowerCase().includes(search) ||
      q.customerName.toLowerCase().includes(search)
    );
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-200 text-gray-800';
      case 'PENDING_MANAGER_APPROVAL': return 'bg-yellow-100 text-yellow-800';
      case 'PENDING_FINANCE_APPROVAL': return 'bg-orange-100 text-orange-800';
      case 'APPROVED': return 'bg-blue-100 text-blue-800';
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-300 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
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

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-500 text-sm mt-1">Manage customer quotations and track their status</p>
        </div>
        <Link 
          href="/workspace/quotations/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Quotation
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-white shadow rounded-lg">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by quote number or customer..."
              className="w-full border rounded-lg pl-10 pr-4 py-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select 
            className="border rounded-lg px-4 py-2 min-w-[180px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_MANAGER_APPROVAL">Pending Manager</option>
            <option value="PENDING_FINANCE_APPROVAL">Pending Finance</option>
            <option value="APPROVED">Approved</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading quotations...</p>
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg font-medium">
              {searchQuery || statusFilter ? 'No quotations match your criteria' : 'No quotations yet'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {!searchQuery && !statusFilter && (
                <Link href="/workspace/quotations/new" className="text-blue-600 hover:underline">
                  Create your first quotation
                </Link>
              )}
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Quote #</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Customer</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Amount</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-center">Risk</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-center">Status</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Created</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredQuotations.map(q => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/workspace/quotations/${q.id}`} className="text-blue-600 hover:underline font-medium">
                      {q.quotationNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{q.customerName}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getTierBadgeClass(q.customerTier)}`}>
                        {q.customerTier}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">${q.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    {q.blendedRiskScore !== null && q.blendedRiskScore > 0 ? (
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        q.blendedRiskScore <= 5 ? 'bg-yellow-100 text-yellow-800' :
                        q.blendedRiskScore <= 10 ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {q.blendedRiskScore.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeClass(q.status)}`}>
                      {formatStatus(q.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link 
                      href={`/workspace/quotations/${q.id}`} 
                      className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 text-sm rounded border border-blue-200"
                    >
                      {q.status === 'DRAFT' ? 'Edit' : 'View'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Footer */}
        {filteredQuotations.length > 0 && (
          <div className="px-4 py-3 border-t bg-gray-50 text-sm text-gray-500">
            Showing {filteredQuotations.length} quotation{filteredQuotations.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

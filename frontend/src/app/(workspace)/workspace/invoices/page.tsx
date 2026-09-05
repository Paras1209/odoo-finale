"use client";

// ===========================================
// DealFlow360 - Invoices List Page (Screen 12)
// ===========================================
// M4 - Dev A: Invoices list with status filters and actions
// ===========================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Invoice {
  id: string;
  invoiceNumber: string;
  quotationId: string;
  quotationNumber: string;
  customerName: string;
  invoiceType: 'ONE_TIME' | 'RECURRING';
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: string | null;
  issuedAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, [currentPage, statusFilter, typeFilter]);

  const fetchInvoices = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('pageSize', '20');
    if (statusFilter) params.append('status', statusFilter);
    if (typeFilter) params.append('invoiceType', typeFilter);
    
    const res = await api.get<any>(`/billing/invoices?${params.toString()}`);
    if (res.success && res.data) {
      setInvoices(res.data.data || res.data);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchInvoices();
  };

  const handleSendInvoice = async (invoiceId: string) => {
    setActionLoading(invoiceId);
    const res = await api.post<any>(`/billing/invoices/${invoiceId}?action=send`);
    setActionLoading(null);
    
    if (res.success) {
      fetchInvoices();
    } else {
      alert(res.error?.message || 'Failed to send invoice');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-200 text-gray-800';
      case 'SENT': return 'bg-blue-100 text-blue-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-300 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'ONE_TIME': return 'bg-purple-100 text-purple-700';
      case 'RECURRING': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(search) ||
      inv.quotationNumber.toLowerCase().includes(search) ||
      inv.customerName.toLowerCase().includes(search)
    );
  });

  // Calculate summary stats
  const totalOutstanding = invoices
    .filter(inv => inv.status === 'SENT')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalOverdue = invoices
    .filter(inv => inv.status === 'OVERDUE')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const paidThisMonth = invoices
    .filter(inv => {
      if (inv.status !== 'PAID' || !inv.paidAt) return false;
      const paidDate = new Date(inv.paidAt);
      const now = new Date();
      return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const draftCount = invoices.filter(inv => inv.status === 'DRAFT').length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage customer invoices</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-gray-900">${totalOutstanding.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">${totalOverdue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Paid This Month</p>
              <p className="text-2xl font-bold text-green-600">${paidThisMonth.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Drafts</p>
              <p className="text-2xl font-bold text-gray-900">{draftCount}</p>
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
              placeholder="Search by invoice #, quote #, or customer..."
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
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select 
            className="border rounded-lg px-4 py-2 min-w-[150px]"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Types</option>
            <option value="ONE_TIME">One-Time</option>
            <option value="RECURRING">Recurring</option>
          </select>
          <button 
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Invoices Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg font-medium">
              {searchQuery || statusFilter || typeFilter ? 'No invoices match your criteria' : 'No invoices yet'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Invoices are generated when quotations are confirmed and billed.
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Invoice #</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Customer</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Quote #</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-center">Type</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Amount</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-center">Status</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Due Date</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/workspace/invoices/${inv.id}`} className="text-blue-600 hover:underline font-medium">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium">{inv.customerName}</td>
                  <td className="px-4 py-3">
                    <Link href={`/workspace/quotations/${inv.quotationId}`} className="text-blue-600 hover:underline text-sm">
                      {inv.quotationNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getTypeBadgeClass(inv.invoiceType)}`}>
                      {inv.invoiceType === 'ONE_TIME' ? 'One-Time' : 'Recurring'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-medium">${inv.totalAmount.toFixed(2)}</span>
                    {inv.taxAmount > 0 && (
                      <span className="text-xs text-gray-400 block">inc. ${inv.taxAmount.toFixed(2)} tax</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeClass(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {inv.dueDate ? (
                      <span className={inv.status === 'OVERDUE' ? 'text-red-600 font-medium' : 'text-gray-700'}>
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link 
                        href={`/workspace/invoices/${inv.id}`} 
                        className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 text-sm rounded border border-blue-200"
                      >
                        View
                      </Link>
                      {inv.status === 'DRAFT' && (
                        <button
                          onClick={() => handleSendInvoice(inv.id)}
                          disabled={actionLoading === inv.id}
                          className="px-3 py-1.5 text-green-600 hover:bg-green-50 text-sm rounded border border-green-200 disabled:opacity-50"
                        >
                          {actionLoading === inv.id ? '...' : 'Send'}
                        </button>
                      )}
                    </div>
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
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems} invoices
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
        {!loading && filteredInvoices.length > 0 && (!pagination || pagination.totalPages <= 1) && (
          <div className="px-4 py-3 border-t bg-gray-50 text-sm text-gray-500">
            Showing {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

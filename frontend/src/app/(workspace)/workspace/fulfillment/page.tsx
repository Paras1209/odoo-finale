// ===========================================
// DealFlow360 - Fulfillment List Page
// ===========================================
// DEV B's MODULE: Fulfillment splits with filters and status indicators
// ===========================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// Local enum to avoid importing from @prisma/client in client component
type FulfillmentStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

// Types for fulfillment data
interface FulfillmentSplit {
  id: string;
  quotationLineId: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  quantityFulfilled: number;
  isBackorder: boolean;
  isManualOverride: boolean;
  estimatedShipDate: string | null;
  actualShipDate: string | null;
  status: FulfillmentStatus;
  product: {
    id: string;
    name: string;
    sku: string | null;
    category: string;
  };
  quotation: {
    id: string;
    quotationNumber: string;
    status: string;
    customerName: string;
  };
  lineQuantity: number;
  createdAt: string;
  updatedAt: string;
}

interface FulfillmentSummary {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  backorders: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Status badge colors
const statusColors: Record<FulfillmentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function FulfillmentPage() {
  const [fulfillments, setFulfillments] = useState<FulfillmentSplit[]>([]);
  const [summary, setSummary] = useState<FulfillmentSummary | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [backorderFilter, setBackorderFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/fulfillment?view=summary');
      const data = await res.json();
      if (data.success) {
        setSummary(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  }, []);

  // Fetch fulfillments
  const fetchFulfillments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('pageSize', '20');
      if (statusFilter) params.set('status', statusFilter);
      if (backorderFilter) params.set('isBackorder', backorderFilter);

      const res = await fetch(`/api/fulfillment?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setFulfillments(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.error?.message || 'Failed to fetch fulfillments');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, backorderFilter]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchFulfillments();
  }, [fetchFulfillments]);

  // Filter fulfillments by search query (client-side)
  const filteredFulfillments = fulfillments.filter((f) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      f.product.name.toLowerCase().includes(query) ||
      f.product.sku?.toLowerCase().includes(query) ||
      f.quotation.quotationNumber.toLowerCase().includes(query) ||
      f.quotation.customerName.toLowerCase().includes(query) ||
      f.warehouseName.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fulfillment</h1>
        <Link href="/workspace/fulfillment/warehouses" className="btn-primary">
          Manage Warehouses
        </Link>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <SummaryCard label="Total" value={summary.total} color="gray" />
          <SummaryCard label="Pending" value={summary.pending} color="yellow" />
          <SummaryCard label="Processing" value={summary.processing} color="blue" />
          <SummaryCard label="Shipped" value={summary.shipped} color="purple" />
          <SummaryCard label="Delivered" value={summary.delivered} color="green" />
          <SummaryCard label="Cancelled" value={summary.cancelled} color="red" />
          <SummaryCard label="Backorders" value={summary.backorders} color="orange" highlight />
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search by product, quote #, customer..."
            className="input-field flex-1 min-w-[200px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="input-field w-40"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            className="input-field w-40"
            value={backorderFilter}
            onChange={(e) => {
              setBackorderFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Orders</option>
            <option value="true">Backorders Only</option>
            <option value="false">Regular Orders</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="card mb-6 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
          <button onClick={fetchFulfillments} className="btn-secondary mt-2">
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      )}

      {/* Fulfillment Table */}
      {!loading && !error && (
        <div className="card overflow-hidden">
          {filteredFulfillments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No fulfillment records found.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quotation
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Warehouse
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Est. Ship
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Flags
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFulfillments.map((f) => (
                      <tr key={f.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {f.product.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {f.product.sku || 'No SKU'} | {f.product.category}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900">
                            {f.quotation.quotationNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            {f.quotation.customerName}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900">
                            {f.warehouseName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {f.warehouseCode}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm font-medium">
                            {f.quantityFulfilled}
                          </span>
                          <span className="text-xs text-gray-500">
                            /{f.lineQuantity}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[f.status]}`}
                          >
                            {f.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {formatDate(f.estimatedShipDate)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex justify-center gap-1">
                            {f.isBackorder && (
                              <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded">
                                Backorder
                              </span>
                            )}
                            {f.isManualOverride && (
                              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded">
                                Manual
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Link
                            href={`/workspace/fulfillment/${f.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="btn-secondary disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage === pagination.totalPages}
                      className="btn-secondary disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Summary Card Component
function SummaryCard({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: number;
  color: string;
  highlight?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-50 border-gray-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    orange: 'bg-orange-50 border-orange-200',
  };

  return (
    <div
      className={`p-4 rounded-lg border ${colorClasses[color]} ${
        highlight ? 'ring-2 ring-orange-300' : ''
      }`}
    >
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Order {
  id: string;
  orderNumber: string;
  quotationId: string;
  status: 'PROCESSING' | 'PARTIALLY_SHIPPED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  confirmedAt: string;
  lines: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    fulfillment: Array<{
      id: string;
      warehouseName: string;
      quantity: number;
      status: string;
      estimatedShipDate: string | null;
      actualShipDate: string | null;
      isBackorder: boolean;
    }>;
  }>;
  fulfillmentSummary: {
    totalItems: number;
    shipped: number;
    pending: number;
    delivered: number;
  };
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PROCESSING: { label: 'Processing', className: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' },
  PARTIALLY_SHIPPED: { label: 'Partially Shipped', className: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' },
  SHIPPED: { label: 'Shipped', className: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20' },
  DELIVERED: { label: 'Delivered', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' },
  CANCELLED: { label: 'Cancelled', className: 'bg-slate-100 text-slate-500' },
};

const filterOptions = [
  { value: 'all', label: 'All Orders' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'PARTIALLY_SHIPPED', label: 'Partially Shipped' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
];

export default function PortalOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    if (!hasLoaded) setLoading(true);
    setError(null);

    const endpoint = statusFilter === 'all' 
      ? '/portal/orders' 
      : `/portal/orders?status=${statusFilter}`;

    const res = await api.get<Order[]>(endpoint);
    
    if (res.success && res.data) {
      setOrders(res.data);
    } else {
      setError(res.error?.message || 'Failed to load orders');
    }
    
    setLoading(false);
    setHasLoaded(true);
  };

  // Only show skeleton on very first load
  const showSkeleton = loading && !hasLoaded;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
          <p className="text-slate-500 mt-1">Track your orders and shipments</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input text-sm"
          >
            {filterOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button 
            onClick={fetchOrders}
            className="btn-secondary btn-sm"
          >
            <RefreshIcon />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {showSkeleton ? (
        <ListSkeleton />
      ) : error ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
            <AlertIcon className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchOrders} className="btn-primary">
            Try Again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <EmptyState statusFilter={statusFilter} />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {/* Legend */}
      {orders.length > 0 && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <p className="text-xs text-slate-500 mb-2 font-medium">Progress bar legend</p>
          <div className="flex flex-wrap gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-500 rounded-sm" /> Delivered
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-purple-500 rounded-sm" /> Shipped
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-slate-200 rounded-sm" /> Pending
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const status = statusConfig[order.status] || statusConfig.PROCESSING;
  const summary = order.fulfillmentSummary;
  const total = summary.totalItems || 1;
  const deliveredPct = (summary.delivered / total) * 100;
  const shippedPct = (summary.shipped / total) * 100;

  return (
    <Link
      href={`/portal/orders/${order.id}`}
      className="block bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
    >
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-slate-900">
                Order #{order.orderNumber}
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${status.className}`}>
                {status.label}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Confirmed on {formatDate(order.confirmedAt)}
            </p>
          </div>
          <p className="text-xl font-bold text-slate-900">
            {formatCurrency(order.totalAmount)}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
          <div className="h-full flex">
            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${deliveredPct}%` }} />
            <div className="bg-purple-500 h-full transition-all" style={{ width: `${shippedPct}%` }} />
          </div>
        </div>

        {/* Fulfillment Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="text-slate-500">
              <span className="font-medium text-slate-700">{summary.totalItems}</span> items
            </span>
            {summary.delivered > 0 && (
              <span className="text-emerald-600">
                <span className="font-medium">{summary.delivered}</span> delivered
              </span>
            )}
            {summary.shipped > 0 && (
              <span className="text-purple-600">
                <span className="font-medium">{summary.shipped}</span> shipped
              </span>
            )}
            {summary.pending > 0 && (
              <span className="text-slate-500">
                <span className="font-medium">{summary.pending}</span> pending
              </span>
            )}
          </div>
          <span className="text-emerald-600 font-medium flex items-center gap-1">
            View Details <ChevronRightIcon />
          </span>
        </div>

        {/* Line Items Preview */}
        {order.lines.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap gap-2">
              {order.lines.slice(0, 3).map((line) => (
                <span 
                  key={line.id}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600"
                >
                  {line.quantity}x {line.productName}
                </span>
              ))}
              {order.lines.length > 3 && (
                <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-500">
                  +{order.lines.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

function EmptyState({ statusFilter }: { statusFilter: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
        <PackageIcon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-1">No orders yet</h3>
      <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
        {statusFilter !== 'all' 
          ? `No ${filterOptions.find(o => o.value === statusFilter)?.label.toLowerCase()} orders found.`
          : 'Your confirmed orders will appear here.'}
      </p>
      <Link href="/portal/quotations" className="btn-primary bg-emerald-600 hover:bg-emerald-700">
        View Quotations
      </Link>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="h-5 bg-slate-200 rounded w-32 mb-2" />
              <div className="h-4 bg-slate-100 rounded w-24" />
            </div>
            <div className="h-6 bg-slate-200 rounded w-24" />
          </div>
          <div className="h-2 bg-slate-100 rounded-full w-full mb-3" />
          <div className="flex gap-4">
            <div className="h-4 bg-slate-100 rounded w-20" />
            <div className="h-4 bg-slate-100 rounded w-20" />
          </div>
        </div>
      ))}
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Icons
function RefreshIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function AlertIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PackageIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
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

// ===========================================
// DealFlow360 - Portal Orders Page
// ===========================================
// Full orders list with fulfillment tracking
// ===========================================

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

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  PROCESSING: { label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: '⏳' },
  PARTIALLY_SHIPPED: { label: 'Partially Shipped', color: 'bg-yellow-100 text-yellow-800', icon: '📦' },
  SHIPPED: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: '🚚' },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: '✅' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: '❌' },
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
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
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
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getProgressBar = (summary: Order['fulfillmentSummary']) => {
    const total = summary.totalItems;
    if (total === 0) return null;

    const deliveredPct = (summary.delivered / total) * 100;
    const shippedPct = (summary.shipped / total) * 100;

    return (
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div className="h-full flex">
          <div 
            className="bg-green-500 h-full transition-all" 
            style={{ width: `${deliveredPct}%` }}
          />
          <div 
            className="bg-purple-500 h-full transition-all" 
            style={{ width: `${shippedPct}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {filterOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button 
            onClick={fetchOrders}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchOrders}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <span className="text-5xl mb-4 block">📦</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-4">
            {statusFilter !== 'all' 
              ? `No ${filterOptions.find(o => o.value === statusFilter)?.label.toLowerCase()} orders found.`
              : 'Your confirmed orders will appear here.'}
          </p>
          <Link 
            href="/portal/quotations"
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            View your quotations →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.PROCESSING;
            const summary = order.fulfillmentSummary;

            return (
              <Link
                key={order.id}
                href={`/portal/orders/${order.id}`}
                className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.orderNumber}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                          {status.icon} {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Confirmed on {formatDate(order.confirmedAt)}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      ${order.totalAmount.toLocaleString()}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    {getProgressBar(summary)}
                  </div>

                  {/* Fulfillment Summary */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex gap-4">
                      <span className="text-gray-500">
                        <span className="font-medium text-gray-700">{summary.totalItems}</span> items
                      </span>
                      {summary.delivered > 0 && (
                        <span className="text-green-600">
                          <span className="font-medium">{summary.delivered}</span> delivered
                        </span>
                      )}
                      {summary.shipped > 0 && (
                        <span className="text-purple-600">
                          <span className="font-medium">{summary.shipped}</span> shipped
                        </span>
                      )}
                      {summary.pending > 0 && (
                        <span className="text-gray-500">
                          <span className="font-medium">{summary.pending}</span> pending
                        </span>
                      )}
                    </div>
                    <span className="text-emerald-600 font-medium">View Details →</span>
                  </div>

                  {/* Line Items Preview */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2">
                      {order.lines.slice(0, 3).map((line) => (
                        <span 
                          key={line.id}
                          className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                        >
                          {line.quantity}x {line.productName}
                        </span>
                      ))}
                      {order.lines.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">
                          +{order.lines.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Legend */}
      {orders.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-2">Progress bar legend:</p>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-500 rounded"></span> Delivered
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-purple-500 rounded"></span> Shipped
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-gray-200 rounded"></span> Pending
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

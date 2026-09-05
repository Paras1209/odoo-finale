// ===========================================
// DealFlow360 - Portal Order Detail Page
// ===========================================
// Detailed order view with fulfillment tracking
// ===========================================

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  confirmedAt: string;
  estimatedDelivery: string | null;
  salesRep: {
    name: string;
    email: string;
  };
  lines: Array<{
    id: string;
    productId: string;
    productName: string;
    productSku: string | null;
    productCategory: string;
    quantity: number;
    unitPrice: number;
    discountPct: number;
    lineTotal: number;
    lineType: string;
    fulfillment: Array<{
      id: string;
      warehouseId: string;
      warehouseName: string;
      warehouseAddress: string | null;
      quantity: number;
      status: string;
      estimatedShipDate: string | null;
      actualShipDate: string | null;
      isBackorder: boolean;
      isManualOverride: boolean;
    }>;
  }>;
  fulfillmentSummary: {
    totalItems: number;
    shipped: number;
    pending: number;
    delivered: number;
    progressPercent: number;
  };
  timeline: Array<{
    date: string;
    event: string;
    description: string;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    status: string;
    issuedAt: string | null;
  }>;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  PROCESSING: { label: 'Processing', color: 'text-blue-800', bgColor: 'bg-blue-100', icon: '⏳' },
  PARTIALLY_SHIPPED: { label: 'Partially Shipped', color: 'text-yellow-800', bgColor: 'bg-yellow-100', icon: '📦' },
  SHIPPED: { label: 'Shipped', color: 'text-purple-800', bgColor: 'bg-purple-100', icon: '🚚' },
  DELIVERED: { label: 'Delivered', color: 'text-green-800', bgColor: 'bg-green-100', icon: '✅' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-800', bgColor: 'bg-red-100', icon: '❌' },
};

const fulfillmentStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'text-gray-600 bg-gray-100' },
  PROCESSING: { label: 'Processing', color: 'text-blue-600 bg-blue-100' },
  SHIPPED: { label: 'Shipped', color: 'text-purple-600 bg-purple-100' },
  DELIVERED: { label: 'Delivered', color: 'text-green-600 bg-green-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-600 bg-red-100' },
};

const invoiceStatusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-600 bg-gray-100' },
  SENT: { label: 'Pending', color: 'text-orange-600 bg-orange-100' },
  PAID: { label: 'Paid', color: 'text-green-600 bg-green-100' },
  OVERDUE: { label: 'Overdue', color: 'text-red-600 bg-red-100' },
};

export default function PortalOrderDetailPage() {
  const { id } = useParams() as { id: string };
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);

    const res = await api.get<OrderDetail>(`/portal/orders/${id}`);
    
    if (res.success && res.data) {
      setOrder(res.data);
    } else {
      setError(res.error?.message || 'Failed to load order');
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

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
        <div className="grid grid-cols-3 gap-6 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded mb-3"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <div className="flex gap-3 justify-center">
          <Link 
            href="/portal/orders"
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Back to Orders
          </Link>
          <button 
            onClick={fetchOrder}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const status = statusConfig[order.status] || statusConfig.PROCESSING;
  const summary = order.fulfillmentSummary;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/portal/orders" className="hover:text-gray-700">Orders</Link>
        <span>/</span>
        <span className="text-gray-900">{order.orderNumber}</span>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.color}`}>
              {status.icon} {status.label}
            </span>
          </div>
          <p className="text-gray-500 mt-1">
            Confirmed on {formatDate(order.confirmedAt)}
          </p>
        </div>
        <p className="text-2xl font-bold text-gray-900">${order.totalAmount.toLocaleString()}</p>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Fulfillment Progress</h2>
          <span className="text-2xl font-bold text-emerald-600">{summary.progressPercent}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-4">
          <div className="h-full flex">
            <div 
              className="bg-green-500 h-full transition-all" 
              style={{ width: `${(summary.delivered / summary.totalItems) * 100}%` }}
            />
            <div 
              className="bg-purple-500 h-full transition-all" 
              style={{ width: `${(summary.shipped / summary.totalItems) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-2xl font-bold text-gray-900">{summary.totalItems}</p>
            <p className="text-xs text-gray-500">Total Items</p>
          </div>
          <div className="p-3 bg-green-50 rounded">
            <p className="text-2xl font-bold text-green-600">{summary.delivered}</p>
            <p className="text-xs text-green-600">Delivered</p>
          </div>
          <div className="p-3 bg-purple-50 rounded">
            <p className="text-2xl font-bold text-purple-600">{summary.shipped}</p>
            <p className="text-xs text-purple-600">Shipped</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-2xl font-bold text-gray-600">{summary.pending}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
        </div>

        {order.estimatedDelivery && summary.progressPercent < 100 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
            <span>📅</span>
            <p className="text-sm text-blue-700">
              <span className="font-medium">Estimated delivery:</span> {formatDate(order.estimatedDelivery)}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Order Items */}
        <div className="col-span-2 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {order.lines.map((line) => (
              <div key={line.id} className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{line.productName}</h3>
                    {line.productSku && (
                      <p className="text-xs text-gray-500">SKU: {line.productSku}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${line.lineTotal.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      {line.quantity} × ${line.unitPrice.toFixed(2)}
                      {line.discountPct > 0 && (
                        <span className="text-green-600 ml-1">(-{line.discountPct}%)</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Fulfillment Details */}
                {line.fulfillment.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {line.fulfillment.map((f) => {
                      const fStatus = fulfillmentStatusConfig[f.status] || fulfillmentStatusConfig.PENDING;
                      return (
                        <div 
                          key={f.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${fStatus.color}`}>
                              {fStatus.label}
                            </span>
                            <span className="text-gray-600">
                              {f.quantity} from {f.warehouseName}
                            </span>
                            {f.isBackorder && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                                Backorder
                              </span>
                            )}
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            {f.status === 'SHIPPED' || f.status === 'DELIVERED' ? (
                              f.actualShipDate && <span>Shipped {formatDate(f.actualShipDate)}</span>
                            ) : (
                              f.estimatedShipDate && <span>Est. ship {formatDate(f.estimatedShipDate)}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-500">
                    Awaiting fulfillment allocation
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {order.timeline.map((event, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      {index < order.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-gray-900">{event.event}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDateTime(event.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Related Invoices */}
          {order.invoices.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {order.invoices.map((invoice) => {
                  const invStatus = invoiceStatusConfig[invoice.status] || invoiceStatusConfig.DRAFT;
                  return (
                    <Link
                      key={invoice.id}
                      href="/portal/invoices"
                      className="flex items-center justify-between p-4 hover:bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-gray-500">
                          ${invoice.totalAmount.toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${invStatus.color}`}>
                        {invStatus.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sales Rep Contact */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h2>
            <p className="text-sm text-gray-600 mb-3">Contact your sales representative:</p>
            <div className="p-3 bg-gray-50 rounded">
              <p className="font-medium text-gray-900">{order.salesRep.name}</p>
              <a 
                href={`mailto:${order.salesRep.email}`}
                className="text-sm text-emerald-600 hover:text-emerald-700"
              >
                {order.salesRep.email}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="mt-6">
        <Link 
          href="/portal/orders"
          className="text-emerald-600 hover:text-emerald-700 font-medium"
        >
          ← Back to Orders
        </Link>
      </div>
    </div>
  );
}

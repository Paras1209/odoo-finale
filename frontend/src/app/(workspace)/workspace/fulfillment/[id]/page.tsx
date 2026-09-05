// ===========================================
// DealFlow360 - Fulfillment Detail Page
// ===========================================
// DEV B's MODULE: Split view with status transitions and override UI
// ===========================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Local enum to avoid importing from @prisma/client in client component
type FulfillmentStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

// Types
interface FulfillmentDetail {
  id: string;
  quotationLineId: string;
  warehouseId: string;
  warehouse: {
    id: string;
    name: string;
    code: string;
    address: string;
  };
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
    customer: {
      id: string;
      name: string;
      companyName: string | null;
    };
    rep: {
      id: string;
      name: string;
    } | null;
  };
  lineQuantity: number;
  lineUnitPrice: number;
  lineTotal: number;
  createdAt: string;
  updatedAt: string;
}

// Valid transitions per status
const VALID_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

// Status badge colors
const statusColors: Record<FulfillmentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  PROCESSING: 'bg-blue-100 text-blue-800 border-blue-300',
  SHIPPED: 'bg-purple-100 text-purple-800 border-purple-300',
  DELIVERED: 'bg-green-100 text-green-800 border-green-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
};

export default function FulfillmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  const [fulfillment, setFulfillment] = useState<FulfillmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [shipDate, setShipDate] = useState('');

  // Fetch fulfillment details
  const fetchFulfillment = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fulfillment/${id}`);
      const data = await res.json();

      if (data.success) {
        setFulfillment(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch fulfillment');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchFulfillment();
    }
  }, [id, fetchFulfillment]);

  // Handle status transition
  const handleTransition = async (newStatus: FulfillmentStatus, actualShipDate?: string) => {
    if (!fulfillment) return;

    setTransitioning(true);
    try {
      const body: { status: FulfillmentStatus; actualShipDate?: string } = { status: newStatus };
      if (actualShipDate) {
        body.actualShipDate = new Date(actualShipDate).toISOString();
      }

      const res = await fetch(`/api/fulfillment/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        await fetchFulfillment();
        setShowShipModal(false);
        setShipDate('');
      } else {
        alert(data.error?.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Network error. Please try again.');
      console.error('Transition error:', err);
    } finally {
      setTransitioning(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="card">
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !fulfillment) {
    return (
      <div className="card bg-red-50 border-red-200">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
        <p className="text-red-700">{error || 'Fulfillment not found'}</p>
        <div className="mt-4 flex gap-2">
          <button onClick={fetchFulfillment} className="btn-secondary">
            Retry
          </button>
          <Link href="/workspace/fulfillment" className="btn-secondary">
            Back to List
          </Link>
        </div>
      </div>
    );
  }

  const validTransitions = VALID_TRANSITIONS[fulfillment.status] || [];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link
            href="/workspace/fulfillment"
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            &larr; Back to Fulfillment List
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Fulfillment Split
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            ID: {fulfillment?.id?.slice(0, 8) || 'N/A'}...
          </p>
        </div>
        <div className="text-right">
          <span
            className={`inline-block px-4 py-2 text-sm font-semibold rounded-lg border ${statusColors[fulfillment?.status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}
          >
            {fulfillment?.status || 'Unknown'}
          </span>
        </div>
      </div>

      {/* Flags */}
      {(fulfillment?.isBackorder || fulfillment?.isManualOverride) && (
        <div className="flex gap-2 mb-6">
          {fulfillment?.isBackorder && (
            <div className="px-3 py-2 bg-orange-100 border border-orange-300 rounded-lg text-orange-800 text-sm">
              <strong>Backorder</strong> - Stock was insufficient, awaiting replenishment
            </div>
          )}
          {fulfillment?.isManualOverride && (
            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 text-sm">
              <strong>Manual Override</strong> - Warehouse allocation was manually adjusted
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase">Product Name</label>
                <p className="text-gray-900 font-medium">{fulfillment?.product?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">SKU</label>
                <p className="text-gray-900">{fulfillment?.product?.sku || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Category</label>
                <p className="text-gray-900">{fulfillment?.product?.category || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Unit Price</label>
                <p className="text-gray-900">{formatCurrency(fulfillment?.lineUnitPrice ?? 0)}</p>
              </div>
            </div>
          </div>

          {/* Fulfillment Details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Fulfillment Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase">Quantity Fulfilled</label>
                <p className="text-2xl font-bold text-gray-900">{fulfillment?.quantityFulfilled ?? 0}</p>
                <p className="text-xs text-gray-500">of {fulfillment?.lineQuantity ?? 0} ordered</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Line Total</label>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(fulfillment?.lineTotal ?? 0)}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Est. Ship Date</label>
                <p className="text-gray-900">{formatDate(fulfillment?.estimatedShipDate ?? null)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Actual Ship Date</label>
                <p className="text-gray-900">{formatDate(fulfillment?.actualShipDate ?? null)}</p>
              </div>
            </div>
          </div>

          {/* Warehouse Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Warehouse</h2>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">
                  {fulfillment?.warehouse?.code?.slice(0, 2) || 'WH'}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{fulfillment?.warehouse?.name || 'N/A'}</p>
                <p className="text-sm text-gray-500">Code: {fulfillment?.warehouse?.code || 'N/A'}</p>
                <p className="text-sm text-gray-500 mt-1">{fulfillment?.warehouse?.address || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            {validTransitions.length > 0 ? (
              <div className="space-y-3">
                {validTransitions.includes('PROCESSING') && (
                  <button
                    onClick={() => handleTransition('PROCESSING')}
                    disabled={transitioning}
                    className="w-full btn-primary disabled:opacity-50"
                  >
                    {transitioning ? 'Processing...' : 'Start Processing'}
                  </button>
                )}
                {validTransitions.includes('SHIPPED') && (
                  <button
                    onClick={() => setShowShipModal(true)}
                    disabled={transitioning}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                  >
                    Mark as Shipped
                  </button>
                )}
                {validTransitions.includes('DELIVERED') && (
                  <button
                    onClick={() => handleTransition('DELIVERED')}
                    disabled={transitioning}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                  >
                    {transitioning ? 'Processing...' : 'Mark as Delivered'}
                  </button>
                )}
                {validTransitions.includes('CANCELLED') && (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel this fulfillment? Stock will be released.')) {
                        handleTransition('CANCELLED');
                      }
                    }}
                    disabled={transitioning}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                  >
                    Cancel Fulfillment
                  </button>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No actions available for {fulfillment?.status || 'unknown'} status.
              </p>
            )}
          </div>

          {/* Quotation Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quotation</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase">Quote Number</label>
                <p className="text-gray-900 font-medium">
                  {fulfillment?.quotation?.quotationNumber || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Customer</label>
                <p className="text-gray-900">
                  {fulfillment?.quotation?.customer?.companyName || fulfillment?.quotation?.customer?.name || 'N/A'}
                </p>
              </div>
              {fulfillment?.quotation?.rep && (
                <div>
                  <label className="text-xs text-gray-500 uppercase">Sales Rep</label>
                  <p className="text-gray-900">{fulfillment.quotation.rep.name}</p>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 uppercase">Quote Status</label>
                <p className="text-gray-900">{fulfillment?.quotation?.status || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase">Created</label>
                <p className="text-gray-900">{formatDate(fulfillment?.createdAt ?? null)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Last Updated</label>
                <p className="text-gray-900">{formatDate(fulfillment?.updatedAt ?? null)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ship Modal */}
      {showShipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Mark as Shipped</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actual Ship Date
              </label>
              <input
                type="date"
                value={shipDate}
                onChange={(e) => setShipDate(e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowShipModal(false);
                  setShipDate('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleTransition('SHIPPED', shipDate || undefined)}
                disabled={transitioning}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                {transitioning ? 'Processing...' : 'Confirm Shipped'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

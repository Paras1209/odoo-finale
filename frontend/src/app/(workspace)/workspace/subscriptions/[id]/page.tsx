"use client";

// ===========================================
// DealFlow360 - Subscription Detail Page (Screen 10)
// ===========================================
// M4 - Dev A: Subscription detail with billing schedule,
// modify and cancel actions with proration preview
// ===========================================

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface BillingSchedule {
  id: string;
  cycleNumber: number;
  dueDate: string;
  amount: number;
  status: 'UPCOMING' | 'INVOICED' | 'PAID' | 'REFUNDED' | 'CANCELLED';
  invoiceId: string | null;
}

interface Subscription {
  id: string;
  productId: string;
  productName: string;
  productSku: string | null;
  productCategory: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  lineTotal: number;
  marginAmount: number;
  marginPct: number;
  billingFrequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  lineType: string;
  subscriptionPlan: {
    id: string;
    name: string;
    frequency: string;
    prorationRule: string;
    trialDays: number;
  } | null;
  quotation: {
    id: string;
    quotationNumber: string;
    status: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
    tier: string;
    companyName: string | null;
  };
  rep: {
    id: string;
    name: string;
    email: string;
  };
  subscriptionStatus: 'ACTIVE' | 'CANCELLED' | 'COMPLETED' | 'PENDING';
  totalSchedules: number;
  upcomingCount: number;
  paidCount: number;
  cancelledCount: number;
  nextBillingDate: string | null;
  nextBillingAmount: number | null;
  lastPaymentDate: string | null;
  totalPaid: number;
  totalRemaining: number;
  billingSchedules: BillingSchedule[];
  createdAt: string;
  updatedAt: string;
}

interface ProrationPreview {
  currentQuantity: number;
  newQuantity: number;
  currentAmount: number;
  newAmount: number;
  amountDifference: number;
  proration: {
    adjustmentAmount: number;
    daysRemaining: number;
    totalDays: number;
    fractionRemaining: number;
    description: string;
  };
  effectiveDate: string;
}

interface CancelPreview {
  currentAmount: number;
  refundAmount: number;
  daysRemaining: number;
  totalDays: number;
  fractionRemaining: number;
  description: string;
  cancelDate: string;
  upcomingSchedulesToCancel: number;
}

export default function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modify modal state
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [newQuantity, setNewQuantity] = useState(1);
  const [modifyPreview, setModifyPreview] = useState<ProrationPreview | null>(null);
  const [modifyLoading, setModifyLoading] = useState(false);
  
  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelPreview, setCancelPreview] = useState<CancelPreview | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, [resolvedParams.id]);

  const fetchSubscription = async () => {
    setLoading(true);
    setError(null);
    
    const res = await api.get<any>(`/billing/subscriptions/${resolvedParams.id}`);
    if (res.success && res.data) {
      setSubscription(res.data.data || res.data);
      setNewQuantity(res.data.data?.quantity || res.data.quantity || 1);
    } else {
      setError(res.error?.message || 'Failed to load subscription');
    }
    setLoading(false);
  };

  const fetchModifyPreview = async (qty: number) => {
    setModifyLoading(true);
    const res = await api.post<any>(`/billing/subscriptions/${resolvedParams.id}?action=preview-modify`, {
      newQuantity: qty,
    });
    if (res.success && res.data) {
      setModifyPreview(res.data.data || res.data);
    }
    setModifyLoading(false);
  };

  const fetchCancelPreview = async () => {
    setCancelLoading(true);
    const res = await api.post<any>(`/billing/subscriptions/${resolvedParams.id}?action=preview-cancel`, {});
    if (res.success && res.data) {
      setCancelPreview(res.data.data || res.data);
    }
    setCancelLoading(false);
  };

  const handleModify = async () => {
    setActionLoading(true);
    const res = await api.post<any>(`/billing/subscriptions/${resolvedParams.id}?action=modify`, {
      newQuantity,
    });
    setActionLoading(false);
    
    if (res.success) {
      setShowModifyModal(false);
      fetchSubscription();
      alert(res.data.message || 'Subscription modified successfully');
    } else {
      alert(res.error?.message || 'Failed to modify subscription');
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }
    
    setActionLoading(true);
    const res = await api.post<any>(`/billing/subscriptions/${resolvedParams.id}?action=cancel`, {
      reason: cancelReason,
    });
    setActionLoading(false);
    
    if (res.success) {
      setShowCancelModal(false);
      fetchSubscription();
      alert(res.data.message || 'Subscription cancelled successfully');
    } else {
      alert(res.error?.message || 'Failed to cancel subscription');
    }
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

  const getScheduleStatusBadge = (status: string) => {
    switch (status) {
      case 'UPCOMING': return 'bg-blue-100 text-blue-700';
      case 'INVOICED': return 'bg-yellow-100 text-yellow-700';
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'REFUNDED': return 'bg-purple-100 text-purple-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatFrequency = (frequency: string) => {
    return frequency.charAt(0) + frequency.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading subscription...</p>
        </div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-gray-500 text-lg">{error || 'Subscription not found'}</p>
          <Link href="/workspace/subscriptions" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to Subscriptions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/workspace/subscriptions" className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{subscription.productName}</h1>
            <span className={`px-2 py-1 rounded text-sm font-semibold ${getStatusBadgeClass(subscription.subscriptionStatus)}`}>
              {subscription.subscriptionStatus}
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            {subscription.productSku && <span className="mr-2">SKU: {subscription.productSku}</span>}
            Billed {formatFrequency(subscription.billingFrequency)}
          </p>
        </div>
        <div className="flex gap-2">
          {subscription.subscriptionStatus === 'ACTIVE' && (
            <>
              <button
                onClick={() => { setShowModifyModal(true); fetchModifyPreview(subscription.quantity); }}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50"
              >
                Modify
              </button>
              <button
                onClick={() => { setShowCancelModal(true); fetchCancelPreview(); }}
                className="px-4 py-2 border border-red-600 text-red-600 rounded-lg font-medium hover:bg-red-50"
              >
                Cancel Subscription
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subscription Details Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Quantity</p>
                <p className="font-medium">{subscription.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unit Price</p>
                <p className="font-medium">${subscription.unitPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Discount</p>
                <p className="font-medium">{subscription.discountPct}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount per Cycle</p>
                <p className="font-medium text-lg">${subscription.lineTotal.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Margin</p>
                <p className="font-medium">${subscription.marginAmount.toFixed(2)} ({subscription.marginPct.toFixed(1)}%)</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Billing Frequency</p>
                <p className="font-medium">{formatFrequency(subscription.billingFrequency)}</p>
              </div>
            </div>
          </div>

          {/* Billing Schedule */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing Schedule</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-sm font-semibold text-gray-600">#</th>
                    <th className="px-4 py-2 text-sm font-semibold text-gray-600">Due Date</th>
                    <th className="px-4 py-2 text-sm font-semibold text-gray-600 text-right">Amount</th>
                    <th className="px-4 py-2 text-sm font-semibold text-gray-600 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {subscription.billingSchedules.map(schedule => (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{schedule.cycleNumber}</td>
                      <td className="px-4 py-2 text-sm">
                        {new Date(schedule.dueDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-medium">${schedule.amount.toFixed(2)}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getScheduleStatusBadge(schedule.status)}`}>
                          {schedule.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Paid</span>
                <span className="font-semibold text-green-600">${subscription.totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Remaining</span>
                <span className="font-semibold">${subscription.totalRemaining.toFixed(2)}</span>
              </div>
              <hr />
              <div className="flex justify-between">
                <span className="text-gray-500">Cycles Paid</span>
                <span className="font-medium">{subscription.paidCount} / {subscription.totalSchedules}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${(subscription.paidCount / subscription.totalSchedules) * 100}%` }}
                ></div>
              </div>
              {subscription.nextBillingDate && (
                <div className="pt-2">
                  <p className="text-sm text-gray-500">Next Billing</p>
                  <p className="font-medium">{new Date(subscription.nextBillingDate).toLocaleDateString()}</p>
                  {subscription.nextBillingAmount && (
                    <p className="text-sm text-gray-500">${subscription.nextBillingAmount.toFixed(2)}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Customer Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
            <div className="space-y-2">
              <p className="font-medium">{subscription.customer.name}</p>
              {subscription.customer.companyName && (
                <p className="text-sm text-gray-500">{subscription.customer.companyName}</p>
              )}
              <p className="text-sm text-gray-500">{subscription.customer.email}</p>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                subscription.customer.tier === 'GOLD' ? 'bg-yellow-100 text-yellow-700' :
                subscription.customer.tier === 'SILVER' ? 'bg-gray-200 text-gray-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {subscription.customer.tier}
              </span>
            </div>
          </div>

          {/* Related Quotation */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Quotation</h2>
            <Link 
              href={`/workspace/quotations/${subscription.quotation.id}`}
              className="text-blue-600 hover:underline font-medium"
            >
              {subscription.quotation.quotationNumber}
            </Link>
            <p className="text-sm text-gray-500 mt-1">Status: {subscription.quotation.status.replace(/_/g, ' ')}</p>
            <p className="text-sm text-gray-500">Rep: {subscription.rep.name}</p>
          </div>
        </div>
      </div>

      {/* Modify Modal */}
      {showModifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Modify Subscription</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">New Quantity</label>
              <input
                type="number"
                min="1"
                value={newQuantity}
                onChange={(e) => {
                  const qty = parseInt(e.target.value) || 1;
                  setNewQuantity(qty);
                  fetchModifyPreview(qty);
                }}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {modifyLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : modifyPreview && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Proration Preview</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Current Amount:</span>
                    <span>${modifyPreview.currentAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New Amount:</span>
                    <span>${modifyPreview.newAmount.toFixed(2)}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span>Adjustment:</span>
                    <span className={modifyPreview.proration.adjustmentAmount < 0 ? 'text-green-600' : 'text-orange-600'}>
                      {modifyPreview.proration.adjustmentAmount < 0 ? '-' : '+'}${Math.abs(modifyPreview.proration.adjustmentAmount).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{modifyPreview.proration.description}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModifyModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleModify}
                disabled={actionLoading || newQuantity === subscription.quantity}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Apply Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Cancel Subscription</h3>
            
            {cancelLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : cancelPreview && (
              <div className="bg-red-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-sm text-red-700 mb-2">Cancellation Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Schedules to Cancel:</span>
                    <span>{cancelPreview.upcomingSchedulesToCancel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prorated Refund:</span>
                    <span className="text-green-600">${cancelPreview.refundAmount.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{cancelPreview.description}</p>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Cancellation *</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason..."
                className="w-full border rounded-lg px-3 py-2 h-24"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading || !cancelReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

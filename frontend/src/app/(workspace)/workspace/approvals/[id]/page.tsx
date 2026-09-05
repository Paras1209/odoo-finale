"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface ApprovalDetail {
  id: string;
  level: string;
  status: string;
  reason: string | null;
  actedAt: string | null;
  createdAt: string;
  approver: {
    id: string;
    name: string;
    email: string;
  } | null;
  quotation: {
    id: string;
    quotationNumber: string;
    status: string;
    totalAmount: number;
    totalMargin: number;
    blendedRiskScore: number | null;
    customer: {
      id: string;
      name: string;
      tier: string;
      email: string;
    };
    rep: {
      id: string;
      name: string;
      email: string;
    };
    lines: Array<{
      id: string;
      productName: string;
      productCategory: string;
      quantity: number;
      unitPrice: number;
      discountPct: number;
      lineTotal: number;
    }>;
  };
}

export default function ApprovalDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [approval, setApproval] = useState<ApprovalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchApproval();
  }, [id]);

  const fetchApproval = async () => {
    setLoading(true);
    const res = await api.get<any>(`/approval/${id}`);
    if (res.success && res.data) {
      setApproval(res.data);
    }
    setLoading(false);
  };

  const handleAction = async (action: 'APPROVE' | 'REJECT' | 'RETURN') => {
    if ((action === 'REJECT' || action === 'RETURN') && !reason.trim()) {
      alert('Please provide a reason');
      return;
    }

    setActionLoading(true);
    const res = await api.post<any>(`/approval/${id}/action`, {
      action,
      reason: reason.trim() || undefined,
    });

    if (res.success) {
      alert(`Approval ${action.toLowerCase()}ed successfully!`);
      router.push('/workspace/approvals');
    } else {
      alert(res.error?.message || `Failed to ${action.toLowerCase()} approval`);
    }
    setActionLoading(false);
    setShowRejectModal(false);
    setShowReturnModal(false);
    setReason('');
  };

  const getRiskBadgeColor = (score: number | null) => {
    if (score === null || score === 0) return 'bg-green-100 text-green-800';
    if (score <= 5) return 'bg-yellow-100 text-yellow-800';
    if (score <= 10) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getDiscountBadgeColor = (discountPct: number, category: string) => {
    // Simple heuristic - higher discounts are riskier
    if (discountPct === 0) return 'text-gray-600';
    if (discountPct <= 10) return 'text-green-600';
    if (discountPct <= 15) return 'text-yellow-600';
    return 'text-red-600 font-semibold';
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500">Loading approval details...</p>
      </div>
    );
  }

  if (!approval) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 text-lg">Approval not found</p>
        <Link href="/workspace/approvals" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Approvals
        </Link>
      </div>
    );
  }

  const isPending = approval.status === 'PENDING';

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link href="/workspace/approvals" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
            ← Back to Approvals
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Approval Request for {approval.quotation.quotationNumber}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-3 py-1 rounded text-sm font-semibold ${
              approval.level === 'MANAGER' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
            }`}>
              {approval.level} APPROVAL
            </span>
            <span className={`px-3 py-1 rounded text-sm font-semibold ${
              approval.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
              approval.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
              approval.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {approval.status}
            </span>
          </div>
        </div>
        
        {isPending && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowReturnModal(true)}
              disabled={actionLoading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Return to Rep
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={() => handleAction('APPROVE')}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>}
              Approve
            </button>
          </div>
        )}
      </div>

      {/* Risk Score Banner */}
      <div className={`p-4 rounded-lg mb-6 ${
        (approval.quotation.blendedRiskScore ?? 0) > 10 ? 'bg-red-50 border border-red-200' :
        (approval.quotation.blendedRiskScore ?? 0) > 5 ? 'bg-yellow-50 border border-yellow-200' :
        (approval.quotation.blendedRiskScore ?? 0) > 0 ? 'bg-orange-50 border border-orange-200' :
        'bg-green-50 border border-green-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Risk Assessment</h3>
            <p className="text-sm text-gray-600 mt-1">
              {(approval.quotation.blendedRiskScore ?? 0) === 0 
                ? 'No discount violations detected'
                : `Blended risk score indicates discount violations that require ${approval.level.toLowerCase()} approval`}
            </p>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-bold ${getRiskBadgeColor(approval.quotation.blendedRiskScore).replace('bg-', 'text-').replace('-100', '-700')}`}>
              {approval.quotation.blendedRiskScore?.toFixed(1) ?? '0.0'}
            </span>
            <p className="text-sm text-gray-500">Risk Score</p>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Customer Info */}
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Customer</h3>
          <p className="font-medium text-lg">{approval.quotation.customer.name}</p>
          <p className="text-gray-600 text-sm">{approval.quotation.customer.email}</p>
          <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${
            approval.quotation.customer.tier === 'GOLD' ? 'bg-yellow-100 text-yellow-800' :
            approval.quotation.customer.tier === 'SILVER' ? 'bg-gray-200 text-gray-800' :
            'bg-amber-100 text-amber-800'
          }`}>
            {approval.quotation.customer.tier} TIER
          </span>
        </div>

        {/* Sales Rep Info */}
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Sales Rep</h3>
          <p className="font-medium text-lg">{approval.quotation.rep.name}</p>
          <p className="text-gray-600 text-sm">{approval.quotation.rep.email}</p>
          <p className="text-gray-500 text-xs mt-2">
            Submitted: {new Date(approval.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Quotation Summary */}
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Quote Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-bold text-lg">${approval.quotation.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Margin:</span>
              <span className="font-medium">${approval.quotation.totalMargin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Line Items:</span>
              <span className="font-medium">{approval.quotation.lines.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white shadow rounded overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900">Line Items</h3>
          <p className="text-sm text-gray-500">Review discounts applied to each line item</p>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">Product</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600">Category</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Qty</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Unit Price</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Discount</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {approval.quotation.lines.map((line) => (
              <tr key={line.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{line.productName}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    line.productCategory === 'HARDWARE' ? 'bg-blue-100 text-blue-800' :
                    line.productCategory === 'SERVICE' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {line.productCategory}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{line.quantity}</td>
                <td className="px-4 py-3 text-right">${line.unitPrice.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={getDiscountBadgeColor(line.discountPct, line.productCategory)}>
                    {line.discountPct.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold">${line.lineTotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t">
            <tr>
              <td colSpan={5} className="px-4 py-3 text-right font-semibold">Total:</td>
              <td className="px-4 py-3 text-right font-bold text-lg">${approval.quotation.totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Previous Action Info (if not pending) */}
      {!isPending && approval.approver && (
        <div className="mt-6 bg-white shadow rounded p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Action History</h3>
          <div className="text-sm text-gray-600">
            <p>
              <span className="font-medium">{approval.status}</span> by {approval.approver.name} on{' '}
              {approval.actedAt ? new Date(approval.actedAt).toLocaleString() : 'N/A'}
            </p>
            {approval.reason && (
              <p className="mt-2 p-3 bg-gray-50 rounded border">
                <span className="font-medium">Reason:</span> {approval.reason}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Approval</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this quotation. The sales rep will be notified.
            </p>
            <textarea
              className="w-full border rounded p-3 mb-4 h-32"
              placeholder="Enter rejection reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setReason(''); }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('REJECT')}
                disabled={actionLoading || !reason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Return to Sales Rep</h3>
            <p className="text-gray-600 mb-4">
              The quotation will be returned to DRAFT status. Please provide feedback for the sales rep.
            </p>
            <textarea
              className="w-full border rounded p-3 mb-4 h-32"
              placeholder="Enter feedback or requested changes..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowReturnModal(false); setReason(''); }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('RETURN')}
                disabled={actionLoading || !reason.trim()}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                {actionLoading ? 'Returning...' : 'Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

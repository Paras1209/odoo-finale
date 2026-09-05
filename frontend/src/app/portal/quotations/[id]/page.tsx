"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface QuotationLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  lineTotal: number;
  lineType: string;
}

interface Comment {
  id: string;
  authorType: 'REP' | 'CUSTOMER';
  authorName: string;
  commentText: string;
  quotationLineId: string | null;
  productName: string | null;
  createdAt: string;
}

interface Quotation {
  id: string;
  quotationNumber: string;
  status: string;
  totalAmount: number;
  overallDiscountPct: number;
  validUntil: string | null;
  notes: string | null;
  lastActivityAt: string;
  createdAt: string;
  lines: QuotationLine[];
}

const statusConfig: Record<string, { label: string; color: string; description: string }> = {
  DRAFT: { 
    label: 'In Progress', 
    color: 'bg-gray-100 text-gray-800',
    description: 'Your sales rep is preparing this quotation.'
  },
  PENDING_MANAGER_APPROVAL: { 
    label: 'Under Review', 
    color: 'bg-yellow-100 text-yellow-800',
    description: 'This quotation is being reviewed internally.'
  },
  PENDING_FINANCE_APPROVAL: { 
    label: 'Under Review', 
    color: 'bg-yellow-100 text-yellow-800',
    description: 'This quotation is being reviewed by finance.'
  },
  APPROVED: { 
    label: 'Awaiting Your Review', 
    color: 'bg-blue-100 text-blue-800',
    description: 'This quotation is ready for your review. You can accept or negotiate.'
  },
  REJECTED: { 
    label: 'Declined', 
    color: 'bg-red-100 text-red-800',
    description: 'This quotation was declined.'
  },
  CONFIRMED: { 
    label: 'Confirmed', 
    color: 'bg-green-100 text-green-800',
    description: 'Order confirmed! Check the Orders page for fulfillment status.'
  },
  FULFILLING: { 
    label: 'Fulfilling', 
    color: 'bg-purple-100 text-purple-800',
    description: 'Your order is being processed.'
  },
  BILLED: { 
    label: 'Completed', 
    color: 'bg-green-100 text-green-800',
    description: 'This order has been completed and billed.'
  },
  CANCELLED: { 
    label: 'Cancelled', 
    color: 'bg-gray-100 text-gray-500',
    description: 'This quotation was cancelled.'
  },
};

export default function PortalQuotationDetailPage() {
  const { id } = useParams() as { id: string };
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Negotiation state
  const [counterDiscount, setCounterDiscount] = useState<number>(0);
  const [counterSubmitting, setCounterSubmitting] = useState(false);
  const [acceptSubmitting, setAcceptSubmitting] = useState(false);

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Message state
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchQuotation();
    fetchComments();
  }, [id]);

  const fetchQuotation = async () => {
    setLoading(true);
    setError(null);
    
    const res = await api.get<Quotation>(`/portal/quotations/${id}`);
    if (res.success && res.data) {
      setQuotation(res.data);
      setCounterDiscount(res.data.overallDiscountPct || 0);
    } else {
      setError(res.error?.message || 'Failed to load quotation');
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    const res = await api.get<Comment[]>(`/portal/quotations/${id}/comments`);
    if (res.success && res.data) {
      setComments(res.data);
    }
  };

  const handleAccept = async () => {
    setAcceptSubmitting(true);
    setMessage(null);
    
    const res = await api.post<any>(`/portal/quotations/${id}/confirm`);
    if (res.success) {
      setMessage({ type: 'success', text: 'Quotation confirmed successfully! Check your orders page.' });
      fetchQuotation();
    } else {
      setMessage({ type: 'error', text: res.error?.message || 'Error confirming quotation' });
    }
    setAcceptSubmitting(false);
  };

  const handleCounter = async () => {
    setCounterSubmitting(true);
    setMessage(null);
    
    const res = await api.post<any>(`/portal/quotations/${id}/counter`, {
      discountPct: counterDiscount
    });
    if (res.success) {
      setMessage({ type: 'success', text: 'Counter offer submitted! Your sales rep will review it.' });
      fetchQuotation();
    } else {
      setMessage({ type: 'error', text: res.error?.message || 'Error submitting counter offer' });
    }
    setCounterSubmitting(false);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommentSubmitting(true);
    
    const res = await api.post<Comment>(`/portal/quotations/${id}/comments`, {
      commentText: newComment.trim(),
      quotationLineId: selectedLineId,
    });
    
    if (res.success && res.data) {
      setComments([...comments, res.data]);
      setNewComment('');
      setSelectedLineId(null);
    }
    setCommentSubmitting(false);
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
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-lg shadow p-6">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded mb-2"></div>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="h-32 bg-gray-100 rounded"></div>
          </div>
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
            href="/portal/quotations"
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Back to Quotations
          </Link>
          <button 
            onClick={fetchQuotation}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!quotation) return null;

  const status = statusConfig[quotation.status] || statusConfig.DRAFT;
  const canNegotiate = quotation.status === 'APPROVED';
  const finalTotal = quotation.totalAmount * (1 - quotation.overallDiscountPct / 100);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/portal/quotations" className="hover:text-gray-700">Quotations</Link>
        <span>/</span>
        <span className="text-gray-900">{quotation.quotationNumber}</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Quotation #{quotation.quotationNumber}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
          <p className="text-gray-500 mt-1">{status.description}</p>
          {quotation.validUntil && (
            <p className="text-sm text-gray-500 mt-1">
              Valid until: {formatDate(quotation.validUntil)}
            </p>
          )}
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Line Items */}
        <div className="col-span-2 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quotation.lines?.map((line) => (
                  <tr key={line.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{line.productName}</span>
                      {line.lineType === 'RECURRING' && (
                        <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                          Recurring
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">{line.quantity}</td>
                    <td className="px-6 py-4 text-right text-gray-600">${line.unitPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      {line.discountPct > 0 ? (
                        <span className="text-green-600">-{line.discountPct}%</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      ${line.lineTotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end space-y-1">
              <div className="w-64">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>${quotation.totalAmount.toFixed(2)}</span>
                </div>
                {quotation.overallDiscountPct > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({quotation.overallDiscountPct}%)</span>
                    <span>-${(quotation.totalAmount * quotation.overallDiscountPct / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 mt-2 pt-2 border-t border-gray-300">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Negotiation Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border border-blue-100">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
              <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
            </div>
            <div className="p-6">
              {canNegotiate ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Happy with this quote? Accept it to proceed with the order.
                  </p>
                  <button 
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition"
                    onClick={handleAccept}
                    disabled={acceptSubmitting}
                  >
                    {acceptSubmitting ? 'Processing...' : '✓ Accept Quote'}
                  </button>
                  
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-2 bg-white text-sm text-gray-500">or negotiate</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    Propose a different overall discount:
                  </p>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="0" 
                      max="100"
                      step="0.5"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Discount %"
                      value={counterDiscount}
                      onChange={(e) => setCounterDiscount(parseFloat(e.target.value) || 0)}
                    />
                    <span className="text-gray-500 font-medium">%</span>
                  </div>
                  {counterDiscount > 0 && (
                    <p className="text-sm text-gray-500">
                      New total: ${(quotation.totalAmount * (1 - counterDiscount / 100)).toFixed(2)}
                    </p>
                  )}
                  <button 
                    className="w-full py-2 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 disabled:opacity-50 transition"
                    onClick={handleCounter}
                    disabled={counterSubmitting}
                  >
                    {counterSubmitting ? 'Submitting...' : 'Submit Counter-Offer'}
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">{status.description}</p>
                  {quotation.status === 'CONFIRMED' && (
                    <Link 
                      href="/portal/orders"
                      className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      View Orders →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-600">{quotation.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Discussion</h2>
          <p className="text-sm text-gray-500">Communicate with your sales rep about this quotation</p>
        </div>
        
        {/* Comment List */}
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <span className="text-3xl mb-2 block">💬</span>
              <p className="text-gray-500">No comments yet</p>
              <p className="text-sm text-gray-400">Start a discussion with your sales rep</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div 
                key={comment.id}
                className={`px-6 py-4 ${comment.authorType === 'CUSTOMER' ? 'bg-blue-50' : 'bg-white'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                    comment.authorType === 'CUSTOMER' ? 'bg-blue-500' : 'bg-emerald-500'
                  }`}>
                    {comment.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{comment.authorName}</span>
                      <span className="text-xs text-gray-400">{formatDateTime(comment.createdAt)}</span>
                      {comment.productName && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          Re: {comment.productName}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mt-1">{comment.commentText}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleAddComment} className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="space-y-3">
            {quotation.lines.length > 0 && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Regarding (optional)</label>
                <select
                  value={selectedLineId || ''}
                  onChange={(e) => setSelectedLineId(e.target.value || null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">General comment</option>
                  {quotation.lines.map((line) => (
                    <option key={line.id} value={line.id}>
                      {line.productName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Type your message..."
                maxLength={1000}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || commentSubmitting}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium"
              >
                {commentSubmitting ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Back Link */}
      <div className="mt-6">
        <Link 
          href="/portal/quotations"
          className="text-emerald-600 hover:text-emerald-700 font-medium"
        >
          ← Back to Quotations
        </Link>
      </div>
    </div>
  );
}

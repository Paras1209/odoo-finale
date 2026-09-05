"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface QuotationLine {
  id: string;
  productId: string;
  productName: string;
  productCategory: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  lineTotal: number;
  marginAmount: number;
  marginPct: number;
  lineType: string;
  billingFrequency: string | null;
}

interface Quotation {
  id: string;
  quotationNumber: string;
  customerName: string;
  customerTier: string;
  status: string;
  totalAmount: number;
  totalMargin: number;
  totalMarginPct: number;
  overallDiscountPct: number;
  blendedRiskScore: number | null;
  // Counter offer fields
  counterOfferStatus: string | null;
  counteredDiscountPct: number | null;
  counteredTotalAmount: number | null;
  unitPriceTotal: number | null;
  counterOfferAt: string | null;
  counterOfferRespondedAt: string | null;
  lines: QuotationLine[];
}

interface Product {
  id: string;
  name: string;
  salePrice: number;
  category: string;
}

interface Comment {
  id: string;
  quotationId: string;
  quotationLineId: string | null;
  authorType: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  commentText: string;
  createdAt: string;
}

export default function QuotationBuilderPage() {
  const { id } = useParams() as { id: string };
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // New line state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newDiscountPct, setNewDiscountPct] = useState(0);
  const [addingLine, setAddingLine] = useState(false);

  // Edit line state
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editDiscountPct, setEditDiscountPct] = useState(0);
  const [savingLine, setSavingLine] = useState(false);

  // Delete state
  const [deletingLineId, setDeletingLineId] = useState<string | null>(null);

  // Transition state
  const [transitioning, setTransitioning] = useState(false);

  const [suggestions, setSuggestions] = useState<Product[]>([]);

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Counter response state
  const [counterAction, setCounterAction] = useState<'accept' | 'reject' | 'counter' | null>(null);
  const [counterDiscountPct, setCounterDiscountPct] = useState(0);
  const [counterResponseComment, setCounterResponseComment] = useState('');
  const [respondingToCounter, setRespondingToCounter] = useState(false);

  useEffect(() => {
    fetchQuotation();
    fetchProducts();
    fetchComments();
  }, [id]);

  const fetchSuggestions = async () => {
    const res = await api.get<any>(`/quotation/${id}/suggestions`);
    if (res.success && res.data) {
      setSuggestions(res.data);
    }
  };

  const fetchQuotation = useCallback(async () => {
    const res = await api.get<any>(`/quotation/${id}`);
    if (res.success && res.data) {
      setQuotation(res.data);
      // Fetch suggestions after getting quotation data
      fetchSuggestions();
    }
    setLoading(false);
  }, [id]);

  const fetchProducts = async () => {
    const res = await api.get<any>('/catalog/products');
    if (res.success && res.data) {
      setProducts(res.data.data || res.data);
    }
  };

  const fetchComments = useCallback(async () => {
    const res = await api.get<any>(`/quotation/${id}/comments`);
    if (res.success && res.data) {
      setComments(res.data);
    }
  }, [id]);

  const handleAddLine = async () => {
    if (!selectedProductId) return;
    
    setAddingLine(true);
    const res = await api.post<any>(`/quotation/${id}/lines`, {
      productId: selectedProductId,
      quantity: newQuantity,
      discountPct: newDiscountPct,
      lineType: 'ONE_TIME',
    });
    
    if (res.success) {
      await fetchQuotation();
      setSelectedProductId('');
      setNewQuantity(1);
      setNewDiscountPct(0);
    } else {
      alert(res.error?.message || 'Error adding line');
    }
    setAddingLine(false);
  };

  const handleQuickAddLine = async (productId: string) => {
    setAddingLine(true);
    const res = await api.post<any>(`/quotation/${id}/lines`, {
      productId,
      quantity: 1,
      discountPct: 0,
      lineType: 'ONE_TIME',
    });
    
    if (res.success) {
      await fetchQuotation();
    } else {
      alert(res.error?.message || 'Error adding line');
    }
    setAddingLine(false);
  };

  const handleStartEdit = (line: QuotationLine) => {
    setEditingLineId(line.id);
    setEditQuantity(line.quantity);
    setEditDiscountPct(line.discountPct);
  };

  const handleCancelEdit = () => {
    setEditingLineId(null);
    setEditQuantity(1);
    setEditDiscountPct(0);
  };

  const handleSaveEdit = async (lineId: string) => {
    setSavingLine(true);
    const res = await api.put<any>(`/quotation/${id}/lines/${lineId}`, {
      quantity: editQuantity,
      discountPct: editDiscountPct,
    });
    
    if (res.success) {
      await fetchQuotation();
      setEditingLineId(null);
    } else {
      alert(res.error?.message || 'Error updating line');
    }
    setSavingLine(false);
  };

  const handleDeleteLine = async (lineId: string) => {
    if (!confirm('Are you sure you want to remove this line item?')) return;
    
    setDeletingLineId(lineId);
    const res = await api.delete<any>(`/quotation/${id}/lines/${lineId}`);
    
    if (res.success) {
      await fetchQuotation();
    } else {
      alert(res.error?.message || 'Error removing line');
    }
    setDeletingLineId(null);
  };

  const handleSendToCustomer = async () => {
    setTransitioning(true);
    const res = await api.post<any>(`/quotation/${id}/transition`, { action: 'CONFIRM' });
    if (res.success) {
      const data = res.data;
      if (data.status === 'APPROVED') {
        alert('Quotation approved and sent to customer!');
      } else if (data.status === 'PENDING_MANAGER_APPROVAL') {
        alert(`Quotation requires manager approval (Risk Score: ${data.blendedRiskScore?.toFixed(1) || '0'})`);
      } else if (data.status === 'PENDING_FINANCE_APPROVAL') {
        alert(`Quotation requires finance approval (Risk Score: ${data.blendedRiskScore?.toFixed(1) || '0'})`);
      }
      await fetchQuotation();
    } else {
      alert(res.error?.message || 'Error sending to customer');
    }
    setTransitioning(false);
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    
    setPostingComment(true);
    const res = await api.post<any>(`/quotation/${id}/comments`, {
      commentText: newComment.trim(),
    });
    
    if (res.success) {
      setNewComment('');
      await fetchComments();
    } else {
      alert(res.error?.message || 'Error posting comment');
    }
    setPostingComment(false);
  };

  const handleCounterResponse = async () => {
    if (!counterAction) return;
    
    setRespondingToCounter(true);
    const res = await api.post<any>(`/quotation/${id}/counter-response`, {
      action: counterAction,
      counterDiscountPct: counterAction === 'counter' ? counterDiscountPct : undefined,
      comment: counterResponseComment || undefined,
    });
    
    if (res.success) {
      setCounterAction(null);
      setCounterDiscountPct(0);
      setCounterResponseComment('');
      await fetchQuotation();
      await fetchComments();
      alert((res.data as { message?: string })?.message || 'Response submitted successfully');
    } else {
      alert(res.error?.message || 'Error responding to counter offer');
    }
    setRespondingToCounter(false);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-200 text-gray-800';
      case 'PENDING_MANAGER_APPROVAL': return 'bg-yellow-100 text-yellow-800';
      case 'PENDING_FINANCE_APPROVAL': return 'bg-orange-100 text-orange-800';
      case 'APPROVED': return 'bg-blue-100 text-blue-800';
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCounterOfferStatusBadgeClass = (status: string | null) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'COUNTERED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500">Loading quotation...</p>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 text-lg">Quotation not found</p>
        <Link href="/workspace/quotations" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Quotations
        </Link>
      </div>
    );
  }

  const isDraft = quotation.status === 'DRAFT';
  const hasPendingCounterOffer = quotation.counterOfferStatus === 'PENDING';

  return (
    <div className="relative">
      {/* Loading Overlay */}
      {(addingLine || savingLine || transitioning || respondingToCounter) && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 flex items-center gap-4">
            <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-gray-700 font-medium">
              {addingLine ? 'Adding line item...' : savingLine ? 'Saving changes...' : respondingToCounter ? 'Responding...' : 'Processing...'}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/workspace/quotations" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
            &larr; Back to Quotations
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Quotation #{quotation.quotationNumber}</h1>
          <p className="text-gray-500">Customer: {quotation.customerName} ({quotation.customerTier})</p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded text-sm font-semibold ${getStatusBadgeClass(quotation.status)}`}>
            {quotation.status.replace(/_/g, ' ')}
          </span>
          {isDraft && (
            <button 
              className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2" 
              onClick={handleSendToCustomer}
              disabled={transitioning || quotation.lines.length === 0}
            >
              {transitioning && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>}
              Send to Customer
            </button>
          )}
        </div>
      </div>

      {/* Counter Offer Alert */}
      {hasPendingCounterOffer && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-yellow-600 text-xl">&#9888;</div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800">Pending Counter Offer from Customer</h3>
              <p className="text-yellow-700 text-sm mt-1">
                Customer is requesting <strong>{quotation.counteredDiscountPct}%</strong> discount 
                (Total: {formatCurrency(quotation.counteredTotalAmount ?? 0)} from {formatCurrency(quotation.unitPriceTotal ?? 0)} unit price total)
              </p>
              {quotation.counterOfferAt && (
                <p className="text-yellow-600 text-xs mt-1">Submitted: {formatDate(quotation.counterOfferAt)}</p>
              )}
              
              {/* Counter Response Form */}
              <div className="mt-4 p-3 bg-white rounded border border-yellow-200">
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setCounterAction('accept')}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      counterAction === 'accept' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => setCounterAction('reject')}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      counterAction === 'reject' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setCounterAction('counter')}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      counterAction === 'counter' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    Counter
                  </button>
                </div>
                
                {counterAction === 'counter' && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Counter Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-32 border p-2 rounded"
                      value={counterDiscountPct}
                      onChange={(e) => setCounterDiscountPct(parseFloat(e.target.value) || 0)}
                    />
                    {quotation.unitPriceTotal && (
                      <p className="text-xs text-gray-500 mt-1">
                        New total: {formatCurrency(quotation.unitPriceTotal * (1 - counterDiscountPct / 100))}
                      </p>
                    )}
                  </div>
                )}
                
                {counterAction && (
                  <>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
                      <textarea
                        className="w-full border p-2 rounded text-sm"
                        rows={2}
                        value={counterResponseComment}
                        onChange={(e) => setCounterResponseComment(e.target.value)}
                        placeholder="Add a message to the customer..."
                      />
                    </div>
                    <button
                      onClick={handleCounterResponse}
                      disabled={respondingToCounter}
                      className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {respondingToCounter ? 'Submitting...' : 'Submit Response'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Counter Offer Status (if not pending) */}
      {quotation.counterOfferStatus && quotation.counterOfferStatus !== 'PENDING' && (
        <div className="mb-6 bg-gray-50 border rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-2">Counter Offer Status</h3>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-semibold ${getCounterOfferStatusBadgeClass(quotation.counterOfferStatus)}`}>
              {quotation.counterOfferStatus}
            </span>
            {quotation.counteredDiscountPct !== null && (
              <span className="text-sm text-gray-600">
                {quotation.counteredDiscountPct}% discount requested
              </span>
            )}
          </div>
          {quotation.counterOfferRespondedAt && (
            <p className="text-xs text-gray-500 mt-1">Responded: {formatDate(quotation.counterOfferRespondedAt)}</p>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Total Amount</h3>
          <p className="text-2xl font-bold">{formatCurrency(quotation.totalAmount)}</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Total Margin</h3>
          <p className={`text-2xl font-bold ${quotation.totalMarginPct < 15 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(quotation.totalMargin)} ({quotation.totalMarginPct.toFixed(1)}%)
          </p>
          {quotation.totalMarginPct < 15 && <p className="text-xs text-red-500 mt-1">Warning: Below 15%</p>}
        </div>
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Overall Discount</h3>
          <p className="text-2xl font-bold">{quotation.overallDiscountPct ?? 0}%</p>
          <p className="text-xs text-gray-500 mt-1">Applied discount</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Risk Score</h3>
          <p className={`text-2xl font-bold ${
            (quotation.blendedRiskScore ?? 0) === 0 ? 'text-green-600' :
            (quotation.blendedRiskScore ?? 0) <= 5 ? 'text-yellow-600' :
            (quotation.blendedRiskScore ?? 0) <= 10 ? 'text-orange-600' : 'text-red-600'
          }`}>
            {quotation.blendedRiskScore?.toFixed(1) ?? '0.0'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {(quotation.blendedRiskScore ?? 0) === 0 ? 'No violations' : 'Discount violations'}
          </p>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white shadow rounded">
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">Line Items</h2>
            <p className="text-sm text-gray-500">{quotation.lines.length} item(s)</p>
          </div>
        </div>

        {/* Add Line Form */}
        {isDraft && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select 
                  className="w-full border p-2 rounded"
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  disabled={addingLine}
                >
                  <option value="">Select Product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - ${Number(p.salePrice).toFixed(2)} ({p.category})</option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                <input 
                  type="number" 
                  min="1" 
                  className="w-full border p-2 rounded" 
                  value={newQuantity}
                  onChange={e => setNewQuantity(parseInt(e.target.value) || 1)}
                  disabled={addingLine}
                />
              </div>
              <div className="w-28">
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  step="0.1"
                  className="w-full border p-2 rounded" 
                  value={newDiscountPct}
                  onChange={e => setNewDiscountPct(parseFloat(e.target.value) || 0)}
                  disabled={addingLine}
                />
              </div>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2" 
                onClick={handleAddLine}
                disabled={!selectedProductId || addingLine}
              >
                {addingLine && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>}
                Add Line
              </button>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {isDraft && suggestions.length > 0 && (
          <div className="p-4 bg-indigo-50 border-b border-indigo-100">
            <h3 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
              Suggested pairings based on current items:
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {suggestions.map(s => (
                <div key={s.id} className="bg-white border border-indigo-100 rounded-lg p-3 min-w-[200px] flex flex-col justify-between shadow-sm">
                  <div>
                    <p className="font-medium text-sm text-gray-900 line-clamp-1" title={s.name}>{s.name}</p>
                    <p className="text-xs text-gray-500 mb-2">{s.category}</p>
                    <p className="text-sm font-semibold text-gray-700">${Number(s.salePrice).toFixed(2)}</p>
                  </div>
                  <button 
                    onClick={() => handleQuickAddLine(s.id)}
                    disabled={addingLine}
                    className="mt-3 w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded transition disabled:opacity-50"
                  >
                    + Add to Quote
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lines Table */}
        {quotation.lines.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No line items yet. Add products above.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Product</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Category</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Qty</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Unit Price</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Discount %</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Line Total</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Margin %</th>
                {isDraft && <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {quotation.lines.map((line) => (
                <tr key={line.id} className={`hover:bg-gray-50 ${deletingLineId === line.id ? 'opacity-50' : ''}`}>
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
                  <td className="px-4 py-3 text-right">
                    {editingLineId === line.id ? (
                      <input
                        type="number"
                        min="1"
                        className="w-16 border p-1 rounded text-right"
                        value={editQuantity}
                        onChange={e => setEditQuantity(parseInt(e.target.value) || 1)}
                        disabled={savingLine}
                      />
                    ) : (
                      line.quantity
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{formatCurrency(line.unitPrice)}</td>
                  <td className="px-4 py-3 text-right">
                    {editingLineId === line.id ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-20 border p-1 rounded text-right"
                        value={editDiscountPct}
                        onChange={e => setEditDiscountPct(parseFloat(e.target.value) || 0)}
                        disabled={savingLine}
                      />
                    ) : (
                      <span className={line.discountPct > 10 ? 'text-orange-600 font-medium' : ''}>
                        {line.discountPct.toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(line.lineTotal)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${line.marginPct < 15 ? 'text-red-600' : 'text-green-600'}`}>
                    {line.marginPct.toFixed(1)}%
                  </td>
                  {isDraft && (
                    <td className="px-4 py-3 text-center">
                      {editingLineId === line.id ? (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleSaveEdit(line.id)}
                            disabled={savingLine}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {savingLine ? '...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={savingLine}
                            className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleStartEdit(line)}
                            disabled={deletingLineId === line.id}
                            className="px-2 py-1 text-blue-600 hover:bg-blue-50 text-xs rounded border border-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteLine(line.id)}
                            disabled={deletingLineId === line.id}
                            className="px-2 py-1 text-red-600 hover:bg-red-50 text-xs rounded border border-red-200"
                          >
                            {deletingLineId === line.id ? '...' : 'Remove'}
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t">
              <tr>
                <td colSpan={isDraft ? 5 : 4} className="px-4 py-3 text-right font-semibold">Totals:</td>
                <td className="px-4 py-3 text-right font-bold text-lg">{formatCurrency(quotation.totalAmount)}</td>
                <td className={`px-4 py-3 text-right font-bold ${quotation.totalMarginPct < 15 ? 'text-red-600' : 'text-green-600'}`}>
                  {quotation.totalMarginPct.toFixed(1)}%
                </td>
                {isDraft && <td></td>}
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Negotiation Comments */}
      <div className="mt-6 bg-white shadow rounded">
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-bold">Negotiation Thread</h2>
          <p className="text-sm text-gray-500">Communication with customer</p>
        </div>
        
        <div className="p-4">
          {/* Comments List */}
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No comments yet.</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
              {comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className={`p-3 rounded-lg ${
                    comment.authorType === 'INTERNAL' 
                      ? 'bg-blue-50 border border-blue-100 ml-8' 
                      : 'bg-gray-50 border border-gray-200 mr-8'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-medium text-sm ${
                      comment.authorType === 'INTERNAL' ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      {comment.authorName}
                      <span className="ml-2 text-xs font-normal text-gray-500">
                        ({comment.authorType === 'INTERNAL' ? 'Sales Rep' : 'Customer'})
                      </span>
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.commentText}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add Comment Form */}
          <div className="border-t pt-4">
            <textarea
              className="w-full border p-3 rounded text-sm"
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Type a message to the customer..."
              disabled={postingComment}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handlePostComment}
                disabled={!newComment.trim() || postingComment}
                className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {postingComment && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>}
                Send Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Approval History (if any) */}
      {quotation.status !== 'DRAFT' && (
        <div className="mt-6 bg-white shadow rounded p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Status Info</h3>
          <p className="text-sm text-gray-600">
            {quotation.status === 'PENDING_MANAGER_APPROVAL' && 'Awaiting manager approval due to discount policy violations.'}
            {quotation.status === 'PENDING_FINANCE_APPROVAL' && 'Awaiting finance approval due to high-risk discount levels.'}
            {quotation.status === 'APPROVED' && 'Quotation has been approved and is awaiting customer confirmation.'}
            {quotation.status === 'CONFIRMED' && 'Customer has confirmed the quotation. Ready for fulfillment.'}
            {quotation.status === 'REJECTED' && 'Quotation was rejected. Create a new quotation if needed.'}
          </p>
          {quotation.status.includes('PENDING') && (
            <Link href="/workspace/approvals" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
              View in Approvals &rarr;
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, getErrorMessage } from '@/lib/api';
import { useToast } from '@/components/providers';

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
  const toast = useToast();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Product[]>([]);

  // New line state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
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
      fetchSuggestions();
    }
    setLoading(false);
  }, [id]);

  const fetchProducts = async () => {
    // Fetch all active products for the selector
    // API max pageSize is 100, so we fetch multiple pages if needed
    let allProducts: Product[] = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const res = await api.get<any>(`/catalog/products?page=${page}&pageSize=100&isActive=true`);
      if (res.success && res.data) {
        const products = res.data.data || res.data;
        allProducts = [...allProducts, ...products];
        
        // Check if there are more pages
        const pagination = res.data.pagination;
        if (pagination && page < pagination.totalPages) {
          page++;
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }
    
    setProducts(allProducts);
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
      toast.success('Line item added successfully');
    } else {
      toast.showApiError(res.error);
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
      toast.success('Line item added');
    } else {
      toast.showApiError(res.error);
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
      toast.success('Line item updated');
    } else {
      toast.showApiError(res.error);
    }
    setSavingLine(false);
  };

  const handleDeleteLine = async (lineId: string) => {
    if (!confirm('Are you sure you want to remove this line item?')) return;
    setDeletingLineId(lineId);
    const res = await api.delete<any>(`/quotation/${id}/lines/${lineId}`);
    if (res.success) {
      await fetchQuotation();
      toast.success('Line item removed');
    } else {
      toast.showApiError(res.error);
    }
    setDeletingLineId(null);
  };

  const handleSendToCustomer = async () => {
    setTransitioning(true);
    const res = await api.post<any>(`/quotation/${id}/transition`, { action: 'CONFIRM' });
    if (res.success) {
      const data = res.data;
      if (data.status === 'APPROVED') {
        toast.success('Quotation approved and sent to customer!');
      } else if (data.status === 'PENDING_MANAGER_APPROVAL') {
        toast.warning(`Quotation requires manager approval (Risk Score: ${data.blendedRiskScore?.toFixed(1) || '0'})`);
      } else if (data.status === 'PENDING_FINANCE_APPROVAL') {
        toast.warning(`Quotation requires finance approval (Risk Score: ${data.blendedRiskScore?.toFixed(1) || '0'})`);
      }
      await fetchQuotation();
    } else {
      toast.showApiError(res.error);
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
      toast.success('Comment posted');
    } else {
      toast.showApiError(res.error);
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
      toast.success((res.data as { message?: string })?.message || 'Response submitted successfully');
    } else {
      toast.showApiError(res.error);
    }
    setRespondingToCounter(false);
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (!quotation) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
          <AlertIcon className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Quotation not found</h2>
        <Link href="/workspace/quotations" className="text-indigo-600 hover:text-indigo-700 font-medium">
          ← Back to Quotations
        </Link>
      </div>
    );
  }

  const isDraft = quotation.status === 'DRAFT';
  
  // Filter products based on search
  const filteredProducts = products.filter(p => {
    if (!productSearch) return true;
    const search = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(search) ||
      p.category.toLowerCase().includes(search)
    );
  });
  
  // Get selected product info for display
  const selectedProduct = products.find(p => p.id === selectedProductId);
  
  // Handle product selection
  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    setProductSearch('');
    setShowProductDropdown(false);
  };
  const hasPendingCounterOffer = quotation.counterOfferStatus === 'PENDING';
  const isProcessing = addingLine || savingLine || transitioning || respondingToCounter;

  return (
    <div className="space-y-6">
      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 flex items-center gap-4">
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-700 font-medium">
              {addingLine ? 'Adding line item...' : savingLine ? 'Saving changes...' : respondingToCounter ? 'Responding...' : 'Processing...'}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link 
            href="/workspace/quotations" 
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2"
          >
            <ChevronLeftIcon /> Back to Quotations
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Quotation #{quotation.quotationNumber}
            </h1>
            <StatusBadge status={quotation.status} />
          </div>
          <p className="text-slate-500 mt-1">
            {quotation.customerName} <TierBadge tier={quotation.customerTier} />
          </p>
        </div>
        {isDraft && (
          <button 
            className="btn-success btn-lg"
            onClick={handleSendToCustomer}
            disabled={transitioning || quotation.lines.length === 0}
          >
            {transitioning ? <Spinner /> : <SendIcon />}
            Send to Customer
          </button>
        )}
      </div>

      {/* Counter Offer Alert */}
      {hasPendingCounterOffer && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600 flex-shrink-0">
              <AlertIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900">Pending Counter Offer</h3>
              <p className="text-sm text-amber-700 mt-1">
                Customer requested <span className="font-semibold">{quotation.counteredDiscountPct}%</span> discount 
                (New total: {formatCurrency(quotation.counteredTotalAmount ?? 0)} from {formatCurrency(quotation.unitPriceTotal ?? 0)})
              </p>
              {quotation.counterOfferAt && (
                <p className="text-xs text-amber-600 mt-1">Submitted: {formatDateTime(quotation.counterOfferAt)}</p>
              )}
              
              {/* Response Actions */}
              <div className="mt-4 p-4 bg-white rounded-lg border border-amber-200">
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setCounterAction('accept')}
                    className={`btn-sm ${counterAction === 'accept' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => setCounterAction('reject')}
                    className={`btn-sm ${counterAction === 'reject' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setCounterAction('counter')}
                    className={`btn-sm ${counterAction === 'counter' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
                  >
                    Counter
                  </button>
                </div>
                
                {counterAction === 'counter' && (
                  <div className="mb-4">
                    <label className="label">Your Counter Discount %</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className="input w-32"
                        value={counterDiscountPct}
                        onChange={(e) => setCounterDiscountPct(parseFloat(e.target.value) || 0)}
                      />
                      {quotation.unitPriceTotal && (
                        <span className="text-sm text-slate-500">
                          = {formatCurrency(quotation.unitPriceTotal * (1 - counterDiscountPct / 100))}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {counterAction && (
                  <>
                    <div className="mb-4">
                      <label className="label">Comment (optional)</label>
                      <textarea
                        className="textarea"
                        rows={2}
                        value={counterResponseComment}
                        onChange={(e) => setCounterResponseComment(e.target.value)}
                        placeholder="Add a message to the customer..."
                      />
                    </div>
                    <button
                      onClick={handleCounterResponse}
                      disabled={respondingToCounter}
                      className="btn-primary"
                    >
                      {respondingToCounter ? <Spinner /> : null}
                      Submit Response
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Counter Offer History */}
      {quotation.counterOfferStatus && quotation.counterOfferStatus !== 'PENDING' && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">Counter Offer:</span>
            <CounterStatusBadge status={quotation.counterOfferStatus} />
            {quotation.counteredDiscountPct !== null && (
              <span className="text-sm text-slate-600">
                {quotation.counteredDiscountPct}% discount requested
              </span>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Amount"
          value={formatCurrency(quotation.totalAmount)}
        />
        <SummaryCard
          label="Total Margin"
          value={`${formatCurrency(quotation.totalMargin)} (${quotation.totalMarginPct.toFixed(1)}%)`}
          variant={quotation.totalMarginPct < 15 ? 'danger' : 'success'}
          warning={quotation.totalMarginPct < 15 ? 'Below 15% threshold' : undefined}
        />
        <SummaryCard
          label="Overall Discount"
          value={`${quotation.overallDiscountPct ?? 0}%`}
        />
        <SummaryCard
          label="Risk Score"
          value={(quotation.blendedRiskScore ?? 0).toFixed(1)}
          variant={
            (quotation.blendedRiskScore ?? 0) === 0 ? 'success' :
            (quotation.blendedRiskScore ?? 0) <= 5 ? 'warning' : 'danger'
          }
          subtext={(quotation.blendedRiskScore ?? 0) === 0 ? 'No violations' : 'Discount violations'}
        />
      </div>

      {/* Line Items Section */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Line Items</h2>
              <p className="text-sm text-slate-500">{quotation.lines.length} item(s)</p>
            </div>
          </div>
        </div>

        {/* Add Line Form */}
        {isDraft && (
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                {/* Searchable Product Selector */}
                <div className="relative">
                  <div 
                    className={`select w-full cursor-pointer flex items-center justify-between ${addingLine ? 'opacity-50' : ''}`}
                    onClick={() => !addingLine && setShowProductDropdown(!showProductDropdown)}
                  >
                    <span className={selectedProduct ? 'text-slate-900' : 'text-slate-400'}>
                      {selectedProduct 
                        ? `${selectedProduct.name} - ${formatCurrency(Number(selectedProduct.salePrice))}`
                        : 'Select Product...'
                      }
                    </span>
                    <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform ${showProductDropdown ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {/* Dropdown */}
                  {showProductDropdown && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
                      {/* Search Input */}
                      <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Search products..."
                            value={productSearch}
                            onChange={e => setProductSearch(e.target.value)}
                            autoFocus
                            onClick={e => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      
                      {/* Product List */}
                      <div className="max-h-60 overflow-y-auto">
                        {filteredProducts.length === 0 ? (
                          <div className="p-4 text-center text-slate-500 text-sm">
                            No products found
                          </div>
                        ) : (
                          filteredProducts.map(p => (
                            <div
                              key={p.id}
                              className={`px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors ${
                                selectedProductId === p.id ? 'bg-indigo-50' : ''
                              }`}
                              onClick={() => handleSelectProduct(p.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium text-slate-900">{p.name}</span>
                                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                    {p.category}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-slate-700">
                                  {formatCurrency(Number(p.salePrice))}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {/* Footer showing count */}
                      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
                        {filteredProducts.length} of {products.length} products
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Click outside to close */}
                {showProductDropdown && (
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowProductDropdown(false)}
                  />
                )}
              </div>
              <div className="flex gap-3">
                <div className="w-24">
                  <input 
                    type="number" 
                    min="1" 
                    className="input" 
                    value={newQuantity}
                    onChange={e => setNewQuantity(parseInt(e.target.value) || 1)}
                    disabled={addingLine}
                    placeholder="Qty"
                  />
                </div>
                <div className="w-28">
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    step="0.1"
                    className="input" 
                    value={newDiscountPct}
                    onChange={e => setNewDiscountPct(parseFloat(e.target.value) || 0)}
                    disabled={addingLine}
                    placeholder="Disc %"
                  />
                </div>
                <button 
                  className="btn-primary"
                  onClick={handleAddLine}
                  disabled={!selectedProductId || addingLine}
                >
                  {addingLine ? <Spinner /> : <PlusIcon />}
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {isDraft && suggestions.length > 0 && (
          <div className="p-4 bg-indigo-50 border-b border-indigo-100">
            <h3 className="text-sm font-semibold text-indigo-900 mb-3">
              Suggested pairings based on current items
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {suggestions.map(s => (
                <div 
                  key={s.id} 
                  className="bg-white border border-indigo-100 rounded-lg p-3 min-w-[180px] flex flex-col shadow-sm"
                >
                  <p className="font-medium text-sm text-slate-900 line-clamp-1">{s.name}</p>
                  <p className="text-xs text-slate-500 mb-2">{s.category}</p>
                  <p className="text-sm font-semibold text-slate-700 mb-3">
                    {formatCurrency(Number(s.salePrice))}
                  </p>
                  <button 
                    onClick={() => handleQuickAddLine(s.id)}
                    disabled={addingLine}
                    className="btn-sm bg-indigo-600 text-white hover:bg-indigo-700 mt-auto"
                  >
                    Add to Quote
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lines Table - Desktop */}
        {quotation.lines.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
              <PackageIcon className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500">No line items yet. Add products above.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Product</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Qty</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Unit Price</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Discount</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Line Total</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Margin</th>
                    {isDraft && <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotation.lines.map((line) => (
                    <tr 
                      key={line.id} 
                      className={`hover:bg-slate-50 transition-colors ${deletingLineId === line.id ? 'opacity-50' : ''}`}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">{line.productName}</td>
                      <td className="px-4 py-3">
                        <CategoryBadge category={line.productCategory} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingLineId === line.id ? (
                          <input
                            type="number"
                            min="1"
                            className="input w-20 text-right"
                            value={editQuantity}
                            onChange={e => setEditQuantity(parseInt(e.target.value) || 1)}
                            disabled={savingLine}
                          />
                        ) : (
                          <span className="text-slate-700">{line.quantity}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {formatCurrency(line.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingLineId === line.id ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            className="input w-24 text-right"
                            value={editDiscountPct}
                            onChange={e => setEditDiscountPct(parseFloat(e.target.value) || 0)}
                            disabled={savingLine}
                          />
                        ) : (
                          <span className={line.discountPct > 10 ? 'text-amber-600 font-medium' : 'text-slate-700'}>
                            {line.discountPct.toFixed(1)}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(line.lineTotal)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${line.marginPct < 15 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {line.marginPct.toFixed(1)}%
                      </td>
                      {isDraft && (
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            {editingLineId === line.id ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(line.id)}
                                  disabled={savingLine}
                                  className="btn-sm bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  disabled={savingLine}
                                  className="btn-sm btn-secondary"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStartEdit(line)}
                                  className="btn-sm btn-secondary"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteLine(line.id)}
                                  disabled={deletingLineId === line.id}
                                  className="btn-sm text-red-600 hover:bg-red-50 border border-red-200"
                                >
                                  Remove
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200">
                  <tr>
                    <td colSpan={isDraft ? 5 : 4} className="px-4 py-3 text-right font-semibold text-slate-700">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 text-lg">
                      {formatCurrency(quotation.totalAmount)}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${quotation.totalMarginPct < 15 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {quotation.totalMarginPct.toFixed(1)}%
                    </td>
                    {isDraft && <td />}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-slate-100">
              {quotation.lines.map((line) => (
                <div key={line.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-slate-900">{line.productName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <CategoryBadge category={line.productCategory} />
                        <span className="text-sm text-slate-500">Qty: {line.quantity}</span>
                      </div>
                    </div>
                    <p className="font-semibold text-slate-900">{formatCurrency(line.lineTotal)}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-slate-500">
                      <span>Unit: {formatCurrency(line.unitPrice)}</span>
                      <span className={line.discountPct > 10 ? 'text-amber-600' : ''}>
                        Disc: {line.discountPct.toFixed(1)}%
                      </span>
                    </div>
                    <span className={line.marginPct < 15 ? 'text-red-600 font-medium' : 'text-emerald-600 font-medium'}>
                      {line.marginPct.toFixed(1)}% margin
                    </span>
                  </div>
                  {isDraft && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleStartEdit(line)}
                        className="btn-sm btn-secondary flex-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLine(line.id)}
                        className="btn-sm text-red-600 border border-red-200 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {/* Mobile Total */}
              <div className="p-4 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Total</span>
                  <span className="text-xl font-bold text-slate-900">
                    {formatCurrency(quotation.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Comments</h2>
        
        {/* Comment Form */}
        <div className="mb-4">
          <textarea
            className="textarea"
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handlePostComment}
              disabled={postingComment || !newComment.trim()}
              className="btn-primary btn-sm"
            >
              {postingComment ? <Spinner /> : null}
              Post Comment
            </button>
          </div>
        </div>

        {/* Comments List */}
        {comments.length > 0 ? (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                  comment.authorType === 'CUSTOMER' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'
                }`}>
                  {comment.authorName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-900 text-sm">{comment.authorName}</span>
                    <span className="text-xs text-slate-400">{formatDateTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-700">{comment.commentText}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">No comments yet</p>
        )}
      </div>
    </div>
  );
}

// Components
function SummaryCard({ 
  label, 
  value, 
  variant = 'default',
  warning,
  subtext
}: { 
  label: string; 
  value: string; 
  variant?: 'default' | 'success' | 'warning' | 'danger';
  warning?: string;
  subtext?: string;
}) {
  const valueColors = {
    default: 'text-slate-900',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`text-xl font-bold mt-1 ${valueColors[variant]}`}>{value}</p>
      {warning && <p className="text-xs text-red-500 mt-1">{warning}</p>}
      {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    DRAFT: { label: 'Draft', className: 'bg-slate-100 text-slate-700' },
    PENDING_MANAGER_APPROVAL: { label: 'Pending Manager', className: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' },
    PENDING_FINANCE_APPROVAL: { label: 'Pending Finance', className: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20' },
    APPROVED: { label: 'Approved', className: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' },
    CONFIRMED: { label: 'Confirmed', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' },
    REJECTED: { label: 'Rejected', className: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' },
    CANCELLED: { label: 'Cancelled', className: 'bg-slate-100 text-slate-500' },
  };
  const { label, className } = config[status] || { label: status, className: 'bg-slate-100 text-slate-700' };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${className}`}>{label}</span>;
}

function CounterStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    ACCEPTED: { label: 'Accepted', className: 'bg-emerald-100 text-emerald-800' },
    REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
    COUNTERED: { label: 'Countered', className: 'bg-purple-100 text-purple-800' },
  };
  const { label, className } = config[status] || { label: status, className: 'bg-slate-100 text-slate-700' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>{label}</span>;
}

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    GOLD: 'bg-amber-100 text-amber-800',
    SILVER: 'bg-slate-200 text-slate-700',
    BRONZE: 'bg-orange-100 text-orange-800',
  };
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${colors[tier] || 'bg-slate-100 text-slate-700'}`}>{tier}</span>;
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    HARDWARE: 'bg-blue-50 text-blue-700',
    SERVICE: 'bg-emerald-50 text-emerald-700',
    SUBSCRIPTION: 'bg-purple-50 text-purple-700',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[category] || 'bg-slate-100 text-slate-700'}`}>{category}</span>;
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div>
          <div className="h-4 w-32 bg-slate-200 rounded mb-3" />
          <div className="h-8 w-64 bg-slate-200 rounded mb-2" />
          <div className="h-4 w-48 bg-slate-100 rounded" />
        </div>
        <div className="h-10 w-40 bg-slate-200 rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="h-4 w-24 bg-slate-100 rounded mb-2" />
            <div className="h-6 w-32 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="h-6 w-32 bg-slate-200 rounded mb-4" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-slate-100 rounded mb-3" />
        ))}
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />;
}

// Helper functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Icons
function ChevronLeftIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
}

function SendIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
}

function AlertIcon({ className = '' }: { className?: string }) {
  return <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;
}

function PlusIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}

function PackageIcon({ className = '' }: { className?: string }) {
  return <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
}

function SearchIcon({ className = '' }: { className?: string }) {
  return <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
}

function ChevronDownIcon({ className = '' }: { className?: string }) {
  return <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface QuotationFulfillmentGroup {
  id: string;
  quotationNumber: string;
  customerName: string;
  companyName: string | null;
  totalAmount: string;
  createdAt: string;
  hasBackorder?: boolean;
  warehouseId?: string;
  warehouseName?: string;
  lines: {
    lineId: string;
    productName: string;
    quantity: number;
    splits: {
      warehouseId: string;
      warehouseName: string;
      warehouseCode: string;
      quantity: number;
      availableStock: number;
    }[];
    isBackorder: boolean;
    shortfall: number;
  }[];
}

export default function FulfillmentPage() {
  const [canBeFulfilled, setCanBeFulfilled] = useState<QuotationFulfillmentGroup[]>([]);
  const [awaitingFulfillment, setAwaitingFulfillment] = useState<QuotationFulfillmentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchQuotations = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/fulfillment/quotations', { cache: 'no-store' });
      const data = await res.json();

      if (data.success) {
        setCanBeFulfilled(data.data.canBeFulfilled);
        setAwaitingFulfillment(data.data.awaitingFulfillment);
      } else {
        setError(data.error?.message || 'Failed to fetch quotations');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotations(true);
  }, [fetchQuotations]);

  const handleAction = async (quotationId: string, action: string, customMessage?: string) => {
    const defaultMsg = `Are you sure you want to perform this action?`;
    if (!confirm(customMessage || defaultMsg)) return;

    try {
      const res = await fetch(`/api/fulfillment/quotations/${quotationId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        alert('Action successful');
        fetchQuotations();
      } else {
        alert('Action failed: ' + data.error?.message);
      }
    } catch (err) {
      console.error(err);
      alert('Network error while performing action.');
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quotation Fulfillment</h1>
          <p className="text-slate-500 mt-1">Process confirmed quotations and manage inventory allocation</p>
        </div>
        <Link href="/workspace/fulfillment/warehouses" className="btn-primary">
          <WarehouseIcon />
          Manage Warehouses
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">{error}</p>
            <button onClick={() => fetchQuotations()} className="text-sm text-red-700 hover:text-red-800 underline mt-1">
              Try again
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Section 1: Ready to Fulfill */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                  <CheckCircleIcon />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Ready to Fulfill</h2>
                  <p className="text-sm text-slate-500">Single warehouse - can be processed immediately</p>
                </div>
                {canBeFulfilled.length > 0 && (
                  <span className="ml-auto bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-sm font-medium">
                    {canBeFulfilled.length}
                  </span>
                )}
              </div>
            </div>
            
            {canBeFulfilled.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-500">No quotations ready for single-warehouse fulfillment</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quote #</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Warehouse</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {canBeFulfilled.map(q => (
                        <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-900">{q.quotationNumber}</td>
                          <td className="px-4 py-3">
                            <span className="text-slate-900">{q.customerName}</span>
                            {q.companyName && <span className="text-slate-500 ml-1">({q.companyName})</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                              {q.warehouseName}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">{formatDate(q.createdAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <button 
                              onClick={() => handleAction(q.id, 'ACCEPT_SPLIT', 'Process fulfillment for this order?')} 
                              className="btn-sm btn-primary"
                            >
                              Process
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {canBeFulfilled.map(q => (
                    <div key={q.id} className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="font-medium text-slate-900">{q.quotationNumber}</span>
                          <p className="text-sm text-slate-500">{q.customerName}</p>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          {q.warehouseName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm text-slate-500">{formatDate(q.createdAt)}</span>
                        <button 
                          onClick={() => handleAction(q.id, 'ACCEPT_SPLIT', 'Process fulfillment?')} 
                          className="btn-sm btn-primary"
                        >
                          Process
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Section 2: Awaiting Fulfillment */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                  <ClockIcon />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Awaiting Fulfillment</h2>
                  <p className="text-sm text-slate-500">Requires split shipments or has backorders</p>
                </div>
                {awaitingFulfillment.length > 0 && (
                  <span className="ml-auto bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-sm font-medium">
                    {awaitingFulfillment.length}
                  </span>
                )}
              </div>
            </div>
            
            {awaitingFulfillment.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-500">No quotations waiting for fulfillment</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {awaitingFulfillment.map(q => (
                  <div key={q.id}>
                    {/* Row Header */}
                    <div 
                      className="px-4 py-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                      onClick={() => toggleRow(q.id)}
                    >
                      <button className="text-slate-400 hover:text-slate-600">
                        {expandedRows[q.id] ? <ChevronDownIcon /> : <ChevronRightIcon />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <span className="font-medium text-slate-900">{q.quotationNumber}</span>
                          <span className="text-sm text-slate-500 truncate">
                            {q.customerName} {q.companyName && `(${q.companyName})`}
                          </span>
                        </div>
                      </div>
                      {q.hasBackorder ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
                          Backorder
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20">
                          Split Required
                        </span>
                      )}
                      <span className="hidden sm:inline text-sm text-slate-500">{formatDate(q.createdAt)}</span>
                    </div>

                    {/* Expanded Content */}
                    {expandedRows[q.id] && (
                      <div className="px-4 pb-4">
                        <div className="ml-8 bg-slate-50 border border-slate-200 rounded-xl p-4">
                          <h3 className="font-semibold text-slate-900 mb-4">Fulfillment Summary</h3>
                          <ul className="space-y-3 mb-6">
                            {q.lines.map(line => (
                              <li key={line.lineId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                                <div>
                                  <span className="font-medium text-slate-900">{line.productName}</span>
                                  <span className="text-slate-500 ml-2">(Qty: {line.quantity})</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {line.isBackorder ? (
                                    <span className="text-red-600 font-medium">
                                      Backordered ({line.shortfall} missing)
                                    </span>
                                  ) : (
                                    line.splits.map((s, idx) => (
                                      <span key={idx} className="bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-600 text-xs">
                                        {s.warehouseName}: {s.quantity}
                                      </span>
                                    ))
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-slate-200">
                            {q.hasBackorder ? (
                              <>
                                <button 
                                  onClick={() => handleAction(q.id, 'CANCEL', 'Cancel this order due to backorder?')} 
                                  className="btn-secondary"
                                >
                                  Cancel Order
                                </button>
                                <button 
                                  onClick={() => handleAction(q.id, 'KEEP_ACTIVE', 'Keep this order active while awaiting stock?')} 
                                  className="btn-primary"
                                >
                                  Keep Active
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  onClick={() => handleAction(q.id, 'REJECT', 'Reject this split configuration?')} 
                                  className="btn-secondary"
                                >
                                  Reject Split
                                </button>
                                <button 
                                  onClick={() => handleAction(q.id, 'ACCEPT_SPLIT', 'Accept this split and begin processing?')} 
                                  className="btn-primary bg-emerald-600 hover:bg-emerald-700"
                                >
                                  Accept Split
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2].map(section => (
        <div key={section} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-lg" />
              <div>
                <div className="h-5 w-32 bg-slate-200 rounded" />
                <div className="h-4 w-48 bg-slate-100 rounded mt-1" />
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-slate-100 rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Icons
function WarehouseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
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

function CheckCircleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

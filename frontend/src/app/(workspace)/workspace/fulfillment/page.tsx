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

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
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
    fetchQuotations();
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

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quotation Fulfillment</h1>
        <Link href="/workspace/fulfillment/warehouses" className="btn-primary">
          Manage Warehouses
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      ) : (
        <>
          {/* Section 1: Can be fulfilled */}
          <div className="card overflow-hidden">
            <h2 className="text-xl font-bold text-gray-800 p-4 border-b bg-gray-50">Can be fulfilled (Single Warehouse)</h2>
            {canBeFulfilled.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No quotations ready for single-warehouse fulfillment.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quote #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {canBeFulfilled.map(q => (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 font-medium">{q.quotationNumber}</td>
                      <td className="px-4 py-4">{q.customerName} {q.companyName ? `(${q.companyName})` : ''}</td>
                      <td className="px-4 py-4 text-green-700 font-semibold">{q.warehouseName}</td>
                      <td className="px-4 py-4 text-gray-500">{formatDate(q.createdAt)}</td>
                      <td className="px-4 py-4 text-right">
                        <button onClick={() => handleAction(q.id, 'ACCEPT_SPLIT', 'Are you sure you want to process fulfillment for this order?')} className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded">
                          Accept & Process
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Section 2: Order awaiting fulfillment */}
          <div className="card overflow-hidden mt-8">
            <h2 className="text-xl font-bold text-gray-800 p-4 border-b bg-gray-50">Order Awaiting Fulfillment (Splits & Backorders)</h2>
            {awaitingFulfillment.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No quotations waiting for fulfillment.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quote #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {awaitingFulfillment.map(q => (
                    <React.Fragment key={q.id}>
                      <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleRow(q.id)}>
                        <td className="px-4 py-4 text-gray-400">
                          {expandedRows[q.id] ? '▼' : '▶'}
                        </td>
                        <td className="px-4 py-4 font-medium">{q.quotationNumber}</td>
                        <td className="px-4 py-4">{q.customerName} {q.companyName ? `(${q.companyName})` : ''}</td>
                        <td className="px-4 py-4 text-center">
                          {q.hasBackorder ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">Backorder</span>
                          ) : (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full">Split Required</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-gray-500">{formatDate(q.createdAt)}</td>
                      </tr>
                      {expandedRows[q.id] && (
                        <tr className="bg-gray-50 border-b">
                          <td colSpan={5} className="px-8 py-4">
                            <div className="bg-white border p-4 rounded shadow-sm">
                              <h3 className="font-bold mb-3 border-b pb-2 text-gray-700">Fulfillment Summary</h3>
                              <ul className="space-y-3 mb-6">
                                {q.lines.map(line => (
                                  <li key={line.lineId} className="flex justify-between items-center text-sm">
                                    <div>
                                      <span className="font-semibold text-gray-800">{line.productName}</span> 
                                      <span className="text-gray-500 ml-2">(Qty: {line.quantity})</span>
                                    </div>
                                    <div className="flex gap-2 text-right">
                                      {line.isBackorder ? (
                                        <span className="text-red-600 font-medium">Backordered ({line.shortfall} missing)</span>
                                      ) : (
                                        line.splits.map((s, idx) => (
                                          <span key={idx} className="bg-gray-100 px-2 py-1 rounded border text-gray-600">
                                            {s.warehouseName}: {s.quantity}
                                          </span>
                                        ))
                                      )}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                              <div className="flex justify-end gap-3 pt-3 border-t">
                                {q.hasBackorder ? (
                                  <>
                                    <button onClick={() => handleAction(q.id, 'CANCEL', 'Are you sure you want to completely cancel this order due to backorder?')} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 font-medium">Cancel Order</button>
                                    <button onClick={() => handleAction(q.id, 'KEEP_ACTIVE', 'Are you sure you want to keep this order active while awaiting stock?')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Keep Active</button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => handleAction(q.id, 'REJECT', 'Are you sure you want to reject this split configuration? This will cancel the order.')} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 font-medium">Reject Split</button>
                                    <button onClick={() => handleAction(q.id, 'ACCEPT_SPLIT', 'Are you sure you want to accept this split configuration and begin processing?')} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium">Accept Split</button>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

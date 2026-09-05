"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function QuotationBuilderPage() {
  const { id } = useParams() as { id: string };
  const [quotation, setQuotation] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New line state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newDiscountPct, setNewDiscountPct] = useState(0);

  useEffect(() => {
    fetchQuotation();
    fetchProducts();
  }, [id]);

  const fetchQuotation = async () => {
    const res = await api.get<any>(`/quotation/${id}`);
    if (res.success && res.data) {
      setQuotation(res.data);
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    const res = await api.get<any>('/catalog/products');
    if (res.success && res.data) {
      setProducts(res.data.data || res.data);
    }
  };

  const handleAddLine = async () => {
    if (!selectedProductId) return;
    const res = await api.post<any>(`/quotation/${id}/lines`, {
      productId: selectedProductId,
      quantity: newQuantity,
      discountPct: newDiscountPct,
      lineType: 'ONE_TIME',
    });
    
    if (res.success) {
      fetchQuotation();
      setSelectedProductId('');
      setNewQuantity(1);
      setNewDiscountPct(0);
    } else {
      alert(res.error?.message || 'Error adding line');
    }
  };

  const handleSendToCustomer = async () => {
    const res = await api.post<any>(`/quotation/${id}/transition`, { action: 'CONFIRM' });
    if (res.success) {
      alert("Sent to customer successfully (Approved)!");
      fetchQuotation();
    } else {
      alert(res.error?.message || 'Error sending to customer');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading quotation...</div>;
  if (!quotation) return <div className="p-8 text-center text-red-500">Quotation not found</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotation #{quotation.quotationNumber}</h1>
          <p className="text-gray-500">Customer: {quotation.customerName} ({quotation.customerTier})</p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded text-sm font-semibold ${
            quotation.status === 'DRAFT' ? 'bg-gray-200 text-gray-800' :
            quotation.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }`}>
            {quotation.status}
          </span>
          {quotation.status === 'DRAFT' && (
            <button 
              className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700" 
              onClick={handleSendToCustomer}
            >
              Send to Customer
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="card p-4 bg-white shadow rounded">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Total Amount</h3>
          <p className="text-2xl font-bold">${quotation.totalAmount.toFixed(2)}</p>
        </div>
        <div className="card p-4 bg-white shadow rounded">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Total Margin</h3>
          <p className={`text-2xl font-bold ${quotation.totalMarginPct < 15 ? 'text-red-600' : 'text-green-600'}`}>
            ${quotation.totalMargin.toFixed(2)} ({quotation.totalMarginPct.toFixed(1)}%)
          </p>
          {quotation.totalMarginPct < 15 && <p className="text-xs text-red-500 mt-1">Warning: Margin below 15%</p>}
        </div>
        <div className="card p-4 bg-white shadow rounded">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Overall Discount</h3>
          <p className="text-2xl font-bold">{quotation.overallDiscountPct ?? 0}%</p>
          <p className="text-xs text-gray-500 mt-1">Negotiated extra discount</p>
        </div>
      </div>

      <div className="card bg-white shadow rounded p-4">
        <h2 className="text-lg font-bold mb-4">Line Items</h2>
        
        {quotation.status === 'DRAFT' && (
          <div className="flex gap-4 mb-6 p-4 bg-gray-50 rounded border">
            <select 
              className="border p-2 rounded flex-1"
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
            >
              <option value="">Select Product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} - ${p.salePrice.toFixed(2)}</option>
              ))}
            </select>
            <input 
              type="number" 
              min="1" 
              className="border p-2 rounded w-24" 
              placeholder="Qty"
              value={newQuantity}
              onChange={e => setNewQuantity(parseInt(e.target.value) || 1)}
            />
            <div className="relative w-24">
              <input 
                type="number" 
                min="0" 
                max="100" 
                className="border p-2 rounded w-full pr-6" 
                placeholder="Disc %"
                value={newDiscountPct}
                onChange={e => setNewDiscountPct(parseFloat(e.target.value) || 0)}
              />
              <span className="absolute right-2 top-2 text-gray-500">%</span>
            </div>
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700" 
              onClick={handleAddLine}
            >
              Add Line
            </button>
          </div>
        )}

        {quotation.lines?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No line items yet.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2">Product</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right">Disc %</th>
                <th className="py-2 text-right">Line Total</th>
                <th className="py-2 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {quotation.lines?.map((l: any) => (
                <tr key={l.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{l.productName}</td>
                  <td className="py-2 text-right">{l.quantity}</td>
                  <td className="py-2 text-right">${l.unitPrice.toFixed(2)}</td>
                  <td className="py-2 text-right">{l.discountPct.toFixed(1)}%</td>
                  <td className="py-2 text-right font-semibold">${l.lineTotal.toFixed(2)}</td>
                  <td className={`py-2 text-right font-medium ${l.marginPct < 15 ? 'text-red-600' : 'text-green-600'}`}>
                    {l.marginPct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

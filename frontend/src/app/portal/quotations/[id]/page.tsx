"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function PortalQuotationDetailPage() {
  const { id } = useParams() as { id: string };
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Negotiation state
  const [counterDiscount, setCounterDiscount] = useState<number>(0);

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  const fetchQuotation = async () => {
    const res = await api.get<any>(`/portal/quotations/${id}`);
    if (res.success && res.data) {
      setQuotation(res.data);
      setCounterDiscount(res.data.overallDiscountPct || 0);
    }
    setLoading(false);
  };

  const handleAccept = async () => {
    const res = await api.post<any>(`/portal/quotations/${id}/confirm`);
    if (res.success) {
      alert("Quotation confirmed successfully!");
      fetchQuotation();
    } else {
      alert(res.error?.message || 'Error confirming quotation');
    }
  };

  const handleCounter = async () => {
    const res = await api.post<any>(`/portal/quotations/${id}/counter`, {
      discountPct: counterDiscount
    });
    if (res.success) {
      alert("Counter offer submitted to sales rep!");
      fetchQuotation();
    } else {
      alert(res.error?.message || 'Error submitting counter offer');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading quotation...</div>;
  if (!quotation) return <div className="p-8 text-center text-red-500">Quotation not found</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotation #{quotation.quotationNumber}</h1>
          <p className="text-gray-500">Valid until: {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : 'N/A'}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-4 py-2 rounded font-semibold text-lg ${
            quotation.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
            quotation.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {quotation.status === 'APPROVED' ? 'AWAITING YOUR REVIEW' : 
             quotation.status === 'DRAFT' ? 'UNDER REVIEW BY SALES' : quotation.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="card p-4 bg-white shadow rounded col-span-2">
          <h2 className="text-lg font-bold mb-4">Line Items</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2">Product</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {quotation.lines?.map((l: any) => (
                <tr key={l.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{l.productName}</td>
                  <td className="py-2 text-right">{l.quantity}</td>
                  <td className="py-2 text-right">${l.unitPrice.toFixed(2)}</td>
                  <td className="py-2 text-right font-semibold">${l.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-right">
            <p className="text-gray-500">Subtotal: ${quotation.totalAmount.toFixed(2)}</p>
            {quotation.overallDiscountPct > 0 && (
              <p className="text-gray-500">
                Discount ({quotation.overallDiscountPct}%): -${(quotation.totalAmount * quotation.overallDiscountPct / 100).toFixed(2)}
              </p>
            )}
            <p className="text-2xl font-bold mt-2">
              Total: ${(quotation.totalAmount * (1 - quotation.overallDiscountPct / 100)).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="card p-4 bg-white shadow rounded col-span-1 border border-blue-100">
          <h2 className="text-lg font-bold mb-4">Negotiation</h2>
          
          {quotation.status === 'APPROVED' ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-600">
                Happy with this quote? You can accept it right away.
              </p>
              <button 
                className="w-full py-3 bg-green-600 text-white rounded font-bold hover:bg-green-700 shadow"
                onClick={handleAccept}
              >
                Accept Quote
              </button>
              
              <div className="my-4 border-t"></div>
              
              <p className="text-sm text-gray-600">
                Or propose an overall discount:
              </p>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  className="border p-2 rounded flex-1"
                  placeholder="Discount %"
                  value={counterDiscount}
                  onChange={(e) => setCounterDiscount(parseFloat(e.target.value) || 0)}
                />
                <span className="font-semibold">%</span>
              </div>
              <button 
                className="w-full py-2 bg-white border-2 border-blue-600 text-blue-600 rounded font-bold hover:bg-blue-50"
                onClick={handleCounter}
              >
                Submit Counter-Offer
              </button>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded text-center text-gray-500">
              {quotation.status === 'CONFIRMED' ? 
                "This quote has been confirmed." : 
                "This quote is currently being reviewed by your sales rep."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

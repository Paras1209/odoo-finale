"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Quotation {
  id: string;
  quotationNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    setLoading(true);
    const res = await api.get<any>('/quotation');
    if (res.success && res.data) {
      setQuotations(res.data.data || res.data);
    }
    setLoading(false);
  };

  const handleCreateQuotation = async () => {
    const customerId = prompt("Enter Customer ID to create a quotation for (e.g. from seeded db):");
    if (!customerId) return;
    
    const res = await api.post<any>('/quotation', {
      customerId,
      notes: "New dynamic quotation"
    });
    
    if (res.success && res.data) {
      window.location.href = `/workspace/quotations/${res.data.data?.id || res.data.id}`;
    } else {
      alert("Error creating quotation: " + (res.error?.message || "Unknown error"));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700" onClick={handleCreateQuotation}>
          + New Quotation
        </button>
      </div>

      <div className="mb-6 p-4 bg-white shadow rounded">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search quotations..."
            className="border p-2 rounded w-full max-w-sm"
          />
          <select className="border p-2 rounded max-w-xs">
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="APPROVED">Approved</option>
            <option value="CONFIRMED">Confirmed</option>
          </select>
        </div>
      </div>

      <div className="p-4 bg-white shadow rounded">
        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading...</p>
        ) : quotations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No quotations found.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2">Quote #</th>
                <th className="py-2">Customer</th>
                <th className="py-2">Total Amount</th>
                <th className="py-2">Status</th>
                <th className="py-2">Created Date</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map(q => (
                <tr key={q.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{q.quotationNumber}</td>
                  <td className="py-2">{q.customerName}</td>
                  <td className="py-2">${q.totalAmount.toFixed(2)}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      q.status === 'DRAFT' ? 'bg-gray-200 text-gray-800' :
                      q.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                      q.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="py-2">{new Date(q.createdAt).toLocaleDateString()}</td>
                  <td className="py-2">
                    <Link href={`/workspace/quotations/${q.id}`} className="text-blue-600 hover:underline">
                      View / Edit
                    </Link>
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

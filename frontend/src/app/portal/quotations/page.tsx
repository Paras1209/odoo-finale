"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Quotation {
  id: string;
  quotationNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function PortalQuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    setLoading(true);
    const res = await api.get<any>('/portal/quotations');
    if (res.success && res.data) {
      setQuotations(res.data.data || res.data);
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Quotations</h1>

      <div className="card bg-white shadow rounded p-4">
        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading...</p>
        ) : quotations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Your quotations will appear here.
          </p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2">Quote #</th>
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
                  <td className="py-2">${q.totalAmount.toFixed(2)}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      q.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                      q.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {q.status === 'APPROVED' ? 'AWAITING YOUR REVIEW' : q.status}
                    </span>
                  </td>
                  <td className="py-2">{new Date(q.createdAt).toLocaleDateString()}</td>
                  <td className="py-2">
                    <Link href={`/portal/quotations/${q.id}`} className="text-blue-600 hover:underline">
                      View
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

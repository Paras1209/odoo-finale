"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Approval {
  id: string;
  quotationId: string;
  quotationNumber: string;
  customerName: string;
  customerTier: string;
  repName: string;
  totalAmount: number;
  blendedRiskScore: number | null;
  level: string;
  status: string;
  createdAt: string;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const fetchApprovals = async () => {
    setLoading(true);
    const res = await api.get<any>(`/approval?status=${statusFilter}`);
    if (res.success && res.data) {
      setApprovals(res.data.data || res.data);
    }
    setLoading(false);
  };

  const getRiskBadgeColor = (score: number | null) => {
    if (score === null || score === 0) return 'bg-green-100 text-green-800';
    if (score <= 5) return 'bg-yellow-100 text-yellow-800';
    if (score <= 10) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getLevelBadgeColor = (level: string) => {
    return level === 'MANAGER' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-purple-100 text-purple-800';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'RETURNED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
        <div className="flex gap-2">
          <select 
            className="border p-2 rounded"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="RETURNED">Returned</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow rounded overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            Loading approvals...
          </div>
        ) : approvals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium">No {statusFilter.toLowerCase()} approvals</p>
            <p className="text-sm mt-1">
              {statusFilter === 'PENDING' 
                ? 'All quotations are either approved or don\'t require approval.'
                : `No approvals with ${statusFilter.toLowerCase()} status.`}
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Quotation</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Customer</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Rep</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Amount</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-center">Risk Score</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-center">Level</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-center">Status</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Submitted</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {approvals.map((approval) => (
                <tr key={approval.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/workspace/quotations/${approval.quotationId}`} className="text-blue-600 hover:underline font-medium">
                      {approval.quotationNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium">{approval.customerName}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                        approval.customerTier === 'GOLD' ? 'bg-yellow-100 text-yellow-800' :
                        approval.customerTier === 'SILVER' ? 'bg-gray-200 text-gray-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {approval.customerTier}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{approval.repName}</td>
                  <td className="px-4 py-3 text-right font-medium">${approval.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getRiskBadgeColor(approval.blendedRiskScore)}`}>
                      {approval.blendedRiskScore?.toFixed(1) ?? '0.0'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getLevelBadgeColor(approval.level)}`}>
                      {approval.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(approval.status)}`}>
                      {approval.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {new Date(approval.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link 
                      href={`/workspace/approvals/${approval.id}`} 
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 inline-block"
                    >
                      Review
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

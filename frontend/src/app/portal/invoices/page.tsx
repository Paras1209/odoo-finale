// ===========================================
// DealFlow360 - Portal Invoices Page
// ===========================================
// Full invoices list with payment status and details
// ===========================================

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Invoice {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  quotationId: string;
  invoiceType: 'ONE_TIME' | 'RECURRING';
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  dueDate: string | null;
  issuedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  lines: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  creditNotes: Array<{
    id: string;
    creditNoteNumber: string;
    amount: number;
    reason: string;
    status: string;
    issuedAt: string | null;
  }>;
}

interface InvoiceSummary {
  totalOutstanding: number;
  overdueCount: number;
  pendingCount: number;
  paidCount: number;
  totalPaid: number;
}

interface InvoicesResponse {
  invoices: Invoice[];
  summary: InvoiceSummary;
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: '📝' },
  SENT: { label: 'Pending', color: 'bg-orange-100 text-orange-800', icon: '⏳' },
  PAID: { label: 'Paid', color: 'bg-green-100 text-green-800', icon: '✅' },
  OVERDUE: { label: 'Overdue', color: 'bg-red-100 text-red-800', icon: '⚠️' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500', icon: '❌' },
};

const filterOptions = [
  { value: 'all', label: 'All Invoices' },
  { value: 'SENT', label: 'Pending' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'PAID', label: 'Paid' },
];

export default function PortalInvoicesPage() {
  const [data, setData] = useState<InvoicesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);

    const endpoint = statusFilter === 'all' 
      ? '/portal/invoices' 
      : `/portal/invoices?status=${statusFilter}`;

    const res = await api.get<InvoicesResponse>(endpoint);
    
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setError(res.error?.message || 'Failed to load invoices');
    }
    
    setLoading(false);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const toggleExpand = (invoiceId: string) => {
    setExpandedInvoice(expandedInvoice === invoiceId ? null : invoiceId);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices & Payments</h1>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {filterOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button 
            onClick={fetchInvoices}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {!loading && data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
            <p className="text-sm text-gray-500">Outstanding</p>
            <p className="text-2xl font-bold text-gray-900">
              ${data.summary.totalOutstanding.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {data.summary.pendingCount} pending invoice{data.summary.pendingCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <p className="text-sm text-gray-500">Overdue</p>
            <p className="text-2xl font-bold text-red-600">
              {data.summary.overdueCount}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              invoice{data.summary.overdueCount !== 1 ? 's' : ''} past due
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Paid This Year</p>
            <p className="text-2xl font-bold text-green-600">
              ${data.summary.totalPaid.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {data.summary.paidCount} invoice{data.summary.paidCount !== 1 ? 's' : ''} paid
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-900">
              {data.invoices.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">all time</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchInvoices}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            Retry
          </button>
        </div>
      ) : data?.invoices.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <span className="text-5xl mb-4 block">💰</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
          <p className="text-gray-500 mb-4">
            {statusFilter !== 'all' 
              ? `No ${filterOptions.find(o => o.value === statusFilter)?.label.toLowerCase()} invoices found.`
              : 'Your invoices will appear here once orders are processed.'}
          </p>
          <Link 
            href="/portal/orders"
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            View your orders →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.invoices.map((invoice) => {
            const status = statusConfig[invoice.status] || statusConfig.DRAFT;
            const daysUntilDue = getDaysUntilDue(invoice.dueDate);
            const isExpanded = expandedInvoice === invoice.id;
            const creditTotal = invoice.creditNotes.reduce((sum, cn) => sum + cn.amount, 0);

            return (
              <div 
                key={invoice.id}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                {/* Invoice Header */}
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpand(invoice.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {invoice.invoiceNumber}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                          {status.icon} {status.label}
                        </span>
                        {invoice.invoiceType === 'RECURRING' && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Recurring
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                        <span>Order: {invoice.orderNumber}</span>
                        <span>•</span>
                        <span>Issued: {formatDate(invoice.issuedAt)}</span>
                        {invoice.dueDate && (
                          <>
                            <span>•</span>
                            <span className={
                              invoice.status === 'OVERDUE' ? 'text-red-600 font-medium' :
                              daysUntilDue !== null && daysUntilDue <= 7 ? 'text-orange-600' : ''
                            }>
                              Due: {formatDate(invoice.dueDate)}
                              {daysUntilDue !== null && daysUntilDue > 0 && invoice.status !== 'PAID' && (
                                <span className="ml-1">({daysUntilDue} days)</span>
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        ${invoice.totalAmount.toLocaleString()}
                      </p>
                      {creditTotal > 0 && (
                        <p className="text-sm text-green-600">
                          -{creditTotal.toLocaleString()} credit
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        {isExpanded ? '▲ Hide details' : '▼ Show details'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Line Items */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Line Items</h4>
                        <div className="space-y-2">
                          {invoice.lines.map((line, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {line.quantity}x {line.productName}
                              </span>
                              <span className="text-gray-900 font-medium">
                                ${line.lineTotal.toLocaleString()}
                              </span>
                            </div>
                          ))}
                          <div className="border-t border-gray-200 pt-2 mt-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Subtotal</span>
                              <span>${invoice.amount.toLocaleString()}</span>
                            </div>
                            {invoice.taxAmount > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tax</span>
                                <span>${invoice.taxAmount.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-semibold mt-1">
                              <span>Total</span>
                              <span>${invoice.totalAmount.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Credit Notes & Actions */}
                      <div>
                        {invoice.creditNotes.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Credit Notes</h4>
                            <div className="space-y-2">
                              {invoice.creditNotes.map((cn) => (
                                <div key={cn.id} className="flex justify-between text-sm p-2 bg-green-50 rounded">
                                  <span className="text-gray-600">
                                    {cn.creditNoteNumber} - {cn.reason}
                                  </span>
                                  <span className="text-green-600 font-medium">
                                    -${cn.amount.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {invoice.status === 'PAID' && invoice.paidAt && (
                          <div className="p-3 bg-green-100 rounded-lg">
                            <p className="text-sm text-green-800">
                              <span className="font-medium">✓ Paid on {formatDate(invoice.paidAt)}</span>
                            </p>
                          </div>
                        )}

                        {(invoice.status === 'SENT' || invoice.status === 'OVERDUE') && (
                          <div className="space-y-3">
                            <div className={`p-3 rounded-lg ${
                              invoice.status === 'OVERDUE' ? 'bg-red-50' : 'bg-orange-50'
                            }`}>
                              <p className={`text-sm ${
                                invoice.status === 'OVERDUE' ? 'text-red-800' : 'text-orange-800'
                              }`}>
                                <span className="font-medium">
                                  Amount Due: ${(invoice.totalAmount - creditTotal).toLocaleString()}
                                </span>
                              </p>
                            </div>
                            <p className="text-xs text-gray-500">
                              Contact your sales representative for payment options and questions.
                            </p>
                          </div>
                        )}

                        <div className="mt-4">
                          <Link
                            href={`/portal/orders/${invoice.quotationId}`}
                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            View Order →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Instructions */}
      {data && data.summary.totalOutstanding > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Payment Information</h3>
          <p className="text-sm text-blue-700">
            To make a payment or discuss payment options, please contact your sales representative 
            or email <a href="mailto:billing@dealflow360.com" className="underline">billing@dealflow360.com</a>.
          </p>
        </div>
      )}
    </div>
  );
}

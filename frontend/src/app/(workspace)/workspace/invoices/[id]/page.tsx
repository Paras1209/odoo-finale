"use client";

// ===========================================
// DealFlow360 - Invoice Detail Page (Screen 13)
// ===========================================
// M4 - Dev A: Invoice detail with payment recording,
// credit notes, and status management
// ===========================================

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface InvoiceLine {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  lineTotal: number;
}

interface CreditNote {
  id: string;
  creditNoteNumber: string;
  amount: number;
  reason: string;
  status: 'DRAFT' | 'ISSUED' | 'APPLIED' | 'CANCELLED';
  issuedAt: string | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  quotationId: string;
  quotationNumber: string;
  customer: {
    id: string;
    name: string;
    email: string;
    tier: string;
  };
  invoiceType: 'ONE_TIME' | 'RECURRING';
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: string | null;
  issuedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  lines: InvoiceLine[];
  creditNotes: CreditNote[];
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // Credit note modal state
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
  const [creditNoteAmount, setCreditNoteAmount] = useState(0);
  const [creditNoteReason, setCreditNoteReason] = useState('');

  useEffect(() => {
    fetchInvoice();
  }, [resolvedParams.id]);

  const fetchInvoice = async () => {
    setLoading(true);
    setError(null);
    
    const res = await api.get<any>(`/billing/invoices/${resolvedParams.id}`);
    if (res.success && res.data) {
      const inv = res.data.data || res.data;
      setInvoice(inv);
      setPaymentAmount(inv.totalAmount);
    } else {
      setError(res.error?.message || 'Failed to load invoice');
    }
    setLoading(false);
  };

  const handleSendInvoice = async () => {
    setActionLoading(true);
    const res = await api.post<any>(`/billing/invoices/${resolvedParams.id}?action=send`);
    setActionLoading(false);
    
    if (res.success) {
      fetchInvoice();
    } else {
      alert(res.error?.message || 'Failed to send invoice');
    }
  };

  const handleRecordPayment = async () => {
    setActionLoading(true);
    const res = await api.post<any>(`/billing/invoices/${resolvedParams.id}?action=pay`, {
      amount: paymentAmount,
      paidAt: new Date(paymentDate).toISOString(),
    });
    setActionLoading(false);
    
    if (res.success) {
      setShowPaymentModal(false);
      fetchInvoice();
    } else {
      alert(res.error?.message || 'Failed to record payment');
    }
  };

  const handleCreateCreditNote = async () => {
    if (!creditNoteReason.trim()) {
      alert('Please provide a reason for the credit note');
      return;
    }
    if (creditNoteAmount <= 0) {
      alert('Credit note amount must be greater than 0');
      return;
    }

    setActionLoading(true);
    const res = await api.post<any>(`/billing/invoices/${resolvedParams.id}/credit-notes`, {
      amount: creditNoteAmount,
      reason: creditNoteReason,
    });
    setActionLoading(false);
    
    if (res.success) {
      setShowCreditNoteModal(false);
      setCreditNoteAmount(0);
      setCreditNoteReason('');
      fetchInvoice();
    } else {
      alert(res.error?.message || 'Failed to create credit note');
    }
  };

  const handleIssueCreditNote = async (creditNoteId: string) => {
    setActionLoading(true);
    const res = await api.post<any>(`/billing/invoices/${resolvedParams.id}/credit-notes?action=issue`, {
      creditNoteId,
    });
    setActionLoading(false);
    
    if (res.success) {
      fetchInvoice();
    } else {
      alert(res.error?.message || 'Failed to issue credit note');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-200 text-gray-800';
      case 'SENT': return 'bg-blue-100 text-blue-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-300 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCreditNoteStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-200 text-gray-700';
      case 'ISSUED': return 'bg-blue-100 text-blue-700';
      case 'APPLIED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Calculate net amount after credit notes
  const totalCredited = invoice?.creditNotes
    .filter(cn => cn.status !== 'CANCELLED')
    .reduce((sum, cn) => sum + cn.amount, 0) || 0;
  const netAmount = (invoice?.totalAmount || 0) - totalCredited;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-gray-500 text-lg">{error || 'Invoice not found'}</p>
          <Link href="/workspace/invoices" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/workspace/invoices" className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
            <span className={`px-2 py-1 rounded text-sm font-semibold ${getStatusBadgeClass(invoice.status)}`}>
              {invoice.status}
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            {invoice.invoiceType === 'ONE_TIME' ? 'One-Time Invoice' : 'Recurring Invoice'}
            {invoice.issuedAt && ` | Issued ${new Date(invoice.issuedAt).toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex gap-2">
          {invoice.status === 'DRAFT' && (
            <button
              onClick={handleSendInvoice}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {actionLoading ? 'Sending...' : 'Send Invoice'}
            </button>
          )}
          {['SENT', 'OVERDUE'].includes(invoice.status) && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Record Payment
            </button>
          )}
          {['SENT', 'PAID', 'OVERDUE'].includes(invoice.status) && (
            <button
              onClick={() => setShowCreditNoteModal(true)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              Create Credit Note
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h2>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Product</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">Qty</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">Unit Price</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">Discount</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoice.lines.map(line => (
                  <tr key={line.id}>
                    <td className="px-4 py-3">{line.productName}</td>
                    <td className="px-4 py-3 text-right">{line.quantity}</td>
                    <td className="px-4 py-3 text-right">${line.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">{line.discountPct}%</td>
                    <td className="px-4 py-3 text-right font-medium">${line.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2">
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-right text-gray-600">Subtotal</td>
                  <td className="px-4 py-2 text-right font-medium">${invoice.amount.toFixed(2)}</td>
                </tr>
                {invoice.taxAmount > 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right text-gray-600">Tax</td>
                    <td className="px-4 py-2 text-right font-medium">${invoice.taxAmount.toFixed(2)}</td>
                  </tr>
                )}
                <tr className="bg-gray-50">
                  <td colSpan={4} className="px-4 py-3 text-right font-semibold text-gray-900">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-lg">${invoice.totalAmount.toFixed(2)}</td>
                </tr>
                {totalCredited > 0 && (
                  <>
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-right text-green-600">Credit Applied</td>
                      <td className="px-4 py-2 text-right text-green-600">-${totalCredited.toFixed(2)}</td>
                    </tr>
                    <tr className="bg-blue-50">
                      <td colSpan={4} className="px-4 py-3 text-right font-semibold text-blue-900">Net Amount Due</td>
                      <td className="px-4 py-3 text-right font-bold text-lg text-blue-900">${netAmount.toFixed(2)}</td>
                    </tr>
                  </>
                )}
              </tfoot>
            </table>
          </div>

          {/* Credit Notes */}
          {invoice.creditNotes.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Credit Notes</h2>
              <div className="space-y-3">
                {invoice.creditNotes.map(cn => (
                  <div key={cn.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{cn.creditNoteNumber}</p>
                      <p className="text-sm text-gray-500">{cn.reason}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-green-600">-${cn.amount.toFixed(2)}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getCreditNoteStatusBadge(cn.status)}`}>
                        {cn.status}
                      </span>
                      {cn.status === 'DRAFT' && (
                        <button
                          onClick={() => handleIssueCreditNote(cn.id)}
                          disabled={actionLoading}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Issue
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusBadgeClass(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-medium">{invoice.invoiceType === 'ONE_TIME' ? 'One-Time' : 'Recurring'}</span>
              </div>
              {invoice.dueDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date</span>
                  <span className={`font-medium ${invoice.status === 'OVERDUE' ? 'text-red-600' : ''}`}>
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {invoice.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid On</span>
                  <span className="font-medium text-green-600">
                    {new Date(invoice.paidAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              <hr />
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <span className="font-bold">${invoice.totalAmount.toFixed(2)}</span>
              </div>
              {totalCredited > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Net Due</span>
                  <span className="font-bold text-blue-600">${netAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
            <div className="space-y-2">
              <p className="font-medium">{invoice.customer.name}</p>
              <p className="text-sm text-gray-500">{invoice.customer.email}</p>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                invoice.customer.tier === 'GOLD' ? 'bg-yellow-100 text-yellow-700' :
                invoice.customer.tier === 'SILVER' ? 'bg-gray-200 text-gray-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {invoice.customer.tier}
              </span>
            </div>
          </div>

          {/* Related Quotation */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Quotation</h2>
            <Link 
              href={`/workspace/quotations/${invoice.quotationId}`}
              className="text-blue-600 hover:underline font-medium"
            >
              {invoice.quotationNumber}
            </Link>
          </div>

          {/* Dates */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
              </div>
              {invoice.issuedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Issued</span>
                  <span>{new Date(invoice.issuedAt).toLocaleDateString()}</span>
                </div>
              )}
              {invoice.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid</span>
                  <span className="text-green-600">{new Date(invoice.paidAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Record Payment</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full border rounded-lg pl-7 pr-3 py-2"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Invoice total: ${invoice.totalAmount.toFixed(2)}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Note Modal */}
      {showCreditNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Create Credit Note</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={netAmount}
                  value={creditNoteAmount}
                  onChange={(e) => setCreditNoteAmount(parseFloat(e.target.value) || 0)}
                  className="w-full border rounded-lg pl-7 pr-3 py-2"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Max: ${netAmount.toFixed(2)}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
              <textarea
                value={creditNoteReason}
                onChange={(e) => setCreditNoteReason(e.target.value)}
                placeholder="Reason for credit note..."
                className="w-full border rounded-lg px-3 py-2 h-24"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowCreditNoteModal(false); setCreditNoteAmount(0); setCreditNoteReason(''); }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCreditNote}
                disabled={actionLoading || !creditNoteReason.trim() || creditNoteAmount <= 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Creating...' : 'Create Credit Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

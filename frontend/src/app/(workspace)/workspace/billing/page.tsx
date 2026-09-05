// ===========================================
// DealFlow360 - Billing Page
// ===========================================
// PHASE 0: Stub billing page.
// TODO: Implement actual billing in Phase 1+ (Dev A)
// ===========================================

export default function BillingPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <button className="btn-primary">+ Create Invoice</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Outstanding</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">$45,230</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Overdue</p>
          <p className="text-2xl font-bold text-red-600 mt-1">$12,500</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">This Month</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">$89,750</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Credit Notes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">$3,200</p>
        </div>
      </div>

      {/* Invoices placeholder */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Invoices</h2>
        <p className="text-gray-500 text-sm text-center py-8">
          Invoice list will be implemented in Phase 1 (Dev A).
          <br />
          <span className="text-xs text-gray-400 mt-2 block">
            This page will show: Invoices, Credit Notes, Payment status, Billing schedules
          </span>
        </p>
      </div>
    </div>
  );
}

// ===========================================
// DealFlow360 - Customer Portal Dashboard
// ===========================================
// PHASE 0: Stub portal dashboard.
// TODO: Implement actual dashboard in Phase 1+
// ===========================================

export default function PortalDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome back!</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Active Quotations</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">3</p>
          <p className="text-sm text-gray-500 mt-1">1 pending approval</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Orders in Progress</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">2</p>
          <p className="text-sm text-gray-500 mt-1">1 shipping today</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Outstanding Balance</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">$12,450</p>
          <p className="text-sm text-gray-500 mt-1">2 invoices due</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <p className="text-gray-500 text-sm">
          Activity timeline will be implemented in Phase 1
        </p>
      </div>
    </div>
  );
}

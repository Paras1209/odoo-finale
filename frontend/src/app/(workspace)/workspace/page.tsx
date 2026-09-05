// ===========================================
// DealFlow360 - Workspace Dashboard
// ===========================================
// PHASE 0: Stub dashboard page.
// TODO: Implement actual dashboard in Phase 1+
// ===========================================

export default function WorkspaceDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Open Quotations" value="12" change="+3 today" trend="up" />
        <StatCard title="Pending Approvals" value="5" change="2 urgent" trend="warning" />
        <StatCard title="This Month Revenue" value="$142,500" change="+12%" trend="up" />
        <StatCard title="Active Customers" value="47" change="+2 this week" trend="up" />
      </div>

      {/* Quick Actions */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary">New Quotation</button>
          <button className="btn-secondary">View Pending Approvals</button>
          <button className="btn-secondary">Check Inventory</button>
        </div>
      </div>

      {/* Placeholder content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Quotations</h2>
          <p className="text-gray-500 text-sm">
            Quotation list will be implemented in Phase 1
          </p>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals</h2>
          <p className="text-gray-500 text-sm">
            Approval queue will be implemented in Phase 1
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  change, 
  trend 
}: { 
  title: string; 
  value: string; 
  change: string; 
  trend: 'up' | 'down' | 'warning';
}) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    warning: 'text-yellow-600',
  };

  return (
    <div className="card">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      <p className={`text-sm mt-1 ${trendColors[trend]}`}>{change}</p>
    </div>
  );
}

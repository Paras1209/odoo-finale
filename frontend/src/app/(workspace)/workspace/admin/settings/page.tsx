// ===========================================
// DealFlow360 - Admin Settings Page
// ===========================================
// PHASE 0: Stub admin settings page.
// TODO: Implement actual settings in Phase 1+
// ===========================================

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">System Settings</h1>

      <div className="space-y-6">
        {/* Approval Settings */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Approval Settings</h2>
          <p className="text-gray-500 text-sm">
            Configure approval chains and thresholds here. (Phase 1)
          </p>
        </div>

        {/* Discount Settings */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Discount Tiers</h2>
          <p className="text-gray-500 text-sm">
            Configure discount tiers by customer tier and category. (Phase 1)
          </p>
        </div>

        {/* Warehouse Settings */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Warehouse Settings</h2>
          <p className="text-gray-500 text-sm">
            Configure warehouses and fulfillment priorities. (Phase 1)
          </p>
        </div>
      </div>
    </div>
  );
}

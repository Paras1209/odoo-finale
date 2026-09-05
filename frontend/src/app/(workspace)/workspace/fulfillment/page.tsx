// ===========================================
// DealFlow360 - Fulfillment Page
// ===========================================
// PHASE 0: Stub fulfillment page.
// TODO: Implement actual fulfillment in Phase 1+ (Dev B)
// ===========================================

export default function FulfillmentPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fulfillment</h1>
      </div>

      {/* Warehouse overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900">East Warehouse</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">156</p>
          <p className="text-sm text-gray-500">items in stock</p>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900">West Warehouse</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">243</p>
          <p className="text-sm text-gray-500">items in stock</p>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900">Central Warehouse</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">412</p>
          <p className="text-sm text-gray-500">items in stock</p>
        </div>
      </div>

      {/* Orders to fulfill */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Fulfillment</h2>
        <p className="text-gray-500 text-sm text-center py-8">
          Fulfillment queue will be implemented in Phase 1 (Dev B).
          <br />
          <span className="text-xs text-gray-400 mt-2 block">
            This page will show: Orders to fulfill, warehouse allocation, backorders
          </span>
        </p>
      </div>
    </div>
  );
}

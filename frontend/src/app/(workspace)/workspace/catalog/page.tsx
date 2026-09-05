// ===========================================
// DealFlow360 - Catalog Page
// ===========================================
// PHASE 0: Stub catalog page.
// TODO: Implement actual catalog in Phase 1+ (Dev B)
// ===========================================

export default function CatalogPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
        <button className="btn-primary">+ Add Product</button>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card cursor-pointer hover:border-indigo-300 transition">
          <h3 className="font-semibold text-gray-900">Hardware</h3>
          <p className="text-sm text-gray-500">Physical products</p>
        </div>
        <div className="card cursor-pointer hover:border-indigo-300 transition">
          <h3 className="font-semibold text-gray-900">Services</h3>
          <p className="text-sm text-gray-500">Professional services</p>
        </div>
        <div className="card cursor-pointer hover:border-indigo-300 transition">
          <h3 className="font-semibold text-gray-900">Subscriptions</h3>
          <p className="text-sm text-gray-500">Recurring plans</p>
        </div>
      </div>

      {/* Products placeholder */}
      <div className="card">
        <p className="text-gray-500 text-sm text-center py-8">
          Product catalog will be implemented in Phase 1 (Dev B).
          <br />
          <span className="text-xs text-gray-400 mt-2 block">
            This page will show: Products, Variants, Pricing, Stock levels
          </span>
        </p>
      </div>
    </div>
  );
}

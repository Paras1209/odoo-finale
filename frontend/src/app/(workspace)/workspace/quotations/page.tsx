// ===========================================
// DealFlow360 - Quotations List Page
// ===========================================
// PHASE 0: Stub quotations list page.
// TODO: Implement actual list in Phase 1+ (Dev A)
// ===========================================

export default function QuotationsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
        <button className="btn-primary">+ New Quotation</button>
      </div>

      {/* Filters placeholder */}
      <div className="card mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search quotations..."
            className="input-field max-w-sm"
          />
          <select className="input-field max-w-xs">
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="CONFIRMED">Confirmed</option>
          </select>
        </div>
      </div>

      {/* Table placeholder */}
      <div className="card">
        <p className="text-gray-500 text-sm text-center py-8">
          Quotation list will be implemented in Phase 1 (Dev A).
          <br />
          <span className="text-xs text-gray-400 mt-2 block">
            This page will show: Quote #, Customer, Total, Status, Created, Actions
          </span>
        </p>
      </div>
    </div>
  );
}

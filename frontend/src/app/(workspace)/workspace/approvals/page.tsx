// ===========================================
// DealFlow360 - Approvals Queue Page
// ===========================================
// PHASE 0: Stub approvals page.
// TODO: Implement actual queue in Phase 1+ (Dev A)
// ===========================================

export default function ApprovalsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
        <div className="flex gap-2">
          <span className="badge-warning">5 pending</span>
        </div>
      </div>

      {/* Queue placeholder */}
      <div className="card">
        <p className="text-gray-500 text-sm text-center py-8">
          Approval queue will be implemented in Phase 1 (Dev A).
          <br />
          <span className="text-xs text-gray-400 mt-2 block">
            This page will show quotations requiring approval based on:
            <br />
            - User role (Manager/Finance)
            <br />
            - Risk score thresholds
            <br />
            - Approval chain configuration
          </span>
        </p>
      </div>
    </div>
  );
}

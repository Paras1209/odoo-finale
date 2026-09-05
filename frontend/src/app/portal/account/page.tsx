// ===========================================
// DealFlow360 - Portal Account Page
// ===========================================
// PHASE 0: Stub portal account page.
// TODO: Implement actual account settings in Phase 1+ (Dev B)
// ===========================================

export default function PortalAccountPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h1>

      {/* Account settings placeholder */}
      <div className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
          <p className="text-gray-500 text-sm">
            Update your company details and contact information. (Phase 1)
          </p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Password</h2>
          <p className="text-gray-500 text-sm">
            Change your portal password. (Phase 1)
          </p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
          <p className="text-gray-500 text-sm">
            Configure email notifications for orders and invoices. (Phase 1)
          </p>
        </div>
      </div>
    </div>
  );
}

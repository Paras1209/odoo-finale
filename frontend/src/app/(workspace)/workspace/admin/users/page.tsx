// ===========================================
// DealFlow360 - Admin Users Page
// ===========================================
// PHASE 0: Stub admin users page.
// TODO: Implement actual user management in Phase 1+
// ===========================================

export default function AdminUsersPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button className="btn-primary">+ Add User</button>
      </div>

      {/* User list placeholder */}
      <div className="card">
        <p className="text-gray-500 text-sm text-center py-8">
          User management will be implemented in Phase 1.
          <br />
          <span className="text-xs text-gray-400 mt-2 block">
            This page will allow admins to manage internal users and their roles.
          </span>
        </p>
      </div>
    </div>
  );
}

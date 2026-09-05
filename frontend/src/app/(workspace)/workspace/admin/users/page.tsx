// ===========================================
// DealFlow360 - Admin User Management Page
// ===========================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Badge, Input, Card, CardContent } from '@/components/ui';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  quotationCount: number;
  approvalCount: number;
  createdAt: string;
  updatedAt: string;
}

type UserRole = 'SALES_REP' | 'SALES_MANAGER' | 'FINANCE_OPS' | 'ADMIN';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const INITIAL_FORM: UserFormData = {
  name: '',
  email: '',
  password: '',
  role: 'SALES_REP',
};

const roleLabels: Record<UserRole, string> = {
  SALES_REP: 'Sales Rep',
  SALES_MANAGER: 'Sales Manager',
  FINANCE_OPS: 'Finance',
  ADMIN: 'Admin',
};

const roleColors: Record<UserRole, 'info' | 'success' | 'warning' | 'danger'> = {
  SALES_REP: 'info',
  SALES_MANAGER: 'warning',
  FINANCE_OPS: 'success',
  ADMIN: 'danger',
};

export default function AdminUsersPage() {
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [saving, setSaving] = useState(false);

  // Message
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('pageSize', pagination.pageSize.toString());

      if (searchQuery) params.set('search', searchQuery);
      if (roleFilter) params.set('role', roleFilter);
      if (activeFilter) params.set('isActive', activeFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch users');
      }

      setUsers(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, searchQuery, roleFilter, activeFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Open create modal
  const openCreateModal = () => {
    setFormData(INITIAL_FORM);
    setFormErrors({});
    setEditingUser(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't prefill password
      role: user.role,
    });
    setFormErrors({});
    setEditingUser(user);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData(INITIAL_FORM);
    setFormErrors({});
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof UserFormData, string>> = {};

    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
    if (modalMode === 'create' && !formData.password) errors.password = 'Password is required';
    if (formData.password && formData.password.length < 6) errors.password = 'Password must be at least 6 characters';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    setMessage(null);

    try {
      const url =
        modalMode === 'create' ? '/api/admin/users' : `/api/admin/users/${editingUser!.id}`;

      const method = modalMode === 'create' ? 'POST' : 'PUT';

      // Only send password if provided (for edit mode)
      const payload: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save user');
      }

      setMessage({
        type: 'success',
        text: modalMode === 'create' ? 'User created successfully' : 'User updated successfully',
      });
      closeModal();
      fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'An error occurred' });
    } finally {
      setSaving(false);
    }
  };

  // Handle deactivate
  const handleDeactivate = async (user: User) => {
    if (!confirm(`Are you sure you want to deactivate "${user.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to deactivate user');
      }

      setMessage({ type: 'success', text: 'User deactivated successfully' });
      fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'An error occurred' });
    }
  };

  // Handle reactivate
  const handleReactivate = async (user: User) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to reactivate user');
      }

      setMessage({ type: 'success', text: 'User reactivated successfully' });
      fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'An error occurred' });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage internal users and their roles</p>
        </div>
        <Button onClick={openCreateModal}>+ Add User</Button>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-4 text-sm underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Role Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {(['SALES_REP', 'SALES_MANAGER', 'FINANCE_OPS', 'ADMIN'] as UserRole[]).map((role) => {
          const count = users.filter((u) => u.role === role && u.isActive).length;
          return (
            <Card
              key={role}
              className={`cursor-pointer hover:border-indigo-300 transition ${
                roleFilter === role ? 'border-indigo-500 ring-2 ring-indigo-200' : ''
              }`}
              onClick={() => setRoleFilter(roleFilter === role ? '' : role)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{roleLabels[role]}</h3>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">{count}</p>
                  </div>
                  <Badge variant={roleColors[role]}>{role.replace('_', ' ')}</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              />
            </div>
            <select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            {(searchQuery || roleFilter || activeFilter) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('');
                  setActiveFilter('');
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700">
            Dismiss
          </button>
        </div>
      )}

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No users found</p>
              {(searchQuery || roleFilter || activeFilter) && (
                <p className="text-sm mt-2">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quotations
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approvals
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={roleColors[user.role]}>{roleLabels[user.role]}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                        {user.quotationCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                        {user.approvalCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Badge variant={user.isActive ? 'success' : 'danger'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(user)}>
                          Edit
                        </Button>
                        {user.isActive ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                            onClick={() => handleDeactivate(user)}
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 ml-2"
                            onClick={() => handleReactivate(user)}
                          >
                            Reactivate
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total} users
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={closeModal}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4">
                {modalMode === 'create' ? 'Add New User' : 'Edit User'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <Input
                    label="Name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    error={formErrors.name}
                  />

                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    error={formErrors.email}
                  />

                  <Input
                    label={modalMode === 'create' ? 'Password' : 'New Password (leave blank to keep current)'}
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    error={formErrors.password}
                    placeholder={modalMode === 'edit' ? 'Leave blank to keep current password' : ''}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, role: e.target.value as UserRole }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="SALES_REP">Sales Rep</option>
                      <option value="SALES_MANAGER">Sales Manager</option>
                      <option value="FINANCE_OPS">Finance</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  {/* Role Description */}
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                    {formData.role === 'SALES_REP' && (
                      <p>Sales reps can create and manage quotations for customers.</p>
                    )}
                    {formData.role === 'SALES_MANAGER' && (
                      <p>Sales managers can approve quotations that exceed discount thresholds.</p>
                    )}
                    {formData.role === 'FINANCE_OPS' && (
                      <p>Finance users can approve high-risk quotations and manage invoicing.</p>
                    )}
                    {formData.role === 'ADMIN' && (
                      <p>Admins have full access to all system settings and user management.</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button type="button" variant="secondary" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={saving}>
                    {modalMode === 'create' ? 'Create User' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

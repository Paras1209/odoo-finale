// ===========================================
// DealFlow360 - Warehouse Management Page
// ===========================================
// DEV B's MODULE: CRUD for warehouses and stock levels
// ===========================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// Types
interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string | null;
  shippingCostWeight: number;
  isActive: boolean;
  stockLevelCount: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showInactive, setShowInactive] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    shippingCostWeight: 1,
  });
  const [saving, setSaving] = useState(false);

  // Fetch warehouses
  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('pageSize', '20');
      if (!showInactive) params.set('isActive', 'true');

      const res = await fetch(`/api/fulfillment/warehouses?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setWarehouses(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.error?.message || 'Failed to fetch warehouses');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, showInactive]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingWarehouse
        ? `/api/fulfillment/warehouses/${editingWarehouse.id}`
        : '/api/fulfillment/warehouses';
      
      const res = await fetch(url, {
        method: editingWarehouse ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setShowModal(false);
        setEditingWarehouse(null);
        setFormData({ name: '', code: '', address: '', shippingCostWeight: 1 });
        fetchWarehouses();
      } else {
        alert(data.error?.message || 'Failed to save warehouse');
      }
    } catch (err) {
      alert('Network error. Please try again.');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Handle edit click
  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address || '',
      shippingCostWeight: warehouse.shippingCostWeight,
    });
    setShowModal(true);
  };

  // Handle deactivate
  const handleDeactivate = async (warehouse: Warehouse) => {
    if (!confirm(`Are you sure you want to deactivate warehouse "${warehouse.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/fulfillment/warehouses/${warehouse.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        fetchWarehouses();
      } else {
        alert(data.error?.message || 'Failed to deactivate warehouse');
      }
    } catch (err) {
      alert('Network error. Please try again.');
      console.error('Deactivate error:', err);
    }
  };

  // Handle new warehouse click
  const handleNew = () => {
    setEditingWarehouse(null);
    setFormData({ name: '', code: '', address: '', shippingCostWeight: 1 });
    setShowModal(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link
            href="/workspace/fulfillment"
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            &larr; Back to Fulfillment
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
        </div>
        <button onClick={handleNew} className="btn-primary">
          + New Warehouse
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => {
                setShowInactive(e.target.checked);
                setCurrentPage(1);
              }}
              className="rounded border-gray-300"
            />
            Show inactive warehouses
          </label>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="card mb-6 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
          <button onClick={fetchWarehouses} className="btn-secondary mt-2">
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      )}

      {/* Warehouse List */}
      {!loading && !error && (
        <div className="card overflow-hidden">
          {warehouses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No warehouses found.</p>
              <button onClick={handleNew} className="btn-primary">
                Create First Warehouse
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Warehouse
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shipping Weight
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock Items
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {warehouses.map((warehouse) => (
                      <tr key={warehouse.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900">{warehouse.name}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded">
                            {warehouse.code}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {warehouse.address || '-'}
                        </td>
                        <td className="px-4 py-4 text-center text-sm">
                          {warehouse.shippingCostWeight}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Link
                            href={`/workspace/fulfillment/warehouses/${warehouse.id}/stock`}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            {warehouse.stockLevelCount} items
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {warehouse.isActive ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(warehouse)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Edit
                            </button>
                            {warehouse.isActive && (
                              <button
                                onClick={() => handleDeactivate(warehouse)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Deactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                    {pagination.total} warehouses
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="btn-secondary disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage === pagination.totalPages}
                      className="btn-secondary disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingWarehouse ? 'Edit Warehouse' : 'New Warehouse'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="input-field w-full font-mono"
                    placeholder="e.g., WH-EAST"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Unique identifier, auto-uppercased</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-field w-full"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Cost Weight
                  </label>
                  <input
                    type="number"
                    value={formData.shippingCostWeight}
                    onChange={(e) => setFormData({ ...formData, shippingCostWeight: parseFloat(e.target.value) || 1 })}
                    className="input-field w-full"
                    min="0"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Higher values = more expensive shipping (used in split algorithm)
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingWarehouse(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                  {saving ? 'Saving...' : editingWarehouse ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

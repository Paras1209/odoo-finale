// ===========================================
// DealFlow360 - Price Lists Page
// ===========================================
// DEV B's MODULE: Price list management
// ===========================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Badge, Input, Card, CardContent } from '@/components/ui';
import { CustomerTier } from '@/lib/types';

// Types for price lists page
interface PriceList {
  id: string;
  name: string;
  customerTier: CustomerTier | null;
  currency: string;
  isDefault: boolean;
  validFrom: string | null;
  validTo: string | null;
  isActive: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PriceListItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  productCategory: string;
  basePrice: number;
  listPrice: number;
  productActive: boolean;
}

interface PriceListDetail extends Omit<PriceList, 'itemCount'> {
  items: PriceListItem[];
}

interface PriceListFormData {
  name: string;
  customerTier: CustomerTier | '';
  currency: string;
  isDefault: boolean;
  validFrom: string;
  validTo: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const INITIAL_FORM: PriceListFormData = {
  name: '',
  customerTier: '',
  currency: 'USD',
  isDefault: false,
  validFrom: '',
  validTo: '',
};

export default function PriceListsPage() {
  // State
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [tierFilter, setTierFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('');

  // Create/Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(null);
  const [formData, setFormData] = useState<PriceListFormData>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof PriceListFormData, string>>>({});
  const [saving, setSaving] = useState(false);

  // Detail/Items Modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPriceList, setSelectedPriceList] = useState<PriceListDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch price lists
  const fetchPriceLists = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('pageSize', pagination.pageSize.toString());
      
      if (tierFilter) params.set('customerTier', tierFilter);
      if (activeFilter) params.set('isActive', activeFilter);

      const response = await fetch(`/api/catalog/price-lists?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch price lists');
      }

      setPriceLists(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, tierFilter, activeFilter]);

  useEffect(() => {
    fetchPriceLists();
  }, [fetchPriceLists]);

  // Fetch price list detail
  const fetchPriceListDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const response = await fetch(`/api/catalog/price-lists/${id}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch price list details');
      }

      setSelectedPriceList(result.data);
      setIsDetailModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setFormData(INITIAL_FORM);
    setFormErrors({});
    setEditingPriceList(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (priceList: PriceList) => {
    setFormData({
      name: priceList.name,
      customerTier: priceList.customerTier || '',
      currency: priceList.currency,
      isDefault: priceList.isDefault,
      validFrom: priceList.validFrom ? priceList.validFrom.split('T')[0] : '',
      validTo: priceList.validTo ? priceList.validTo.split('T')[0] : '',
    });
    setFormErrors({});
    setEditingPriceList(priceList);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  // Close modals
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPriceList(null);
    setFormData(INITIAL_FORM);
    setFormErrors({});
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedPriceList(null);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof PriceListFormData, string>> = {};

    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.currency.trim()) errors.currency = 'Currency is required';

    if (formData.validFrom && formData.validTo) {
      if (new Date(formData.validFrom) > new Date(formData.validTo)) {
        errors.validTo = 'End date must be after start date';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    setError(null);

    try {
      const url = modalMode === 'create' 
        ? '/api/catalog/price-lists' 
        : `/api/catalog/price-lists/${editingPriceList!.id}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const payload = {
        name: formData.name,
        customerTier: formData.customerTier || null,
        currency: formData.currency,
        isDefault: formData.isDefault,
        validFrom: formData.validFrom || null,
        validTo: formData.validTo || null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save price list');
      }

      closeModal();
      fetchPriceLists();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Handle deactivate
  const handleDeactivate = async (priceList: PriceList) => {
    if (!confirm(`Are you sure you want to deactivate "${priceList.name}"?`)) return;

    try {
      const response = await fetch(`/api/catalog/price-lists/${priceList.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to deactivate price list');
      }

      fetchPriceLists();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Get tier badge variant
  const getTierVariant = (tier: CustomerTier | null): 'default' | 'warning' | 'info' | 'success' => {
    switch (tier) {
      case CustomerTier.BRONZE:
        return 'default';
      case CustomerTier.SILVER:
        return 'info';
      case CustomerTier.GOLD:
        return 'warning';
      default:
        return 'success';
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
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
          <h1 className="text-2xl font-bold text-gray-900">Price Lists</h1>
          <p className="text-sm text-gray-500 mt-1">Manage tier-specific pricing for products</p>
        </div>
        <Button onClick={openCreateModal}>+ New Price List</Button>
      </div>

      {/* Tier Filter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card 
          className={`cursor-pointer hover:border-indigo-300 transition ${tierFilter === '' ? 'border-indigo-500 ring-2 ring-indigo-200' : ''}`}
          onClick={() => setTierFilter('')}
        >
          <CardContent className="py-4">
            <h3 className="font-semibold text-gray-900">All Tiers</h3>
            <p className="text-sm text-gray-500">View all price lists</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover:border-indigo-300 transition ${tierFilter === CustomerTier.BRONZE ? 'border-indigo-500 ring-2 ring-indigo-200' : ''}`}
          onClick={() => setTierFilter(tierFilter === CustomerTier.BRONZE ? '' : CustomerTier.BRONZE)}
        >
          <CardContent className="py-4">
            <h3 className="font-semibold text-gray-900">Bronze</h3>
            <p className="text-sm text-gray-500">Standard pricing</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover:border-indigo-300 transition ${tierFilter === CustomerTier.SILVER ? 'border-indigo-500 ring-2 ring-indigo-200' : ''}`}
          onClick={() => setTierFilter(tierFilter === CustomerTier.SILVER ? '' : CustomerTier.SILVER)}
        >
          <CardContent className="py-4">
            <h3 className="font-semibold text-gray-900">Silver</h3>
            <p className="text-sm text-gray-500">Mid-tier pricing</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover:border-indigo-300 transition ${tierFilter === CustomerTier.GOLD ? 'border-indigo-500 ring-2 ring-indigo-200' : ''}`}
          onClick={() => setTierFilter(tierFilter === CustomerTier.GOLD ? '' : CustomerTier.GOLD)}
        >
          <CardContent className="py-4">
            <h3 className="font-semibold text-gray-900">Gold</h3>
            <p className="text-sm text-gray-500">Premium pricing</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            {(tierFilter || activeFilter) && (
              <Button 
                variant="ghost" 
                onClick={() => {
                  setTierFilter('');
                  setActiveFilter('');
                  setPagination(prev => ({ ...prev, page: 1 }));
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
          <button 
            onClick={() => setError(null)} 
            className="ml-4 text-red-500 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Price Lists Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : priceLists.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No price lists found</p>
              {(tierFilter || activeFilter) && (
                <p className="text-sm mt-2">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Currency
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valid Period
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {priceLists.map((priceList) => (
                    <tr key={priceList.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {priceList.name}
                            {priceList.isDefault && (
                              <Badge variant="info" className="text-xs">Default</Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getTierVariant(priceList.customerTier)}>
                          {priceList.customerTier || 'All Tiers'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {priceList.currency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button 
                          onClick={() => fetchPriceListDetail(priceList.id)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          disabled={loadingDetail}
                        >
                          {priceList.itemCount} items
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {priceList.validFrom || priceList.validTo
                          ? `${formatDate(priceList.validFrom)} - ${formatDate(priceList.validTo)}`
                          : 'No date restriction'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Badge variant={priceList.isActive ? 'success' : 'danger'}>
                          {priceList.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(priceList)}>
                          Edit
                        </Button>
                        {priceList.isActive && !priceList.isDefault && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                            onClick={() => handleDeactivate(priceList)}
                          >
                            Deactivate
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
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} price lists
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
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
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              onClick={closeModal}
            />
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <h2 className="text-xl font-semibold mb-4">
                {modalMode === 'create' ? 'Create Price List' : 'Edit Price List'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <Input
                    label="Name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    error={formErrors.name}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Tier
                    </label>
                    <select
                      value={formData.customerTier}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerTier: e.target.value as CustomerTier | '' }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">All Tiers (Default List)</option>
                      <option value={CustomerTier.BRONZE}>Bronze</option>
                      <option value={CustomerTier.SILVER}>Silver</option>
                      <option value={CustomerTier.GOLD}>Gold</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Tier-specific lists take priority over default lists
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Currency"
                      value={formData.currency}
                      onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                      error={formErrors.currency}
                      maxLength={3}
                    />
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isDefault}
                          onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">Set as default</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valid From
                      </label>
                      <input
                        type="date"
                        value={formData.validFrom}
                        onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valid To
                      </label>
                      <input
                        type="date"
                        value={formData.validTo}
                        onChange={(e) => setFormData(prev => ({ ...prev, validTo: e.target.value }))}
                        className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 ${
                          formErrors.validTo ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.validTo && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.validTo}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button type="button" variant="secondary" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={saving}>
                    {modalMode === 'create' ? 'Create Price List' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail/Items Modal */}
      {isDetailModalOpen && selectedPriceList && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              onClick={closeDetailModal}
            />
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{selectedPriceList.name}</h2>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={getTierVariant(selectedPriceList.customerTier)}>
                      {selectedPriceList.customerTier || 'All Tiers'}
                    </Badge>
                    {selectedPriceList.isDefault && (
                      <Badge variant="info">Default</Badge>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={closeDetailModal}>
                  Close
                </Button>
              </div>

              <div className="overflow-auto flex-1">
                {selectedPriceList.items.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No items in this price list</p>
                    <p className="text-sm mt-2">Add products to set custom pricing</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Category
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Base Price
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          List Price
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Discount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedPriceList.items.map((item) => {
                        const discount = item.basePrice > 0 
                          ? ((item.basePrice - item.listPrice) / item.basePrice * 100).toFixed(1)
                          : '0';
                        return (
                          <tr key={item.id} className={!item.productActive ? 'opacity-50' : ''}>
                            <td className="px-4 py-3">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                                <div className="text-xs text-gray-500">{item.productSku}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {item.productCategory}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-500">
                              {formatCurrency(item.basePrice, selectedPriceList.currency)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                              {formatCurrency(item.listPrice, selectedPriceList.currency)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              {parseFloat(discount) > 0 ? (
                                <span className="text-green-600">-{discount}%</span>
                              ) : parseFloat(discount) < 0 ? (
                                <span className="text-red-600">+{Math.abs(parseFloat(discount)).toFixed(1)}%</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
                {selectedPriceList.items.length} products in this price list
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

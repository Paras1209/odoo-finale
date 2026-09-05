// ===========================================
// DealFlow360 - Catalog Page
// ===========================================
// DEV B's MODULE: Product catalog management
// ===========================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Badge, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { ProductCategory } from '@/lib/types';

// Types for the catalog page
interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  costPrice: number;
  salePrice: number;
  stockQty: number;
  isActive: boolean;
  variantCount: number;
  createdAt: string;
}

interface ProductFormData {
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  costPrice: number;
  salePrice: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const INITIAL_FORM: ProductFormData = {
  sku: '',
  name: '',
  description: '',
  category: ProductCategory.HARDWARE,
  costPrice: 0,
  salePrice: 0,
};

export default function CatalogPage() {
  // State
  const [products, setProducts] = useState<Product[]>([]);
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
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [saving, setSaving] = useState(false);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('pageSize', pagination.pageSize.toString());
      
      if (searchQuery) params.set('search', searchQuery);
      if (categoryFilter) params.set('category', categoryFilter);
      if (activeFilter) params.set('isActive', activeFilter);

      const response = await fetch(`/api/catalog/products?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch products');
      }

      setProducts(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, searchQuery, categoryFilter, activeFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Open create modal
  const openCreateModal = () => {
    setFormData(INITIAL_FORM);
    setFormErrors({});
    setEditingProduct(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (product: Product) => {
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      category: product.category,
      costPrice: product.costPrice,
      salePrice: product.salePrice,
    });
    setFormErrors({});
    setEditingProduct(product);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData(INITIAL_FORM);
    setFormErrors({});
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ProductFormData, string>> = {};

    if (!formData.sku.trim()) errors.sku = 'SKU is required';
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (formData.costPrice < 0) errors.costPrice = 'Cost price must be non-negative';
    if (formData.salePrice <= 0) errors.salePrice = 'Sale price must be positive';

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
        ? '/api/catalog/products' 
        : `/api/catalog/products/${editingProduct!.id}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save product');
      }

      closeModal();
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete (soft delete)
  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to deactivate "${product.name}"?`)) return;

    try {
      const response = await fetch(`/api/catalog/products/${product.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to deactivate product');
      }

      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Category badge color
  const getCategoryVariant = (category: ProductCategory): 'info' | 'success' | 'warning' => {
    switch (category) {
      case ProductCategory.HARDWARE:
        return 'info';
      case ProductCategory.SERVICE:
        return 'success';
      case ProductCategory.SUBSCRIPTION:
        return 'warning';
      default:
        return 'info';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
        <Button onClick={openCreateModal}>+ Add Product</Button>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card 
          className={`cursor-pointer hover:border-indigo-300 transition ${categoryFilter === ProductCategory.HARDWARE ? 'border-indigo-500 ring-2 ring-indigo-200' : ''}`}
          onClick={() => setCategoryFilter(categoryFilter === ProductCategory.HARDWARE ? '' : ProductCategory.HARDWARE)}
        >
          <CardContent className="py-4">
            <h3 className="font-semibold text-gray-900">Hardware</h3>
            <p className="text-sm text-gray-500">Physical products</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover:border-indigo-300 transition ${categoryFilter === ProductCategory.SERVICE ? 'border-indigo-500 ring-2 ring-indigo-200' : ''}`}
          onClick={() => setCategoryFilter(categoryFilter === ProductCategory.SERVICE ? '' : ProductCategory.SERVICE)}
        >
          <CardContent className="py-4">
            <h3 className="font-semibold text-gray-900">Services</h3>
            <p className="text-sm text-gray-500">Professional services</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover:border-indigo-300 transition ${categoryFilter === ProductCategory.SUBSCRIPTION ? 'border-indigo-500 ring-2 ring-indigo-200' : ''}`}
          onClick={() => setCategoryFilter(categoryFilter === ProductCategory.SUBSCRIPTION ? '' : ProductCategory.SUBSCRIPTION)}
        >
          <CardContent className="py-4">
            <h3 className="font-semibold text-gray-900">Subscriptions</h3>
            <p className="text-sm text-gray-500">Recurring plans</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by SKU or name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              />
            </div>
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
            {(searchQuery || categoryFilter || activeFilter) && (
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('');
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

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No products found</p>
              {(searchQuery || categoryFilter || activeFilter) && (
                <p className="text-sm mt-2">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sale Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
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
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.sku}</div>
                          {product.variantCount > 0 && (
                            <div className="text-xs text-indigo-600">{product.variantCount} variants</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getCategoryVariant(product.category)}>
                          {product.category}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {formatCurrency(product.costPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {formatCurrency(product.salePrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <span className={product.stockQty <= 10 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                          {product.stockQty}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Badge variant={product.isActive ? 'success' : 'danger'}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(product)}>
                          Edit
                        </Button>
                        {product.isActive && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                            onClick={() => handleDelete(product)}
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
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} products
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
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              onClick={closeModal}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <h2 className="text-xl font-semibold mb-4">
                {modalMode === 'create' ? 'Add New Product' : 'Edit Product'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <Input
                    label="SKU"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    error={formErrors.sku}
                    disabled={modalMode === 'edit'}
                  />

                  <Input
                    label="Name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    error={formErrors.name}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ProductCategory }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value={ProductCategory.HARDWARE}>Hardware</option>
                      <option value={ProductCategory.SERVICE}>Service</option>
                      <option value={ProductCategory.SUBSCRIPTION}>Subscription</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Cost Price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                      error={formErrors.costPrice}
                    />
                    <Input
                      label="Sale Price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.salePrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, salePrice: parseFloat(e.target.value) || 0 }))}
                      error={formErrors.salePrice}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button type="button" variant="secondary" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={saving}>
                    {modalMode === 'create' ? 'Create Product' : 'Save Changes'}
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

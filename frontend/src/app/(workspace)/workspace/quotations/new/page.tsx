"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Customer {
  id: string;
  name: string;
  email: string;
  tier: string;
  companyName: string | null;
  phone: string | null;
  quotationCount: number;
}

export default function NewQuotationPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Selection state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('');
  
  // Form state
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const res = await api.get<any>('/customers');
    if (res.success && res.data) {
      setCustomers(res.data);
    }
    setLoading(false);
  };

  // Filter customers based on search and tier
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = !searchQuery || 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.companyName && c.companyName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTier = !tierFilter || c.tier === tierFilter;
      
      return matchesSearch && matchesTier;
    });
  }, [customers, searchQuery, tierFilter]);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const handleCreateQuotation = async () => {
    if (!selectedCustomerId) {
      alert('Please select a customer');
      return;
    }

    setCreating(true);
    const res = await api.post<any>('/quotation', {
      customerId: selectedCustomerId,
      notes: notes.trim() || undefined,
      validUntil: validUntil || undefined,
    });

    if (res.success && res.data) {
      const quotationId = res.data.data?.id || res.data.id;
      router.push(`/workspace/quotations/${quotationId}`);
    } else {
      alert(res.error?.message || 'Failed to create quotation');
      setCreating(false);
    }
  };

  const getTierBadgeClass = (tier: string) => {
    switch (tier) {
      case 'GOLD': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'SILVER': return 'bg-gray-200 text-gray-800 border-gray-300';
      case 'BRONZE': return 'bg-amber-100 text-amber-800 border-amber-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get default valid until date (30 days from now)
  const getDefaultValidUntil = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Loading Overlay */}
      {creating && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 flex items-center gap-4">
            <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-gray-700 font-medium">Creating quotation...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <Link href="/workspace/quotations" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
          ← Back to Quotations
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Quotation</h1>
        <p className="text-gray-500 mt-1">Select a customer and configure quotation details</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Customer Selection - Left Column */}
        <div className="col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900">Select Customer</h2>
            </div>

            {/* Search and Filter */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search by name, email, or company..."
                    className="w-full border rounded-lg pl-10 pr-4 py-2"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <select
                  className="border rounded-lg px-3 py-2"
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                >
                  <option value="">All Tiers</option>
                  <option value="GOLD">Gold</option>
                  <option value="SILVER">Silver</option>
                  <option value="BRONZE">Bronze</option>
                </select>
              </div>
            </div>

            {/* Customer List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading customers...</p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {searchQuery || tierFilter ? (
                    <p>No customers match your search criteria</p>
                  ) : (
                    <p>No customers found. Create customers in the admin section first.</p>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => setSelectedCustomerId(customer.id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedCustomerId === customer.id
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : 'hover:bg-gray-50 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{customer.name}</span>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getTierBadgeClass(customer.tier)}`}>
                              {customer.tier}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">{customer.email}</p>
                          {customer.companyName && (
                            <p className="text-sm text-gray-400 mt-0.5">{customer.companyName}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400">
                            {customer.quotationCount} quote{customer.quotationCount !== 1 ? 's' : ''}
                          </span>
                          {selectedCustomerId === customer.id && (
                            <div className="mt-1">
                              <svg className="w-5 h-5 text-blue-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Count */}
            <div className="px-4 py-2 border-t bg-gray-50 text-sm text-gray-500">
              Showing {filteredCustomers.length} of {customers.length} customers
            </div>
          </div>
        </div>

        {/* Quotation Details - Right Column */}
        <div className="col-span-1">
          {/* Selected Customer Card */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-4">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900">Selected Customer</h2>
            </div>
            <div className="p-4">
              {selectedCustomer ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-lg text-gray-900">{selectedCustomer.name}</span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getTierBadgeClass(selectedCustomer.tier)}`}>
                      {selectedCustomer.tier}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                  {selectedCustomer.companyName && (
                    <p className="text-sm text-gray-500 mt-1">{selectedCustomer.companyName}</p>
                  )}
                  {selectedCustomer.phone && (
                    <p className="text-sm text-gray-500 mt-1">{selectedCustomer.phone}</p>
                  )}
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-400">
                      Discount ceilings based on {selectedCustomer.tier} tier
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-sm">Select a customer from the list</p>
                </div>
              )}
            </div>
          </div>

          {/* Quotation Options */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-4">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900">Quotation Details</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until
                </label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  placeholder={getDefaultValidUntil()}
                />
                <p className="text-xs text-gray-400 mt-1">Leave empty for default (30 days)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Internal Notes
                </label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 h-24 resize-none"
                  placeholder="Optional notes about this quotation..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreateQuotation}
            disabled={!selectedCustomerId || creating}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
              selectedCustomerId && !creating
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {creating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                Creating...
              </span>
            ) : (
              'Create Quotation'
            )}
          </button>

          {!selectedCustomerId && (
            <p className="text-center text-sm text-gray-400 mt-2">
              Select a customer to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

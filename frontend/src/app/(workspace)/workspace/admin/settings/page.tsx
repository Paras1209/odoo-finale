// ===========================================
// DealFlow360 - Admin Settings Page
// ===========================================
// Screen 18: Discount Tiers and Approval Chain Setup
// ===========================================

'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge } from '@/components/ui';

// Types
interface DiscountTier {
  id: string | null;
  customerTier: 'GOLD' | 'SILVER' | 'BRONZE';
  category: 'HARDWARE' | 'SERVICE' | 'SUBSCRIPTION';
  maxDiscountPct: number;
  isDefault?: boolean;
}

interface ApprovalChain {
  id: string | null;
  minRiskScore: number;
  maxRiskScore: number;
  requiresManager: boolean;
  requiresFinance: boolean;
  isDefault?: boolean;
}

const CUSTOMER_TIERS = ['GOLD', 'SILVER', 'BRONZE'] as const;
const PRODUCT_CATEGORIES = ['HARDWARE', 'SERVICE', 'SUBSCRIPTION'] as const;

const tierColors = {
  GOLD: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  SILVER: 'bg-gray-100 text-gray-800 border-gray-300',
  BRONZE: 'bg-orange-100 text-orange-800 border-orange-300',
};

const categoryLabels = {
  HARDWARE: 'Hardware',
  SERVICE: 'Services',
  SUBSCRIPTION: 'Subscriptions',
};

export default function AdminSettingsPage() {
  // Discount Tiers State
  const [discountTiers, setDiscountTiers] = useState<DiscountTier[]>([]);
  const [discountLoading, setDiscountLoading] = useState(true);
  const [discountSaving, setDiscountSaving] = useState<string | null>(null);

  // Approval Chains State
  const [approvalChains, setApprovalChains] = useState<ApprovalChain[]>([]);
  const [chainsLoading, setChainsLoading] = useState(true);
  const [chainsSaving, setChainsSaving] = useState(false);
  const [isDefaultChains, setIsDefaultChains] = useState(false);

  // Edit states for discount tiers
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  // Messages
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<'discounts' | 'approvals'>('discounts');

  useEffect(() => {
    fetchDiscountTiers();
    fetchApprovalChains();
  }, []);

  // Fetch discount tiers
  const fetchDiscountTiers = async () => {
    setDiscountLoading(true);
    try {
      const res = await fetch('/api/admin/settings/discount-tiers');
      const data = await res.json();
      if (data.success) {
        setDiscountTiers(data.data);
      }
    } catch (err) {
      console.error('Error fetching discount tiers:', err);
    } finally {
      setDiscountLoading(false);
    }
  };

  // Fetch approval chains
  const fetchApprovalChains = async () => {
    setChainsLoading(true);
    try {
      const res = await fetch('/api/admin/settings/approval-chains');
      const data = await res.json();
      if (data.success) {
        setApprovalChains(data.data);
        setIsDefaultChains(data.isDefault ?? false);
      }
    } catch (err) {
      console.error('Error fetching approval chains:', err);
    } finally {
      setChainsLoading(false);
    }
  };

  // Save discount tier
  const saveDiscountTier = async (tier: DiscountTier) => {
    const key = `${tier.customerTier}-${tier.category}`;
    setDiscountSaving(key);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/settings/discount-tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerTier: tier.customerTier,
          category: tier.category,
          maxDiscountPct: editValue,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Discount tier saved successfully' });
        setEditingTier(null);
        fetchDiscountTiers();
      } else {
        setMessage({ type: 'error', text: data.error?.message || 'Failed to save' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setDiscountSaving(null);
    }
  };

  // Save all approval chains
  const saveApprovalChains = async () => {
    setChainsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/settings/approval-chains', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chains: approvalChains }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Approval chains saved successfully' });
        setIsDefaultChains(false);
        fetchApprovalChains();
      } else {
        setMessage({ type: 'error', text: data.error?.message || 'Failed to save' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setChainsSaving(false);
    }
  };

  // Update approval chain in local state
  const updateChain = (index: number, field: keyof ApprovalChain, value: any) => {
    const updated = [...approvalChains];
    updated[index] = { ...updated[index], [field]: value };
    setApprovalChains(updated);
  };

  // Add new approval chain
  const addChain = () => {
    const lastChain = approvalChains[approvalChains.length - 1];
    const newMin = lastChain ? lastChain.maxRiskScore + 1 : 0;
    setApprovalChains([
      ...approvalChains,
      {
        id: null,
        minRiskScore: newMin,
        maxRiskScore: newMin + 10,
        requiresManager: true,
        requiresFinance: false,
      },
    ]);
  };

  // Remove approval chain
  const removeChain = (index: number) => {
    if (approvalChains.length <= 1) return;
    const updated = approvalChains.filter((_, i) => i !== index);
    setApprovalChains(updated);
  };

  // Get discount tier value for display
  const getTierValue = (customerTier: string, category: string): DiscountTier | undefined => {
    return discountTiers.find(
      (t) => t.customerTier === customerTier && t.category === category
    );
  };

  // Start editing a tier
  const startEditTier = (tier: DiscountTier) => {
    setEditingTier(`${tier.customerTier}-${tier.category}`);
    setEditValue(tier.maxDiscountPct);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500 mt-1">Configure discount governance and approval workflows</p>
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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('discounts')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'discounts'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Discount Tiers
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'approvals'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Approval Workflow
          </button>
        </nav>
      </div>

      {/* Discount Tiers Tab */}
      {activeTab === 'discounts' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Discount Ceilings by Customer Tier</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Maximum discount percentage allowed for each customer tier and product category.
                Discounts exceeding these limits trigger approval workflows.
              </p>
            </CardHeader>
            <CardContent>
              {discountLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">
                          Customer Tier
                        </th>
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <th key={cat} className="text-center py-3 px-4 font-semibold text-gray-600">
                            {categoryLabels[cat]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {CUSTOMER_TIERS.map((tier) => (
                        <tr key={tier} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${tierColors[tier]}`}
                            >
                              {tier}
                            </span>
                          </td>
                          {PRODUCT_CATEGORIES.map((cat) => {
                            const tierData = getTierValue(tier, cat);
                            const key = `${tier}-${cat}`;
                            const isEditing = editingTier === key;
                            const isSaving = discountSaving === key;

                            return (
                              <td key={cat} className="py-4 px-4 text-center">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.5"
                                      value={editValue}
                                      onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-indigo-500"
                                      disabled={isSaving}
                                    />
                                    <span className="text-gray-500">%</span>
                                    <button
                                      onClick={() => tierData && saveDiscountTier(tierData)}
                                      disabled={isSaving}
                                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                                    >
                                      {isSaving ? '...' : 'Save'}
                                    </button>
                                    <button
                                      onClick={() => setEditingTier(null)}
                                      disabled={isSaving}
                                      className="text-gray-400 hover:text-gray-600 text-sm"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => tierData && startEditTier(tierData)}
                                    className="group relative px-4 py-2 rounded hover:bg-indigo-50 transition"
                                  >
                                    <span className="text-lg font-semibold text-gray-900">
                                      {tierData?.maxDiscountPct ?? 0}%
                                    </span>
                                    {tierData?.isDefault && (
                                      <span className="ml-2 text-xs text-gray-400">(default)</span>
                                    )}
                                    <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                      <span className="text-xs text-indigo-600 font-medium">Edit</span>
                                    </span>
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">How Discount Governance Works</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Sales reps can apply discounts up to the ceiling without approval</li>
              <li>• Discounts exceeding the ceiling generate a risk score and trigger approval</li>
              <li>• Higher tier customers (GOLD) have higher discount ceilings</li>
              <li>• Risk score = Sum of (discount% - ceiling%) for each line item</li>
            </ul>
          </div>
        </div>
      )}

      {/* Approval Workflow Tab */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Approval Chain Configuration</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Define which approvers are required based on the quotation's blended risk score.
                    {isDefaultChains && (
                      <span className="ml-2 text-amber-600 font-medium">
                        (Using default settings - save to persist)
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={addChain}>
                    + Add Rule
                  </Button>
                  <Button onClick={saveApprovalChains} loading={chainsSaving}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {chainsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvalChains.map((chain, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      {/* Risk Score Range */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Risk Score</span>
                        <input
                          type="number"
                          min="0"
                          value={chain.minRiskScore}
                          onChange={(e) =>
                            updateChain(index, 'minRiskScore', parseFloat(e.target.value) || 0)
                          }
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="number"
                          min="0"
                          value={chain.maxRiskScore}
                          onChange={(e) =>
                            updateChain(index, 'maxRiskScore', parseFloat(e.target.value) || 0)
                          }
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      </div>

                      {/* Arrow */}
                      <div className="text-gray-400">→</div>

                      {/* Approval Requirements */}
                      <div className="flex items-center gap-4 flex-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={chain.requiresManager}
                            onChange={(e) => updateChain(index, 'requiresManager', e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">Manager Approval</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={chain.requiresFinance}
                            onChange={(e) => updateChain(index, 'requiresFinance', e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">Finance Approval</span>
                        </label>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {!chain.requiresManager && !chain.requiresFinance ? (
                          <Badge variant="success">Auto-Approve</Badge>
                        ) : chain.requiresFinance ? (
                          <Badge variant="danger">High Risk</Badge>
                        ) : (
                          <Badge variant="warning">Review Required</Badge>
                        )}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeChain(index)}
                        disabled={approvalChains.length <= 1}
                        className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-800 mb-2">Understanding Risk Scores</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• <strong>Risk Score 0:</strong> No discount violations - auto-approves</li>
              <li>• <strong>Risk Score 1-10:</strong> Minor violations - requires manager review</li>
              <li>• <strong>Risk Score 11+:</strong> Major violations - requires both manager and finance</li>
              <li>• Rules are evaluated in order; first matching rule determines approval path</li>
            </ul>
          </div>

          {/* Approval Flow Diagram */}
          <Card>
            <CardHeader>
              <CardTitle>Approval Flow Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-4 py-6">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-lg bg-indigo-100 border-2 border-indigo-300 flex items-center justify-center mb-2">
                    <span className="text-3xl">📝</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Sales Rep<br />Creates Quote</span>
                </div>
                <div className="text-gray-400 text-2xl">→</div>
                <div className="text-center">
                  <div className="w-24 h-24 rounded-lg bg-yellow-100 border-2 border-yellow-300 flex items-center justify-center mb-2">
                    <span className="text-3xl">⚖️</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Risk Engine<br />Evaluates</span>
                </div>
                <div className="text-gray-400 text-2xl">→</div>
                <div className="text-center">
                  <div className="w-24 h-24 rounded-lg bg-purple-100 border-2 border-purple-300 flex items-center justify-center mb-2">
                    <span className="text-3xl">👔</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Manager<br />Reviews</span>
                </div>
                <div className="text-gray-400 text-2xl">→</div>
                <div className="text-center">
                  <div className="w-24 h-24 rounded-lg bg-green-100 border-2 border-green-300 flex items-center justify-center mb-2">
                    <span className="text-3xl">💰</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Finance<br />(if needed)</span>
                </div>
                <div className="text-gray-400 text-2xl">→</div>
                <div className="text-center">
                  <div className="w-24 h-24 rounded-lg bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mb-2">
                    <span className="text-3xl">✅</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Approved<br />to Customer</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

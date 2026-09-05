// ===========================================
// DealFlow360 - Deal Health Page (Screen 14)
// ===========================================
// DEV B's MODULE: At-risk deals monitoring
// ===========================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AtRiskDeal {
  quotationId: string;
  quotationNumber: string;
  customerName: string;
  repName: string;
  totalAmount: number;
  status: string;
  riskType: 'STALLED' | 'HIGH_DISCOUNT' | 'EXPIRING_SOON' | 'REJECTED';
  riskDetails: string;
  lastActivityAt: string;
  daysSinceActivity: number;
}

interface DeliverySlippage {
  id: string;
  quotationNumber: string;
  customerName: string;
  productName: string;
  warehouseName: string;
  estimatedShipDate: string;
  actualShipDate: string | null;
  slippageDays: number;
  status: string;
}

interface DealHealthData {
  stalledDeals: AtRiskDeal[];
  discountAnomalies: AtRiskDeal[];
  deliverySlippage: DeliverySlippage[];
  expiringQuotations: AtRiskDeal[];
  summary: {
    totalAtRisk: number;
    stalledCount: number;
    highDiscountCount: number;
    slippageCount: number;
    expiringCount: number;
  };
}

type TabType = 'stalled' | 'discounts' | 'slippage' | 'expiring';

export default function DealHealthPage() {
  const [data, setData] = useState<DealHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('stalled');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/deal-health');
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error?.message || 'Failed to load deal health data');
        }
      } catch (err) {
        setError('Failed to load deal health data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'stalled', label: 'Stalled Deals', count: data?.summary.stalledCount || 0 },
    { id: 'discounts', label: 'Discount Anomalies', count: data?.summary.highDiscountCount || 0 },
    { id: 'slippage', label: 'Delivery Slippage', count: data?.summary.slippageCount || 0 },
    { id: 'expiring', label: 'Expiring Soon', count: data?.summary.expiringCount || 0 },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deal Health Monitor</h1>
          <p className="text-gray-500 text-sm mt-1">
            Track at-risk deals and take action before they become problems
          </p>
        </div>
        <Link href="/workspace" className="btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <SummaryCard
          label="Total At Risk"
          value={data?.summary.totalAtRisk || 0}
          color="red"
          large
        />
        <SummaryCard
          label="Stalled"
          value={data?.summary.stalledCount || 0}
          color="yellow"
          icon="pause"
        />
        <SummaryCard
          label="High Discount"
          value={data?.summary.highDiscountCount || 0}
          color="orange"
          icon="percent"
        />
        <SummaryCard
          label="Delivery Slippage"
          value={data?.summary.slippageCount || 0}
          color="purple"
          icon="truck"
        />
        <SummaryCard
          label="Expiring"
          value={data?.summary.expiringCount || 0}
          color="blue"
          icon="clock"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'stalled' && (
          <AtRiskDealsTable
            deals={data?.stalledDeals || []}
            emptyMessage="No stalled deals - all quotations have recent activity"
            showDaysSinceActivity
          />
        )}

        {activeTab === 'discounts' && (
          <AtRiskDealsTable
            deals={data?.discountAnomalies || []}
            emptyMessage="No discount anomalies - all margins are healthy"
            showRiskDetails
          />
        )}

        {activeTab === 'slippage' && (
          <DeliverySlippageTable
            items={data?.deliverySlippage || []}
            emptyMessage="No delivery slippage - all shipments are on schedule"
          />
        )}

        {activeTab === 'expiring' && (
          <AtRiskDealsTable
            deals={data?.expiringQuotations || []}
            emptyMessage="No expiring quotations in the next 7 days"
            showRiskDetails
          />
        )}
      </div>
    </div>
  );
}

// ===========================================
// COMPONENTS
// ===========================================

function SummaryCard({
  label,
  value,
  color,
  icon,
  large,
}: {
  label: string;
  value: number;
  color: 'red' | 'yellow' | 'orange' | 'purple' | 'blue' | 'green';
  icon?: string;
  large?: boolean;
}) {
  const colorClasses = {
    red: 'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
  };

  const iconPaths: Record<string, string> = {
    pause: 'M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z',
    percent: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z',
    truck: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
    clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]} ${large ? 'lg:col-span-1' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`${large ? 'text-4xl' : 'text-2xl'} font-bold`}>{value}</p>
          <p className="text-sm mt-1 opacity-80">{label}</p>
        </div>
        {icon && (
          <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPaths[icon]} />
          </svg>
        )}
      </div>
    </div>
  );
}

function AtRiskDealsTable({
  deals,
  emptyMessage,
  showDaysSinceActivity,
  showRiskDetails,
}: {
  deals: AtRiskDeal[];
  emptyMessage: string;
  showDaysSinceActivity?: boolean;
  showRiskDetails?: boolean;
}) {
  if (deals.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quotation
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rep
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            {showDaysSinceActivity && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Days Inactive
              </th>
            )}
            {showRiskDetails && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk Details
              </th>
            )}
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {deals.map((deal) => (
            <tr key={deal.quotationId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="font-medium text-gray-900">{deal.quotationNumber}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {deal.customerName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {deal.repName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {formatCurrency(deal.totalAmount)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={deal.status} />
              </td>
              {showDaysSinceActivity && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-medium ${
                    deal.daysSinceActivity > 14 ? 'text-red-600' : 
                    deal.daysSinceActivity > 7 ? 'text-yellow-600' : 'text-gray-600'
                  }`}>
                    {deal.daysSinceActivity} days
                  </span>
                </td>
              )}
              {showRiskDetails && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {deal.riskDetails}
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <Link
                  href={`/workspace/quotations/${deal.quotationId}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeliverySlippageTable({
  items,
  emptyMessage,
}: {
  items: DeliverySlippage[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quotation
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Warehouse
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Est. Ship Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actual Ship Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Slippage
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="font-medium text-gray-900">{item.quotationNumber}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {item.customerName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {item.productName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {item.warehouseName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {formatDate(item.estimatedShipDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {item.actualShipDate ? formatDate(item.actualShipDate) : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`text-sm font-medium ${
                  item.slippageDays > 7 ? 'text-red-600' : 
                  item.slippageDays > 3 ? 'text-yellow-600' : 'text-orange-600'
                }`}>
                  +{item.slippageDays} days
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <FulfillmentStatusBadge status={item.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string }> = {
    DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700' },
    PENDING_MANAGER_APPROVAL: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    PENDING_FINANCE_APPROVAL: { bg: 'bg-orange-100', text: 'text-orange-700' },
    APPROVED: { bg: 'bg-green-100', text: 'text-green-700' },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-700' },
    CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-700' },
    FULFILLING: { bg: 'bg-purple-100', text: 'text-purple-700' },
    BILLED: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-500' },
  };

  const config = statusConfig[status] || statusConfig.DRAFT;
  const displayStatus = status.replace(/_/g, ' ');

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
      {displayStatus}
    </span>
  );
}

function FulfillmentStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-700' },
    SHIPPED: { bg: 'bg-purple-100', text: 'text-purple-700' },
    DELIVERED: { bg: 'bg-green-100', text: 'text-green-700' },
    CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-500' },
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
      {status}
    </span>
  );
}

// ===========================================
// HELPERS
// ===========================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

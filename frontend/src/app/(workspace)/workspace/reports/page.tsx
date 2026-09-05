// ===========================================
// DealFlow360 - Reports Page (Screen 15)
// ===========================================
// DEV B's MODULE: Sales reports with filters and export
// ===========================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SalesReport {
  period: string;
  quotationsCreated: number;
  quotationsConfirmed: number;
  totalRevenue: number;
  averageDealSize: number;
  conversionRate: number;
  topProducts: { productId: string; productName: string; quantity: number; revenue: number }[];
  topCustomers: { customerId: string; customerName: string; totalAmount: number; dealCount: number }[];
  topReps: { repId: string; repName: string; totalAmount: number; dealCount: number }[];
}

interface RevenueTrend {
  month: string;
  revenue: number;
}

export default function ReportsPage() {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'customers' | 'reps'>('overview');

  async function loadReport() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const [reportRes, trendRes] = await Promise.all([
        fetch(`/api/dashboard/reports?${params.toString()}`),
        fetch('/api/dashboard?view=revenue-trend&months=6'),
      ]);

      const reportData = await reportRes.json();
      const trendData = await trendRes.json();

      if (reportData.success) {
        setReport(reportData.data);
      } else {
        setError(reportData.error?.message || 'Failed to load report');
      }

      if (trendData.success) {
        setRevenueTrend(trendData.data);
      }
    } catch (err) {
      setError('Failed to load report data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, []);

  function handleApplyFilters() {
    loadReport();
  }

  function handleClearFilters() {
    setStartDate('');
    setEndDate('');
    setTimeout(loadReport, 0);
  }

  function handleExportCSV() {
    if (!report) return;

    let csvContent = '';

    // Overview section
    csvContent += 'Sales Report Overview\n';
    csvContent += `Period,${report.period}\n`;
    csvContent += `Quotations Created,${report.quotationsCreated}\n`;
    csvContent += `Quotations Confirmed,${report.quotationsConfirmed}\n`;
    csvContent += `Total Revenue,${report.totalRevenue}\n`;
    csvContent += `Average Deal Size,${report.averageDealSize}\n`;
    csvContent += `Conversion Rate,${report.conversionRate}%\n\n`;

    // Top Products
    csvContent += 'Top Products\n';
    csvContent += 'Product Name,Quantity,Revenue\n';
    report.topProducts.forEach((p) => {
      csvContent += `"${p.productName}",${p.quantity},${p.revenue}\n`;
    });
    csvContent += '\n';

    // Top Customers
    csvContent += 'Top Customers\n';
    csvContent += 'Customer Name,Deal Count,Total Amount\n';
    report.topCustomers.forEach((c) => {
      csvContent += `"${c.customerName}",${c.dealCount},${c.totalAmount}\n`;
    });
    csvContent += '\n';

    // Top Reps
    csvContent += 'Top Sales Reps\n';
    csvContent += 'Rep Name,Deal Count,Total Amount\n';
    report.topReps.forEach((r) => {
      csvContent += `"${r.repName}",${r.dealCount},${r.totalAmount}\n`;
    });

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  if (loading && !report) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
          <p className="text-gray-500 text-sm mt-1">
            Analyze sales performance and export data
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportCSV} className="btn-secondary" disabled={!report}>
            Export CSV
          </button>
          <Link href="/workspace" className="btn-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleApplyFilters} className="btn-primary" disabled={loading}>
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>
            <button onClick={handleClearFilters} className="btn-secondary">
              Clear
            </button>
          </div>
          {report && (
            <div className="ml-auto text-sm text-gray-500">
              Showing: {report.period}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          {error}
        </div>
      )}

      {report && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <KPICard
              label="Quotations Created"
              value={report.quotationsCreated.toString()}
              icon="document"
            />
            <KPICard
              label="Quotations Confirmed"
              value={report.quotationsConfirmed.toString()}
              icon="check"
            />
            <KPICard
              label="Total Revenue"
              value={formatCurrency(report.totalRevenue)}
              icon="currency"
              highlight
            />
            <KPICard
              label="Avg Deal Size"
              value={formatCurrency(report.averageDealSize)}
              icon="chart"
            />
            <KPICard
              label="Conversion Rate"
              value={`${report.conversionRate}%`}
              icon="trending"
            />
          </div>

          {/* Revenue Trend Chart */}
          {revenueTrend.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (6 Months)</h2>
              <div className="h-48">
                <SimpleBarChart data={revenueTrend} />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'products', label: 'Top Products' },
                { id: 'customers', label: 'Top Customers' },
                { id: 'reps', label: 'Top Reps' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow">
            {activeTab === 'overview' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Summary</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <dt className="text-sm text-gray-500">Period</dt>
                    <dd className="text-lg font-medium text-gray-900">{report.period}</dd>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <dt className="text-sm text-gray-500">Total Revenue</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(report.totalRevenue)}</dd>
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <dt className="text-sm text-gray-500">Quotations Created</dt>
                    <dd className="text-lg font-medium text-gray-900">{report.quotationsCreated}</dd>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4">
                    <dt className="text-sm text-gray-500">Quotations Confirmed</dt>
                    <dd className="text-lg font-medium text-gray-900">{report.quotationsConfirmed}</dd>
                  </div>
                  <div className="border-l-4 border-indigo-500 pl-4">
                    <dt className="text-sm text-gray-500">Average Deal Size</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(report.averageDealSize)}</dd>
                  </div>
                  <div className="border-l-4 border-pink-500 pl-4">
                    <dt className="text-sm text-gray-500">Conversion Rate</dt>
                    <dd className="text-lg font-medium text-gray-900">{report.conversionRate}%</dd>
                  </div>
                </dl>
              </div>
            )}

            {activeTab === 'products' && (
              <TopProductsTable products={report.topProducts} />
            )}

            {activeTab === 'customers' && (
              <TopCustomersTable customers={report.topCustomers} />
            )}

            {activeTab === 'reps' && (
              <TopRepsTable reps={report.topReps} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ===========================================
// COMPONENTS
// ===========================================

function KPICard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}) {
  const iconPaths: Record<string, string> = {
    document: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    currency: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    trending: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  };

  return (
    <div className={`rounded-lg shadow p-4 ${highlight ? 'bg-blue-600 text-white' : 'bg-white'}`}>
      <div className="flex items-center justify-between">
        <svg
          className={`w-6 h-6 ${highlight ? 'text-blue-200' : 'text-gray-400'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPaths[icon]} />
        </svg>
      </div>
      <p className={`text-2xl font-bold mt-2 ${highlight ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      <p className={`text-sm mt-1 ${highlight ? 'text-blue-100' : 'text-gray-500'}`}>{label}</p>
    </div>
  );
}

function SimpleBarChart({ data }: { data: RevenueTrend[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="flex items-end justify-between h-full gap-2">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div className="w-full flex flex-col items-center flex-1 justify-end">
            <div
              className="w-full bg-blue-500 rounded-t transition-all duration-300 min-h-[4px]"
              style={{ height: `${(item.revenue / maxRevenue) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">{item.month}</p>
          <p className="text-xs font-medium text-gray-700">{formatCompactCurrency(item.revenue)}</p>
        </div>
      ))}
    </div>
  );
}

function TopProductsTable({ products }: { products: SalesReport['topProducts'] }) {
  if (products.length === 0) {
    return <EmptyState message="No product data available for this period" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quantity Sold
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Revenue
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product, index) => (
            <tr key={product.productId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <RankBadge rank={index + 1} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                {product.productName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">
                {product.quantity.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                {formatCurrency(product.revenue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopCustomersTable({ customers }: { customers: SalesReport['topCustomers'] }) {
  if (customers.length === 0) {
    return <EmptyState message="No customer data available for this period" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Deals
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Amount
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {customers.map((customer, index) => (
            <tr key={customer.customerId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <RankBadge rank={index + 1} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                {customer.customerName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">
                {customer.dealCount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                {formatCurrency(customer.totalAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopRepsTable({ reps }: { reps: SalesReport['topReps'] }) {
  if (reps.length === 0) {
    return <EmptyState message="No sales rep data available for this period" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sales Rep
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Deals Closed
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Revenue
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reps.map((rep, index) => (
            <tr key={rep.repId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <RankBadge rank={index + 1} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                {rep.repName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">
                {rep.dealCount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                {formatCurrency(rep.totalAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const colors = {
    1: 'bg-yellow-100 text-yellow-800',
    2: 'bg-gray-100 text-gray-800',
    3: 'bg-orange-100 text-orange-800',
  };

  const color = colors[rank as keyof typeof colors] || 'bg-gray-50 text-gray-600';

  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${color}`}>
      {rank}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-8 text-center">
      <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p className="text-gray-500">{message}</p>
    </div>
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

function formatCompactCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
}

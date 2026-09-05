// ===========================================
// DealFlow360 - Sales Dashboard (Screen 2)
// ===========================================
// DEV B's MODULE: Dashboard home with widgets and activity
// ===========================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardSummary {
  quotations: {
    total: number;
    draft: number;
    pendingApproval: number;
    approved: number;
    confirmed: number;
  };
  approvals: {
    pending: number;
    approvedToday: number;
    rejectedToday: number;
  };
  fulfillment: {
    pending: number;
    processing: number;
    shipped: number;
    backorders: number;
  };
  invoices: {
    unpaid: number;
    overdue: number;
    totalOutstanding: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
}

interface RecentActivity {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorName: string;
  actorType: string;
  description: string;
  createdAt: string;
}

interface StatusBreakdown {
  status: string;
  count: number;
}

export default function WorkspaceDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [summaryRes, activityRes, breakdownRes] = await Promise.all([
          fetch('/api/dashboard?view=summary'),
          fetch('/api/dashboard?view=activity&limit=10'),
          fetch('/api/dashboard?view=quotation-breakdown'),
        ]);

        const summaryData = await summaryRes.json();
        const activityData = await activityRes.json();
        const breakdownData = await breakdownRes.json();

        if (summaryData.success) setSummary(summaryData.data);
        if (activityData.success) setActivity(activityData.data);
        if (breakdownData.success) setStatusBreakdown(breakdownData.data);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/workspace/deal-health" className="btn-secondary">
            Deal Health
          </Link>
          <Link href="/workspace/reports" className="btn-secondary">
            Reports
          </Link>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Quotations"
          value={summary?.quotations.total.toString() || '0'}
          subtitle={`${summary?.quotations.draft || 0} drafts`}
          icon="document"
          color="blue"
        />
        <StatCard
          title="Pending Approvals"
          value={summary?.approvals.pending.toString() || '0'}
          subtitle={`${summary?.approvals.approvedToday || 0} approved today`}
          icon="clock"
          color="yellow"
        />
        <StatCard
          title="This Month Revenue"
          value={formatCurrency(summary?.revenue.thisMonth || 0)}
          subtitle={`${(summary?.revenue.growth ?? 0) >= 0 ? '+' : ''}${summary?.revenue.growth ?? 0}% vs last month`}
          icon="currency"
          color={(summary?.revenue.growth ?? 0) >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Outstanding Invoices"
          value={formatCurrency(summary?.invoices.totalOutstanding || 0)}
          subtitle={`${summary?.invoices.overdue || 0} overdue`}
          icon="invoice"
          color={summary?.invoices.overdue ? 'red' : 'gray'}
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <MiniStatCard label="Draft" value={summary?.quotations.draft || 0} color="gray" />
        <MiniStatCard label="Pending Approval" value={summary?.quotations.pendingApproval || 0} color="yellow" />
        <MiniStatCard label="Approved" value={summary?.quotations.approved || 0} color="green" />
        <MiniStatCard label="Confirmed" value={summary?.quotations.confirmed || 0} color="blue" />
        <MiniStatCard label="Fulfilling" value={summary?.fulfillment.processing || 0} color="purple" />
        <MiniStatCard label="Backorders" value={summary?.fulfillment.backorders || 0} color="red" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quotation Pipeline */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quotation Pipeline</h2>
          {statusBreakdown.length > 0 ? (
            <div className="space-y-3">
              {statusBreakdown.map((item) => (
                <PipelineBar
                  key={item.status}
                  label={formatStatus(item.status)}
                  value={item.count}
                  total={summary?.quotations.total || 1}
                  color={getStatusColor(item.status)}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No quotations yet</p>
          )}
        </div>

        {/* Fulfillment Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fulfillment Status</h2>
          <div className="space-y-4">
            <FulfillmentItem
              label="Pending"
              value={summary?.fulfillment.pending || 0}
              color="yellow"
            />
            <FulfillmentItem
              label="Processing"
              value={summary?.fulfillment.processing || 0}
              color="blue"
            />
            <FulfillmentItem
              label="Shipped"
              value={summary?.fulfillment.shipped || 0}
              color="purple"
            />
            <FulfillmentItem
              label="Backorders"
              value={summary?.fulfillment.backorders || 0}
              color="red"
            />
          </div>
          <Link
            href="/workspace/fulfillment"
            className="block mt-4 text-sm text-blue-600 hover:text-blue-800"
          >
            View all fulfillments
          </Link>
        </div>
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/workspace/quotations" className="block w-full btn-primary text-center">
              View Quotations
            </Link>
            <Link href="/workspace/approvals" className="block w-full btn-secondary text-center">
              Review Approvals ({summary?.approvals.pending || 0})
            </Link>
            <Link href="/workspace/catalog" className="block w-full btn-secondary text-center">
              Manage Catalog
            </Link>
            <Link href="/workspace/deal-health" className="block w-full btn-secondary text-center">
              Check Deal Health
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {activity.length > 0 ? (
            <div className="space-y-3">
              {activity.map((item) => (
                <ActivityItem key={item.id} activity={item} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================
// HELPER COMPONENTS
// ===========================================

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    gray: 'bg-gray-50 text-gray-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  const iconMap: Record<string, string> = {
    document: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    currency: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    invoice: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconMap[icon] || iconMap.document} />
          </svg>
        </div>
      </div>
    </div>
  );
}

function MiniStatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple';
}) {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    yellow: 'border-yellow-200 bg-yellow-50',
    red: 'border-red-200 bg-red-50',
    gray: 'border-gray-200 bg-gray-50',
    purple: 'border-purple-200 bg-purple-50',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-600 mt-1">{label}</p>
    </div>
  );
}

function PipelineBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function FulfillmentItem({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const dotColors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${dotColors[color]}`} />
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function ActivityItem({ activity }: { activity: RecentActivity }) {
  const timeAgo = getTimeAgo(activity.createdAt);

  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
        {activity.actorName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">
          <span className="font-medium">{activity.actorName}</span>{' '}
          {activity.description}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{timeAgo}</p>
      </div>
    </div>
  );
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-400',
    PENDING_MANAGER_APPROVAL: 'bg-yellow-400',
    PENDING_FINANCE_APPROVAL: 'bg-orange-400',
    APPROVED: 'bg-green-400',
    REJECTED: 'bg-red-400',
    CONFIRMED: 'bg-blue-400',
    FULFILLING: 'bg-purple-400',
    BILLED: 'bg-indigo-400',
    CANCELLED: 'bg-gray-300',
  };
  return colors[status] || 'bg-gray-400';
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

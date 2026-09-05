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
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        <p className="font-medium">Error loading dashboard</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your sales operations</p>
        </div>
        <div className="flex gap-2">
          <Link href="/workspace/deal-health" className="btn-secondary btn-sm">
            <ActivityIcon />
            Deal Health
          </Link>
          <Link href="/workspace/reports" className="btn-secondary btn-sm">
            <ChartIcon />
            Reports
          </Link>
        </div>
      </div>

      {/* Counter Offer Alert */}
      {activity.filter(a => a.action === 'COUNTER_DISCOUNT').length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <AlertIcon />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900">Counter Offers Pending</h3>
              <p className="text-sm text-amber-700 mt-1">
                {activity.filter(a => a.action === 'COUNTER_DISCOUNT').length} customer(s) have submitted counter offers on your quotations.
              </p>
            </div>
            <Link href="/workspace/quotations" className="btn-sm bg-amber-600 text-white hover:bg-amber-700">
              Review
            </Link>
          </div>
        </div>
      )}

      {/* Primary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Quotations"
          value={summary?.quotations.total || 0}
          subtext={`${summary?.quotations.draft || 0} drafts`}
          icon={<DocumentIcon />}
          href="/workspace/quotations"
        />
        <StatCard
          label="Pending Approvals"
          value={summary?.approvals.pending || 0}
          subtext={`${summary?.approvals.approvedToday || 0} approved today`}
          icon={<ClockIcon />}
          variant={summary?.approvals.pending ? 'warning' : 'default'}
          href="/workspace/approvals"
        />
        <StatCard
          label="Revenue This Month"
          value={formatCurrency(summary?.revenue.thisMonth || 0)}
          subtext={`${(summary?.revenue.growth ?? 0) >= 0 ? '+' : ''}${summary?.revenue.growth ?? 0}% vs last month`}
          icon={<CurrencyIcon />}
          variant={(summary?.revenue.growth ?? 0) >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(summary?.invoices.totalOutstanding || 0)}
          subtext={`${summary?.invoices.overdue || 0} overdue`}
          icon={<InvoiceIcon />}
          variant={summary?.invoices.overdue ? 'danger' : 'default'}
          href="/workspace/invoices"
        />
      </div>

      {/* Status Pills */}
      <div className="flex flex-wrap gap-2">
        <StatusPill label="Draft" value={summary?.quotations.draft || 0} variant="default" />
        <StatusPill label="Pending Approval" value={summary?.quotations.pendingApproval || 0} variant="warning" />
        <StatusPill label="Approved" value={summary?.quotations.approved || 0} variant="success" />
        <StatusPill label="Confirmed" value={summary?.quotations.confirmed || 0} variant="info" />
        <StatusPill label="Fulfilling" value={summary?.fulfillment.processing || 0} variant="purple" />
        <StatusPill label="Backorders" value={summary?.fulfillment.backorders || 0} variant="danger" />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pipeline */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Quotation Pipeline</h2>
            <Link href="/workspace/quotations" className="text-sm text-slate-500 hover:text-slate-700">
              View all
            </Link>
          </div>
          {statusBreakdown.length > 0 ? (
            <div className="space-y-4">
              {statusBreakdown.map((item) => (
                <PipelineItem
                  key={item.status}
                  label={formatStatus(item.status)}
                  value={item.count}
                  total={summary?.quotations.total || 1}
                  color={getStatusColor(item.status)}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No quotations yet" />
          )}
        </div>

        {/* Fulfillment */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Fulfillment</h2>
            <Link href="/workspace/fulfillment" className="text-sm text-slate-500 hover:text-slate-700">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            <FulfillmentRow label="Pending" value={summary?.fulfillment.pending || 0} color="amber" />
            <FulfillmentRow label="Processing" value={summary?.fulfillment.processing || 0} color="blue" />
            <FulfillmentRow label="Shipped" value={summary?.fulfillment.shipped || 0} color="purple" />
            <FulfillmentRow label="Backorders" value={summary?.fulfillment.backorders || 0} color="red" />
          </div>
        </div>
      </div>

      {/* Quick Actions + Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link 
              href="/workspace/quotations/new" 
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              <PlusIcon />
              <span className="font-medium">New Quotation</span>
            </Link>
            <QuickActionLink href="/workspace/quotations" icon={<DocumentIcon />} label="View Quotations" />
            <QuickActionLink href="/workspace/approvals" icon={<ClockIcon />} label={`Review Approvals (${summary?.approvals.pending || 0})`} />
            <QuickActionLink href="/workspace/catalog" icon={<PackageIcon />} label="Manage Catalog" />
            <QuickActionLink href="/workspace/deal-health" icon={<ActivityIcon />} label="Check Deal Health" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
          {activity.length > 0 ? (
            <div className="space-y-1">
              {activity.map((item) => (
                <ActivityRow key={item.id} activity={item} />
              ))}
            </div>
          ) : (
            <EmptyState message="No recent activity" />
          )}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  subtext,
  icon,
  variant = 'default',
  href,
}: {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  href?: string;
}) {
  const subtextColors = {
    default: 'text-slate-500',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
  };

  const iconBgColors = {
    default: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-red-600',
  };

  const content = (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 sm:p-5 ${href ? 'hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500 truncate">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 truncate">{value}</p>
          <p className={`text-sm mt-1 truncate ${subtextColors[variant]}`}>{subtext}</p>
        </div>
        <div className={`p-2.5 rounded-lg ${iconBgColors[variant]} flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

// Status Pill Component
function StatusPill({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
}) {
  const colors = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${colors[variant]}`}>
      <span className="font-bold">{value}</span>
      <span>{label}</span>
    </div>
  );
}

// Pipeline Item Component
function PipelineItem({
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
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900">{value}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Fulfillment Row Component
function FulfillmentRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'amber' | 'blue' | 'purple' | 'red';
}) {
  const dotColors = {
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${dotColors[color]}`} />
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

// Quick Action Link Component
function QuickActionLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link 
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
    >
      <span className="text-slate-400">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

// Activity Row Component
function ActivityRow({ activity }: { activity: RecentActivity }) {
  const timeAgo = getTimeAgo(activity.createdAt);
  const isCounterOffer = activity.action === 'COUNTER_DISCOUNT';
  const isCustomerAction = activity.actorType === 'CUSTOMER';

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${isCounterOffer ? 'bg-amber-50' : 'hover:bg-slate-50'}`}>
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0
        ${isCounterOffer 
          ? 'bg-amber-200 text-amber-800' 
          : isCustomerAction 
            ? 'bg-blue-100 text-blue-600' 
            : 'bg-slate-100 text-slate-600'
        }
      `}>
        {isCounterOffer ? '!' : activity.actorName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900">
          <span className="font-medium">{activity.actorName}</span>{' '}
          <span className="text-slate-600">{activity.description}</span>
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-400">{timeAgo}</span>
          {isCounterOffer && activity.entityId && (
            <Link 
              href={`/workspace/quotations/${activity.entityId}`}
              className="text-xs text-amber-600 hover:text-amber-700 font-medium"
            >
              View Quotation →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

// Dashboard Skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div>
          <div className="h-8 w-32 bg-slate-200 rounded" />
          <div className="h-4 w-48 bg-slate-100 rounded mt-2" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="h-4 w-24 bg-slate-100 rounded mb-3" />
            <div className="h-8 w-20 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="h-6 w-40 bg-slate-200 rounded mb-5" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <div className="h-4 w-full bg-slate-100 rounded mb-2" />
                <div className="h-2 w-full bg-slate-50 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="h-6 w-32 bg-slate-200 rounded mb-5" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-slate-50 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
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
    DRAFT: 'bg-slate-400',
    PENDING_MANAGER_APPROVAL: 'bg-amber-400',
    PENDING_FINANCE_APPROVAL: 'bg-orange-400',
    APPROVED: 'bg-blue-400',
    REJECTED: 'bg-red-400',
    CONFIRMED: 'bg-emerald-400',
    FULFILLING: 'bg-purple-400',
    BILLED: 'bg-indigo-400',
    CANCELLED: 'bg-slate-300',
  };
  return colors[status] || 'bg-slate-400';
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

// Icons
function DocumentIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CurrencyIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function InvoiceIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4l3-9 4 18 3-9h4" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13v6a1 1 0 001 1h3a1 1 0 001-1v-6a1 1 0 00-1-1H4a1 1 0 00-1 1zm7-7v13a1 1 0 001 1h3a1 1 0 001-1V6a1 1 0 00-1-1h-3a1 1 0 00-1 1zm7 4v9a1 1 0 001 1h3a1 1 0 001-1v-9a1 1 0 00-1-1h-3a1 1 0 00-1 1z" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

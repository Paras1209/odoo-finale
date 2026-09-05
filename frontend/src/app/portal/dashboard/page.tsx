'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface DashboardStats {
  quotations: {
    total: number;
    awaitingReview: number;
    pendingApproval: number;
    confirmed: number;
  };
  orders: {
    total: number;
    inProgress: number;
    shippingToday: number;
    delivered: number;
  };
  invoices: {
    outstandingBalance: number;
    overdueCount: number;
    pendingCount: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'QUOTATION' | 'ORDER' | 'INVOICE' | 'COMMENT';
    action: string;
    description: string;
    timestamp: string;
    relatedId: string;
    relatedNumber: string;
  }>;
}

export default function PortalDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    
    const res = await api.get<DashboardStats>('/portal/dashboard');
    
    if (res.success && res.data) {
      setStats(res.data);
    } else {
      setError(res.error?.message || 'Failed to load dashboard');
    }
    
    setLoading(false);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
          <AlertIcon className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-red-700 font-medium mb-4">{error}</p>
        <button onClick={fetchDashboard} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your account</p>
        </div>
        <button 
          onClick={fetchDashboard}
          className="btn-ghost btn-sm text-slate-500"
        >
          <RefreshIcon />
          Refresh
        </button>
      </div>

      {/* Action Alert */}
      {stats.quotations.awaitingReview > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                <BellIcon />
              </div>
              <div>
                <p className="font-medium text-emerald-900">
                  {stats.quotations.awaitingReview} quotation{stats.quotations.awaitingReview !== 1 ? 's' : ''} ready for review
                </p>
                <p className="text-sm text-emerald-700">Review and accept or negotiate the terms</p>
              </div>
            </div>
            <Link href="/portal/quotations" className="btn-sm bg-emerald-600 text-white hover:bg-emerald-700 flex-shrink-0">
              Review Now
            </Link>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* Quotations */}
        <Link href="/portal/quotations" className="group">
          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Quotations</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.quotations.total}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                <DocumentIcon />
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {stats.quotations.awaitingReview > 0 && (
                <p className="text-sm text-emerald-600 font-medium">
                  {stats.quotations.awaitingReview} awaiting your review
                </p>
              )}
              {stats.quotations.pendingApproval > 0 && (
                <p className="text-sm text-slate-500">
                  {stats.quotations.pendingApproval} in progress
                </p>
              )}
              {stats.quotations.total === 0 && (
                <p className="text-sm text-slate-400">No quotations yet</p>
              )}
            </div>
          </div>
        </Link>

        {/* Orders */}
        <Link href="/portal/orders" className="group">
          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Orders</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.orders.total}</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                <PackageIcon />
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {stats.orders.inProgress > 0 && (
                <p className="text-sm text-emerald-600 font-medium">
                  {stats.orders.inProgress} in progress
                </p>
              )}
              {stats.orders.shippingToday > 0 && (
                <p className="text-sm text-amber-600">
                  {stats.orders.shippingToday} shipping today
                </p>
              )}
              {stats.orders.total === 0 && (
                <p className="text-sm text-slate-400">No orders yet</p>
              )}
            </div>
          </div>
        </Link>

        {/* Outstanding Balance */}
        <Link href="/portal/invoices" className="group">
          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Outstanding</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {formatCurrency(stats.invoices.outstandingBalance)}
                </p>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600 group-hover:bg-amber-100 transition-colors">
                <CurrencyIcon />
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {stats.invoices.overdueCount > 0 && (
                <p className="text-sm text-red-600 font-medium">
                  {stats.invoices.overdueCount} overdue
                </p>
              )}
              {stats.invoices.pendingCount > 0 && (
                <p className="text-sm text-slate-500">
                  {stats.invoices.pendingCount} invoice{stats.invoices.pendingCount !== 1 ? 's' : ''} pending
                </p>
              )}
              {stats.invoices.outstandingBalance === 0 && stats.invoices.pendingCount === 0 && (
                <p className="text-sm text-emerald-600">All paid up!</p>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
        </div>
        
        {stats.recentActivity.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
              <ClipboardIcon className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500">No recent activity</p>
            <p className="text-sm text-slate-400 mt-1">Your quotations, orders, and invoices will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.recentActivity.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link 
          href="/portal/quotations"
          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all"
        >
          <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
            <DocumentIcon />
          </div>
          <div>
            <p className="font-medium text-slate-900">View All Quotations</p>
            <p className="text-sm text-slate-500">Review and manage your quotes</p>
          </div>
          <ChevronRightIcon className="ml-auto text-slate-400" />
        </Link>
        
        <Link 
          href="/portal/account"
          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all"
        >
          <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
            <UserIcon />
          </div>
          <div>
            <p className="font-medium text-slate-900">Account Settings</p>
            <p className="text-sm text-slate-500">Manage your profile and preferences</p>
          </div>
          <ChevronRightIcon className="ml-auto text-slate-400" />
        </Link>
      </div>
    </div>
  );
}

// Activity Item Component
function ActivityItem({ activity }: { activity: DashboardStats['recentActivity'][0] }) {
  const typeConfig = {
    QUOTATION: { icon: <DocumentIcon />, color: 'bg-blue-50 text-blue-600', href: `/portal/quotations/${activity.relatedId}` },
    ORDER: { icon: <PackageIcon />, color: 'bg-emerald-50 text-emerald-600', href: '/portal/orders' },
    INVOICE: { icon: <ReceiptIcon />, color: 'bg-amber-50 text-amber-600', href: '/portal/invoices' },
    COMMENT: { icon: <ChatIcon />, color: 'bg-purple-50 text-purple-600', href: `/portal/quotations/${activity.relatedId}` },
  };

  const config = typeConfig[activity.type] || typeConfig.QUOTATION;

  const actionColors: Record<string, string> = {
    'Ready for Review': 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
    'Confirmed': 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
    'In Progress': 'bg-slate-100 text-slate-700',
    'Under Review': 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
    'Payment Due': 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20',
    'Paid': 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
    'Overdue': 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
    'Updated': 'bg-slate-100 text-slate-700',
  };

  return (
    <Link
      href={config.href}
      className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
    >
      <div className={`p-2 rounded-lg ${config.color}`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${actionColors[activity.action] || 'bg-slate-100 text-slate-700'}`}>
            {activity.action}
          </span>
          <span className="text-sm text-slate-500">{activity.relatedNumber}</span>
        </div>
        <p className="text-sm text-slate-700 mt-1 truncate">{activity.description}</p>
      </div>
      <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
        {formatTimeAgo(activity.timestamp)}
      </span>
    </Link>
  );
}

// Dashboard Skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div>
          <div className="h-8 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-64 bg-slate-100 rounded mt-2" />
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex justify-between">
              <div>
                <div className="h-4 w-24 bg-slate-100 rounded" />
                <div className="h-10 w-20 bg-slate-200 rounded mt-2" />
              </div>
              <div className="h-10 w-10 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-4 w-32 bg-slate-100 rounded mt-4" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="h-6 w-40 bg-slate-200 rounded mb-4" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-slate-100 rounded mb-3" />
        ))}
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

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

// Icons
function AlertIcon({ className = '' }: { className?: string }) {
  return <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;
}

function RefreshIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
}

function BellIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;
}

function DocumentIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
}

function PackageIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
}

function CurrencyIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}

function ReceiptIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>;
}

function ChatIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>;
}

function ClipboardIcon({ className = '' }: { className?: string }) {
  return <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
}

function UserIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
}

function ChevronRightIcon({ className = '' }: { className?: string }) {
  return <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
}

// ===========================================
// DealFlow360 - Customer Portal Dashboard
// ===========================================
// Full dashboard with real statistics and activity
// ===========================================

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

const activityIcons: Record<string, string> = {
  QUOTATION: '📝',
  ORDER: '📦',
  INVOICE: '💰',
  COMMENT: '💬',
};

const actionColors: Record<string, string> = {
  'Ready for Review': 'text-blue-600 bg-blue-50',
  'Confirmed': 'text-green-600 bg-green-50',
  'In Progress': 'text-gray-600 bg-gray-50',
  'Under Review': 'text-yellow-600 bg-yellow-50',
  'Payment Due': 'text-orange-600 bg-orange-50',
  'Paid': 'text-green-600 bg-green-50',
  'Overdue': 'text-red-600 bg-red-50',
  'Updated': 'text-gray-600 bg-gray-50',
};

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
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded mb-3"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={fetchDashboard}
          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
        <button 
          onClick={fetchDashboard}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <span>↻</span> Refresh
        </button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Quotations Card */}
        <Link href="/portal/quotations" className="block">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Quotations</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.quotations.total}</p>
              </div>
              <span className="text-2xl">📝</span>
            </div>
            <div className="mt-3 space-y-1">
              {stats.quotations.awaitingReview > 0 && (
                <p className="text-sm text-blue-600 font-medium">
                  {stats.quotations.awaitingReview} awaiting your review
                </p>
              )}
              {stats.quotations.pendingApproval > 0 && (
                <p className="text-sm text-gray-500">
                  {stats.quotations.pendingApproval} in progress
                </p>
              )}
              {stats.quotations.total === 0 && (
                <p className="text-sm text-gray-400">No quotations yet</p>
              )}
            </div>
          </div>
        </Link>

        {/* Orders Card */}
        <Link href="/portal/orders" className="block">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border-l-4 border-emerald-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.orders.total}</p>
              </div>
              <span className="text-2xl">📦</span>
            </div>
            <div className="mt-3 space-y-1">
              {stats.orders.inProgress > 0 && (
                <p className="text-sm text-emerald-600 font-medium">
                  {stats.orders.inProgress} in progress
                </p>
              )}
              {stats.orders.shippingToday > 0 && (
                <p className="text-sm text-orange-600">
                  {stats.orders.shippingToday} shipping today
                </p>
              )}
              {stats.orders.total === 0 && (
                <p className="text-sm text-gray-400">No orders yet</p>
              )}
            </div>
          </div>
        </Link>

        {/* Invoices Card */}
        <Link href="/portal/invoices" className="block">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border-l-4 border-yellow-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding Balance</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${stats.invoices.outstandingBalance.toLocaleString()}
                </p>
              </div>
              <span className="text-2xl">💰</span>
            </div>
            <div className="mt-3 space-y-1">
              {stats.invoices.overdueCount > 0 && (
                <p className="text-sm text-red-600 font-medium">
                  {stats.invoices.overdueCount} overdue
                </p>
              )}
              {stats.invoices.pendingCount > 0 && (
                <p className="text-sm text-gray-500">
                  {stats.invoices.pendingCount} invoice{stats.invoices.pendingCount !== 1 ? 's' : ''} pending
                </p>
              )}
              {stats.invoices.outstandingBalance === 0 && stats.invoices.pendingCount === 0 && (
                <p className="text-sm text-green-600">All paid up!</p>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      {stats.quotations.awaitingReview > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔔</span>
              <div>
                <p className="font-medium text-blue-900">
                  You have {stats.quotations.awaitingReview} quotation{stats.quotations.awaitingReview !== 1 ? 's' : ''} ready for review
                </p>
                <p className="text-sm text-blue-700">Review and accept or negotiate the terms</p>
              </div>
            </div>
            <Link 
              href="/portal/quotations"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              Review Now
            </Link>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        
        {stats.recentActivity.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <span className="text-4xl mb-4 block">📋</span>
            <p className="text-gray-500">No recent activity</p>
            <p className="text-sm text-gray-400 mt-1">Your quotations, orders, and invoices will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.recentActivity.map((activity) => (
              <Link
                key={activity.id}
                href={
                  activity.type === 'QUOTATION' 
                    ? `/portal/quotations/${activity.relatedId}`
                    : activity.type === 'INVOICE'
                    ? `/portal/invoices`
                    : `/portal/orders`
                }
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <span className="text-xl">{activityIcons[activity.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${actionColors[activity.action] || 'text-gray-600 bg-gray-50'}`}>
                      {activity.action}
                    </span>
                    <span className="text-sm text-gray-500">{activity.relatedNumber}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 truncate">{activity.description}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {formatTimeAgo(activity.timestamp)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

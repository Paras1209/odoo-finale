// ===========================================
// DealFlow360 - Dashboard API
// ===========================================
// DEV B's MODULE: Dashboard summary and recent activity
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ActorType } from '@/lib/types';
import {
  getDashboardSummary,
  getRecentActivity,
  getQuotationStatusBreakdown,
  getRevenueTrend,
  getFulfillmentPerformance,
} from '@/lib/services';

// GET /api/dashboard - Get dashboard data
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');

    // Summary view (default)
    if (!view || view === 'summary') {
      const summary = await getDashboardSummary();
      return NextResponse.json({
        success: true,
        data: summary,
      });
    }

    // Recent activity
    if (view === 'activity') {
      const limitParam = searchParams.get('limit');
      const limit = limitParam ? parseInt(limitParam) : 20;
      const activity = await getRecentActivity(limit);
      return NextResponse.json({
        success: true,
        data: activity.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
        })),
      });
    }

    // Quotation status breakdown (for charts)
    if (view === 'quotation-breakdown') {
      const breakdown = await getQuotationStatusBreakdown();
      return NextResponse.json({
        success: true,
        data: breakdown,
      });
    }

    // Revenue trend
    if (view === 'revenue-trend') {
      const monthsParam = searchParams.get('months');
      const months = monthsParam ? parseInt(monthsParam) : 6;
      const trend = await getRevenueTrend(months);
      return NextResponse.json({
        success: true,
        data: trend,
      });
    }

    // Fulfillment performance
    if (view === 'fulfillment-performance') {
      const performance = await getFulfillmentPerformance();
      return NextResponse.json({
        success: true,
        data: performance,
      });
    }

    return NextResponse.json(
      { success: false, error: { code: 'INVALID_VIEW', message: 'Invalid view parameter' } },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Dashboard] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: errorMessage } },
      { status: 500 }
    );
  }
}

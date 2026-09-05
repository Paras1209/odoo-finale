// ===========================================
// DealFlow360 - Deal Health API
// ===========================================
// DEV B's MODULE: At-risk deals and health metrics
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ActorType } from '@/lib/types';
import { getDealHealthMetrics } from '@/lib/services';

// GET /api/dashboard/deal-health - Get deal health metrics
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const metrics = await getDealHealthMetrics();

    return NextResponse.json({
      success: true,
      data: {
        stalledDeals: metrics.stalledDeals.map((d) => ({
          ...d,
          lastActivityAt: d.lastActivityAt.toISOString(),
        })),
        discountAnomalies: metrics.discountAnomalies.map((d) => ({
          ...d,
          lastActivityAt: d.lastActivityAt.toISOString(),
        })),
        deliverySlippage: metrics.deliverySlippage.map((s) => ({
          ...s,
          estimatedShipDate: s.estimatedShipDate.toISOString(),
          actualShipDate: s.actualShipDate?.toISOString() || null,
        })),
        expiringQuotations: metrics.expiringQuotations.map((d) => ({
          ...d,
          lastActivityAt: d.lastActivityAt.toISOString(),
        })),
        summary: metrics.summary,
      },
    });
  } catch (error) {
    console.error('[DealHealth] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: errorMessage } },
      { status: 500 }
    );
  }
}

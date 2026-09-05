// ===========================================
// DealFlow360 - Stalled Deals API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType } from '@/lib/types';

// GET /api/dashboard/stalled - Get stalled deals
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
    const daysThreshold = parseInt(searchParams.get('days') || '3', 10);

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    const stalledDeals = await prisma.quotation.findMany({
      where: {
        status: { in: ['DRAFT', 'PENDING_MANAGER_APPROVAL', 'PENDING_FINANCE_APPROVAL'] },
        lastActivityAt: { lt: thresholdDate },
      },
      include: {
        customer: { select: { id: true, name: true } },
        rep: { select: { id: true, name: true } },
      },
      orderBy: { lastActivityAt: 'asc' },
    });

    const now = new Date();

    return NextResponse.json({
      success: true,
      data: stalledDeals.map(deal => ({
        quotationId: deal.id,
        quotationNumber: deal.quotationNumber,
        customerName: deal.customer.name,
        repName: deal.rep.name,
        status: deal.status,
        totalAmount: deal.totalAmount.toNumber(),
        lastActivityAt: deal.lastActivityAt.toISOString(),
        daysSinceActivity: Math.floor((now.getTime() - deal.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24)),
      })),
    });
  } catch (error) {
    console.error('[Dashboard/Stalled] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// ===========================================
// DealFlow360 - Dashboard Summary API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType } from '@/lib/types';

// GET /api/dashboard/summary - Get dashboard summary
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get status counts
    const statusCounts = await prisma.quotation.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    // Get pending approvals count
    const pendingApprovals = await prisma.approval.count({
      where: { status: 'PENDING' },
    });

    // Get stalled deals (inactive > 3 days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const stalledDeals = await prisma.quotation.count({
      where: {
        status: { in: ['DRAFT', 'PENDING_MANAGER_APPROVAL', 'PENDING_FINANCE_APPROVAL'] },
        lastActivityAt: { lt: threeDaysAgo },
      },
    });

    // Get recent activity
    const recentActivity = await prisma.auditLog.findMany({
      where: {
        entityType: { in: ['QUOTATION', 'APPROVAL', 'INVOICE'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Calculate totals
    const totalQuotations = statusCounts.reduce((sum, s) => sum + s._count.id, 0);
    const totalRevenue = statusCounts
      .filter(s => ['CONFIRMED', 'FULFILLING', 'BILLED'].includes(s.status))
      .reduce((sum, s) => sum + (s._sum.totalAmount?.toNumber() ?? 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        summary: statusCounts.map(s => ({
          status: s.status,
          count: s._count.id,
          totalAmount: s._sum.totalAmount?.toNumber() ?? 0,
        })),
        metrics: {
          totalQuotations,
          pendingApprovals,
          stalledDeals,
          totalRevenue,
        },
        recentActivity: recentActivity.map(a => ({
          id: a.id,
          entityType: a.entityType,
          entityId: a.entityId,
          action: a.action,
          createdAt: a.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('[Dashboard/Summary] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

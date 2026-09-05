// ===========================================
// DealFlow360 - Approval List API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, UserRole, ApprovalStatus, ApprovalLevel } from '@/lib/types';

// GET /api/approval - List pending approvals
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Only approvers can see approvals
    const approverRoles = [UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN];
    if (!session.user.role || !approverRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only approvers can view pending approvals' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status') || 'PENDING';
    const status = statusParam as ApprovalStatus;

    // Filter by level based on role
    let levelFilter: { level?: ApprovalLevel } = {};
    if (session.user.role === UserRole.SALES_MANAGER) {
      levelFilter = { level: ApprovalLevel.MANAGER };
    } else if (session.user.role === UserRole.FINANCE_OPS) {
      levelFilter = { level: ApprovalLevel.FINANCE };
    }

    const approvals = await prisma.approval.findMany({
      where: {
        status,
        ...levelFilter,
      },
      include: {
        quotation: {
          include: {
            customer: { select: { id: true, name: true, tier: true } },
            rep: { select: { id: true, name: true } },
          },
        },
        approver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: approvals.map(approval => ({
        id: approval.id,
        quotationId: approval.quotationId,
        quotationNumber: approval.quotation.quotationNumber,
        customerName: approval.quotation.customer.name,
        customerTier: approval.quotation.customer.tier,
        repName: approval.quotation.rep.name,
        totalAmount: approval.quotation.totalAmount.toNumber(),
        blendedRiskScore: approval.quotation.blendedRiskScore?.toNumber() ?? null,
        level: approval.level,
        status: approval.status,
        approverId: approval.approverId,
        approverName: approval.approver?.name ?? null,
        reason: approval.reason,
        actedAt: approval.actedAt?.toISOString() ?? null,
        createdAt: approval.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[Approval/List] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

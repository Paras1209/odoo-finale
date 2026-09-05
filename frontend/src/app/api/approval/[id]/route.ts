// ===========================================
// DealFlow360 - Approval Detail API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, UserRole } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/approval/[id] - Get approval details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const approverRoles = [UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN];
    if (!session.user.role || !approverRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only approvers can view approval details' } },
        { status: 403 }
      );
    }

    const { id } = await params;

    const approval = await prisma.approval.findUnique({
      where: { id },
      include: {
        quotation: {
          include: {
            customer: { select: { id: true, name: true, tier: true, email: true } },
            rep: { select: { id: true, name: true, email: true } },
            lines: {
              include: {
                product: { select: { id: true, name: true, category: true } },
              },
            },
          },
        },
        approver: { select: { id: true, name: true, email: true } },
      },
    });

    if (!approval) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Approval not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: approval.id,
        level: approval.level,
        status: approval.status,
        reason: approval.reason,
        actedAt: approval.actedAt?.toISOString() ?? null,
        createdAt: approval.createdAt.toISOString(),
        approver: approval.approver ? {
          id: approval.approver.id,
          name: approval.approver.name,
          email: approval.approver.email,
        } : null,
        quotation: {
          id: approval.quotation.id,
          quotationNumber: approval.quotation.quotationNumber,
          status: approval.quotation.status,
          totalAmount: approval.quotation.totalAmount.toNumber(),
          totalMargin: approval.quotation.totalMargin.toNumber(),
          blendedRiskScore: approval.quotation.blendedRiskScore?.toNumber() ?? null,
          customer: {
            id: approval.quotation.customer.id,
            name: approval.quotation.customer.name,
            tier: approval.quotation.customer.tier,
            email: approval.quotation.customer.email,
          },
          rep: {
            id: approval.quotation.rep.id,
            name: approval.quotation.rep.name,
            email: approval.quotation.rep.email,
          },
          lines: approval.quotation.lines.map(line => ({
            id: line.id,
            productName: line.product.name,
            productCategory: line.product.category,
            quantity: line.quantity,
            unitPrice: line.unitPrice.toNumber(),
            discountPct: line.discountPct.toNumber(),
            lineTotal: line.lineTotal.toNumber(),
          })),
        },
      },
    });
  } catch (error) {
    console.error('[Approval/Get] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

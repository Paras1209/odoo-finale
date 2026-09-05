import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, QuotationStatus } from '@/lib/types';
import { evaluateQuotation, dealEvents, auditLogger } from '@/lib/services';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.CUSTOMER) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Portal authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const quotation = await prisma.quotation.findUnique({
      where: { id, customerId: session.user.id },
      include: {
        customer: true,
        lines: { include: { product: true } },
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Quotation not found' } },
        { status: 404 }
      );
    }

    if (quotation.status !== 'APPROVED') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Can only counter APPROVED quotations' } },
        { status: 400 }
      );
    }

    const previousStatus = quotation.status;
    const requestedDiscountPct = body.discountPct || 0;

    // First, update the overall discount on the quotation
    await prisma.quotation.update({
      where: { id },
      data: {
        overallDiscountPct: requestedDiscountPct,
        lastActivityAt: new Date(),
      }
    });

    // Re-evaluate risk score with the new discount
    // Note: The risk score engine evaluates line-level discounts, not overall discount
    // For a proper implementation, we might need to apply the overall discount to lines
    // For now, we'll re-evaluate and route based on the result
    const riskResult = await evaluateQuotation(id);

    // Determine new status based on risk evaluation
    let newStatus: QuotationStatus;
    if (riskResult.blendedScore > 0 || requestedDiscountPct > 0) {
      // Counter offer needs review - either has violations or customer is asking for extra discount
      newStatus = QuotationStatus.DRAFT;
      
      // If the counter creates new violations that exceed thresholds, require approval
      if (riskResult.requiresManager) {
        newStatus = QuotationStatus.PENDING_MANAGER_APPROVAL;
        await prisma.approval.create({
          data: {
            quotationId: id,
            level: 'MANAGER',
            status: 'PENDING',
          },
        });
      }
    } else {
      // No violations and no extra discount requested - back to draft for rep to review
      newStatus = QuotationStatus.DRAFT;
    }

    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        status: newStatus,
        blendedRiskScore: riskResult.blendedScore,
      }
    });

    // Emit customer counter discount event
    dealEvents.emit('portal.counterDiscount', {
      quotationId: id,
      quotationLineId: '', // Overall discount, not line-specific
      customerId: session.user.id,
      requestedDiscountPct,
      previousDiscountPct: quotation.overallDiscountPct?.toNumber() ?? 0,
      comment: `Customer requested ${requestedDiscountPct}% overall discount`,
      requestedAt: new Date(),
    });

    // Emit status change event
    dealEvents.emit('quotation.statusChanged', {
      quotationId: id,
      previousStatus,
      newStatus,
      changedBy: { id: session.user.id, type: ActorType.CUSTOMER },
      changedAt: new Date(),
    });

    // Audit log
    await auditLogger.logQuotationTransition(
      session.user.id,
      ActorType.CUSTOMER,
      id,
      'COUNTER_DISCOUNT',
      previousStatus,
      newStatus,
      `Customer requested ${requestedDiscountPct}% overall discount`
    );

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        quotationNumber: updated.quotationNumber,
        status: updated.status,
        previousStatus,
        blendedRiskScore: riskResult.blendedScore,
        requestedDiscountPct,
        requiresApproval: newStatus === QuotationStatus.PENDING_MANAGER_APPROVAL,
      },
      message: newStatus === QuotationStatus.PENDING_MANAGER_APPROVAL 
        ? 'Counter offer submitted - requires manager approval due to discount thresholds'
        : 'Counter offer submitted to sales rep for review',
    });
  } catch (error) {
    console.error('[Portal/Quotations/Counter] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

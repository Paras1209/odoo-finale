import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, CounterOfferStatus } from '@/lib/types';
import { dealEvents, auditLogger } from '@/lib/services';
import { Decimal } from '@prisma/client/runtime/library';

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

    // Can only counter APPROVED quotations or quotations where sales rep has countered back
    const canCounter = quotation.status === 'APPROVED' && 
      (quotation.counterOfferStatus === null || quotation.counterOfferStatus === 'COUNTERED');
    
    if (!canCounter) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Can only counter APPROVED quotations' } },
        { status: 400 }
      );
    }

    const requestedDiscountPct = body.discountPct || 0;
    const comment = body.comment || '';

    // Calculate unit price total (sum of unitPrice * quantity for all lines, before any discounts)
    const unitPriceTotal = quotation.lines.reduce((sum, line) => {
      const lineUnitTotal = line.unitPrice.toNumber() * line.quantity;
      return sum + lineUnitTotal;
    }, 0);

    // Calculate the countered total amount based on the requested discount from unit price total
    const discountAmount = unitPriceTotal * (requestedDiscountPct / 100);
    const counteredTotalAmount = unitPriceTotal - discountAmount;

    // Update quotation with counter offer data (stored separately, doesn't modify original values)
    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        counterOfferStatus: CounterOfferStatus.PENDING,
        counteredDiscountPct: new Decimal(requestedDiscountPct),
        counteredTotalAmount: new Decimal(counteredTotalAmount),
        unitPriceTotal: new Decimal(unitPriceTotal),
        counterOfferAt: new Date(),
        counterOfferRespondedAt: null, // Reset response timestamp
        lastActivityAt: new Date(),
      }
    });

    // Create a comment record for the negotiation thread
    await prisma.quotationComment.create({
      data: {
        quotationId: id,
        authorType: ActorType.CUSTOMER,
        authorId: session.user.id,
        commentText: comment || `Counter offer: Requesting ${requestedDiscountPct}% discount (${formatCurrency(counteredTotalAmount)} total from ${formatCurrency(unitPriceTotal)} unit price total)`,
      }
    });

    // Emit customer counter discount event
    dealEvents.emit('portal.counterDiscount', {
      quotationId: id,
      quotationLineId: '', // Overall discount, not line-specific
      customerId: session.user.id,
      requestedDiscountPct,
      previousDiscountPct: quotation.counteredDiscountPct?.toNumber() ?? 0,
      unitPriceTotal,
      counteredTotalAmount,
      comment,
      requestedAt: new Date(),
    });

    // Audit log
    await auditLogger.logQuotationTransition(
      session.user.id,
      ActorType.CUSTOMER,
      id,
      'COUNTER_OFFER',
      quotation.status,
      quotation.status, // Status remains the same, only counter offer fields change
      `Customer counter offer: ${requestedDiscountPct}% discount requested (${formatCurrency(counteredTotalAmount)} from ${formatCurrency(unitPriceTotal)} unit price total)`
    );

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        quotationNumber: updated.quotationNumber,
        status: updated.status,
        counterOfferStatus: updated.counterOfferStatus,
        counteredDiscountPct: requestedDiscountPct,
        counteredTotalAmount,
        unitPriceTotal,
        originalTotalAmount: quotation.totalAmount.toNumber(),
        originalDiscountPct: quotation.overallDiscountPct.toNumber(),
      },
      message: 'Counter offer submitted. Sales rep will review and respond.',
    });
  } catch (error) {
    console.error('[Portal/Quotations/Counter] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

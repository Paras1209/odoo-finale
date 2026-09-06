import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, CounterOfferStatus, UserRole, QuotationStatus } from '@/lib/types';
import { dealEvents, auditLogger, registerBillingEventHandlers } from '@/lib/services';
import { Decimal } from '@prisma/client/runtime/library';

// Ensure billing event handlers are registered for quotation.confirmed event
registerBillingEventHandlers();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/quotation/[id]/counter-response
 * Sales rep responds to a customer's counter offer
 * 
 * Body:
 * - action: 'accept' | 'reject' | 'counter'
 * - counterDiscountPct?: number (required if action is 'counter')
 * - comment?: string
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Only sales reps and managers can respond to counter offers
    const allowedRoles = [UserRole.SALES_REP, UserRole.SALES_MANAGER, UserRole.ADMIN];
    if (!allowedRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only sales reps can respond to counter offers' } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action, counterDiscountPct, comment } = body;

    if (!action || !['accept', 'reject', 'counter'].includes(action)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid action. Must be accept, reject, or counter' } },
        { status: 400 }
      );
    }

    if (action === 'counter' && (counterDiscountPct === undefined || counterDiscountPct < 0)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Counter action requires a valid counterDiscountPct' } },
        { status: 400 }
      );
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id },
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

    // Check if there's a pending counter offer
    if (quotation.counterOfferStatus !== CounterOfferStatus.PENDING) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'No pending counter offer to respond to' } },
        { status: 400 }
      );
    }

    // Get unit price total (should already be calculated, but recalculate if missing)
    const unitPriceTotal = quotation.unitPriceTotal?.toNumber() ?? quotation.lines.reduce((sum, line) => {
      return sum + (line.unitPrice.toNumber() * line.quantity);
    }, 0);

    let updateData: Record<string, unknown> = {
      counterOfferRespondedAt: new Date(),
      lastActivityAt: new Date(),
    };
    let responseMessage: string;
    let newCounterOfferStatus: CounterOfferStatus;

    switch (action) {
      case 'accept':
        // Accept the customer's counter offer - apply their requested discount
        // Also auto-confirm the quotation since both parties have agreed on terms
        const acceptedDiscountPct = quotation.counteredDiscountPct?.toNumber() ?? 0;
        const acceptedTotalAmount = quotation.counteredTotalAmount?.toNumber() ?? quotation.totalAmount.toNumber();
        
        updateData = {
          ...updateData,
          counterOfferStatus: CounterOfferStatus.ACCEPTED,
          // Update the actual quotation values to match the accepted counter offer
          overallDiscountPct: new Decimal(acceptedDiscountPct),
          totalAmount: new Decimal(acceptedTotalAmount),
          // Auto-confirm: change status to CONFIRMED (converts to order)
          status: QuotationStatus.CONFIRMED,
        };
        newCounterOfferStatus = CounterOfferStatus.ACCEPTED;
        responseMessage = `Counter offer accepted. Discount set to ${acceptedDiscountPct}%. Quotation confirmed as order.`;
        break;

      case 'reject':
        updateData = {
          ...updateData,
          counterOfferStatus: CounterOfferStatus.REJECTED,
          // Clear counter offer values but keep original quotation values
          counteredDiscountPct: null,
          counteredTotalAmount: null,
        };
        newCounterOfferStatus = CounterOfferStatus.REJECTED;
        responseMessage = 'Counter offer rejected. Original terms remain.';
        break;

      case 'counter':
        // Sales rep makes a counter-counter offer
        const newDiscountAmount = unitPriceTotal * (counterDiscountPct / 100);
        const newCounteredTotal = unitPriceTotal - newDiscountAmount;

        updateData = {
          ...updateData,
          counterOfferStatus: CounterOfferStatus.COUNTERED,
          counteredDiscountPct: new Decimal(counterDiscountPct),
          counteredTotalAmount: new Decimal(newCounteredTotal),
        };
        newCounterOfferStatus = CounterOfferStatus.COUNTERED;
        responseMessage = `Counter-counter offer made: ${counterDiscountPct}% discount (${formatCurrency(newCounteredTotal)})`;
        break;

      default:
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid action' } },
          { status: 400 }
        );
    }

    const updated = await prisma.quotation.update({
      where: { id },
      data: updateData,
    });

    // Create a comment record for the negotiation thread
    const commentText = comment || responseMessage;
    await prisma.quotationComment.create({
      data: {
        quotationId: id,
        authorType: ActorType.INTERNAL,
        authorId: session.user.id,
        commentText,
      }
    });

    // Emit event
    dealEvents.emit('quotation.counterResponse', {
      quotationId: id,
      action,
      respondedBy: { id: session.user.id, type: ActorType.INTERNAL },
      counterDiscountPct: action === 'counter' ? counterDiscountPct : undefined,
      comment: commentText,
      respondedAt: new Date(),
    });

    // If accepting counter offer, also emit quotation.confirmed event to trigger
    // fulfillment and billing workflows (same as when customer confirms quotation)
    if (action === 'accept') {
      dealEvents.emit('quotation.confirmed', {
        quotationId: id,
        quotation: quotation as any,
        lines: quotation.lines as any,
        customerId: quotation.customerId,
        confirmedBy: { id: session.user.id, type: ActorType.INTERNAL },
        confirmedAt: new Date(),
      });

      // Emit status change event
      dealEvents.emit('quotation.statusChanged', {
        quotationId: id,
        previousStatus: quotation.status,
        newStatus: QuotationStatus.CONFIRMED,
        changedBy: { id: session.user.id, type: ActorType.INTERNAL },
        changedAt: new Date(),
      });
    }

    // Audit log
    const auditAction = action === 'accept' ? 'COUNTER_ACCEPT' : 
                        action === 'reject' ? 'COUNTER_REJECT' : 'COUNTER_COUNTER';
    await auditLogger.logQuotationTransition(
      session.user.id,
      ActorType.INTERNAL,
      id,
      auditAction,
      quotation.status,
      action === 'accept' ? QuotationStatus.CONFIRMED : quotation.status,
      commentText
    );

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        quotationNumber: updated.quotationNumber,
        status: updated.status,
        counterOfferStatus: newCounterOfferStatus,
        counteredDiscountPct: updated.counteredDiscountPct?.toNumber() ?? null,
        counteredTotalAmount: updated.counteredTotalAmount?.toNumber() ?? null,
        unitPriceTotal,
        totalAmount: updated.totalAmount.toNumber(),
        overallDiscountPct: updated.overallDiscountPct.toNumber(),
      },
      message: responseMessage,
    });
  } catch (error) {
    console.error('[Quotation/CounterResponse] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

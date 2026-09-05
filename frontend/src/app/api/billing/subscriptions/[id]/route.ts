// ===========================================
// DealFlow360 - Subscription Detail API
// ===========================================
// M4 - Dev A: Subscription detail, modify, cancel
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ActorType, UserRole } from '@/lib/types';
import { modifySubscriptionSchema, cancelSubscriptionSchema } from '@/lib/validators';
import { 
  getSubscriptionById, 
  modifySubscription, 
  cancelSubscription,
  calculateProration,
  calculateCancellationRefund,
} from '@/lib/services/billingService';
import { auditLogger, dealEvents } from '@/lib/services';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/billing/subscriptions/[id] - Get subscription details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;

    const subscription = await getSubscriptionById(id);

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Subscription not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: subscription.id,
        productId: subscription.productId,
        productName: subscription.product.name,
        productSku: subscription.product.sku,
        productCategory: subscription.product.category,
        quantity: subscription.quantity,
        unitPrice: subscription.unitPrice.toNumber(),
        discountPct: subscription.discountPct.toNumber(),
        lineTotal: subscription.lineTotal.toNumber(),
        marginAmount: subscription.marginAmount.toNumber(),
        marginPct: subscription.marginPct.toNumber(),
        billingFrequency: subscription.billingFrequency,
        lineType: subscription.lineType,
        subscriptionPlan: subscription.product.subscriptionPlan ? {
          id: subscription.product.subscriptionPlan.id,
          name: subscription.product.subscriptionPlan.name,
          frequency: subscription.product.subscriptionPlan.frequency,
          prorationRule: subscription.product.subscriptionPlan.prorationRule,
          trialDays: subscription.product.subscriptionPlan.trialDays,
        } : null,
        quotation: {
          id: subscription.quotation.id,
          quotationNumber: subscription.quotation.quotationNumber,
          status: subscription.quotation.status,
        },
        customer: {
          id: subscription.quotation.customer.id,
          name: subscription.quotation.customer.name,
          email: subscription.quotation.customer.email,
          tier: subscription.quotation.customer.tier,
          companyName: subscription.quotation.customer.companyName,
        },
        rep: subscription.quotation.rep,
        subscriptionStatus: subscription.subscriptionStatus,
        totalSchedules: subscription.totalSchedules,
        upcomingCount: subscription.upcomingCount,
        paidCount: subscription.paidCount,
        cancelledCount: subscription.cancelledCount,
        nextBillingDate: subscription.nextBillingDate?.toISOString() ?? null,
        nextBillingAmount: subscription.nextBillingAmount,
        lastPaymentDate: subscription.lastPaymentDate?.toISOString() ?? null,
        totalPaid: subscription.totalPaid,
        totalRemaining: subscription.totalRemaining,
        billingSchedules: subscription.billingSchedules.map(s => ({
          id: s.id,
          cycleNumber: s.cycleNumber,
          dueDate: s.dueDate.toISOString(),
          amount: s.amount.toNumber(),
          status: s.status,
          invoiceId: s.invoiceId,
        })),
        createdAt: subscription.createdAt.toISOString(),
        updatedAt: subscription.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Billing/Subscriptions/Get] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// POST /api/billing/subscriptions/[id] - Modify or cancel subscription
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Verify subscription exists
    const subscription = await getSubscriptionById(id);
    if (!subscription) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Subscription not found' } },
        { status: 404 }
      );
    }

    if (subscription.subscriptionStatus === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Cannot modify a cancelled subscription' } },
        { status: 400 }
      );
    }

    // Handle MODIFY action
    if (action === 'modify') {
      const body = await request.json();
      const parsed = modifySubscriptionSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
          { status: 400 }
        );
      }

      const { newQuantity, effectiveDate } = parsed.data;
      const effectiveDateParsed = effectiveDate ? new Date(effectiveDate) : new Date();

      const result = await modifySubscription(id, newQuantity, effectiveDateParsed);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: { code: 'MODIFICATION_FAILED', message: result.error } },
          { status: 400 }
        );
      }

      await auditLogger.log({
        entityType: 'SUBSCRIPTION',
        entityId: id,
        actorId: session.user.id,
        actorType: ActorType.INTERNAL,
        action: 'MODIFY',
        beforeState: { quantity: subscription.quantity },
        afterState: { quantity: newQuantity, prorationAmount: result.prorationAmount },
      });

      dealEvents.emit('subscription.modified', {
        subscriptionId: id,
        quotationLineId: id,
        customerId: subscription.quotation.customer.id,
        previousAmount: subscription.lineTotal.toNumber(),
        newAmount: newQuantity * subscription.unitPrice.toNumber() * (1 - subscription.discountPct.toNumber() / 100),
        previousQuantity: subscription.quantity,
        newQuantity,
        prorationAmount: result.prorationAmount,
        effectiveDate: effectiveDateParsed,
        modifiedBy: { id: session.user.id, type: 'INTERNAL' as const },
        modifiedAt: effectiveDateParsed,
      });

      return NextResponse.json({
        success: true,
        data: {
          prorationAmount: result.prorationAmount,
          creditNoteId: result.creditNoteId,
          newSchedules: result.newSchedules,
        },
        message: `Subscription modified successfully. Proration adjustment: $${Math.abs(result.prorationAmount).toFixed(2)} ${result.prorationAmount < 0 ? '(credit)' : '(charge)'}`,
      });
    }

    // Handle CANCEL action
    if (action === 'cancel') {
      // Only finance/admin can cancel subscriptions
      const financeRoles = [UserRole.FINANCE_OPS, UserRole.ADMIN, UserRole.SALES_MANAGER];
      if (!session.user.role || !financeRoles.includes(session.user.role)) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Only finance users or managers can cancel subscriptions' } },
          { status: 403 }
        );
      }

      const body = await request.json();
      const parsed = cancelSubscriptionSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
          { status: 400 }
        );
      }

      const { reason, effectiveDate } = parsed.data;
      const cancelDateParsed = effectiveDate ? new Date(effectiveDate) : new Date();

      const result = await cancelSubscription(id, cancelDateParsed, reason);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: { code: 'CANCELLATION_FAILED', message: result.error } },
          { status: 400 }
        );
      }

      await auditLogger.log({
        entityType: 'SUBSCRIPTION',
        entityId: id,
        actorId: session.user.id,
        actorType: ActorType.INTERNAL,
        action: 'CANCEL',
        reason,
        afterState: { 
          refundAmount: result.refundAmount, 
          creditNoteId: result.creditNoteId,
          cancelledSchedules: result.cancelledSchedules,
        },
      });

      dealEvents.emit('subscription.cancelled', {
        subscriptionId: id,
        quotationLineId: id,
        customerId: subscription.quotation.customer.id,
        cancellationType: 'IMMEDIATE' as const,
        refundAmount: result.refundAmount,
        creditNoteId: result.creditNoteId,
        cancelledBy: { id: session.user.id, type: 'INTERNAL' as const },
        cancelledAt: cancelDateParsed,
        effectiveDate: cancelDateParsed,
        reason,
      });

      return NextResponse.json({
        success: true,
        data: {
          refundAmount: result.refundAmount,
          creditNoteId: result.creditNoteId,
          creditNoteNumber: result.creditNoteNumber,
          cancelledSchedules: result.cancelledSchedules,
        },
        message: result.refundAmount > 0
          ? `Subscription cancelled. Refund of $${result.refundAmount.toFixed(2)} issued as credit note ${result.creditNoteNumber}.`
          : 'Subscription cancelled successfully.',
      });
    }

    // Handle PREVIEW action - preview proration without applying
    if (action === 'preview-modify') {
      const body = await request.json();
      const parsed = modifySubscriptionSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
          { status: 400 }
        );
      }

      const { newQuantity, effectiveDate } = parsed.data;
      const effectiveDateParsed = effectiveDate ? new Date(effectiveDate) : new Date();

      // Calculate preview without applying
      const currentAmount = subscription.lineTotal.toNumber();
      const unitPrice = subscription.unitPrice.toNumber();
      const discountPct = subscription.discountPct.toNumber();
      const newAmount = newQuantity * unitPrice * (1 - discountPct / 100);

      const prorationRule = subscription.product.subscriptionPlan?.prorationRule ?? 'DAILY';
      
      // Find next billing date for cycle boundaries
      const nextBillingDate = subscription.nextBillingDate ?? new Date();
      let cycleStartDate: Date;
      
      switch (subscription.billingFrequency) {
        case 'MONTHLY':
          cycleStartDate = new Date(nextBillingDate);
          cycleStartDate.setMonth(cycleStartDate.getMonth() - 1);
          break;
        case 'QUARTERLY':
          cycleStartDate = new Date(nextBillingDate);
          cycleStartDate.setMonth(cycleStartDate.getMonth() - 3);
          break;
        case 'YEARLY':
          cycleStartDate = new Date(nextBillingDate);
          cycleStartDate.setFullYear(cycleStartDate.getFullYear() - 1);
          break;
        default:
          cycleStartDate = new Date(nextBillingDate);
          cycleStartDate.setMonth(cycleStartDate.getMonth() - 1);
      }

      const proration = calculateProration(
        currentAmount,
        newAmount,
        cycleStartDate,
        nextBillingDate,
        effectiveDateParsed,
        prorationRule
      );

      return NextResponse.json({
        success: true,
        data: {
          currentQuantity: subscription.quantity,
          newQuantity,
          currentAmount,
          newAmount,
          amountDifference: newAmount - currentAmount,
          proration: {
            adjustmentAmount: proration.adjustmentAmount,
            daysRemaining: proration.daysRemaining,
            totalDays: proration.totalDays,
            fractionRemaining: proration.fractionRemaining,
            description: proration.description,
          },
          effectiveDate: effectiveDateParsed.toISOString(),
        },
      });
    }

    // Handle PREVIEW-CANCEL action
    if (action === 'preview-cancel') {
      const effectiveDateParam = searchParams.get('effectiveDate');
      const cancelDateParsed = effectiveDateParam ? new Date(effectiveDateParam) : new Date();

      const currentAmount = subscription.lineTotal.toNumber();
      const prorationRule = subscription.product.subscriptionPlan?.prorationRule ?? 'DAILY';
      
      const nextBillingDate = subscription.nextBillingDate ?? new Date();
      let cycleStartDate: Date;
      
      switch (subscription.billingFrequency) {
        case 'MONTHLY':
          cycleStartDate = new Date(nextBillingDate);
          cycleStartDate.setMonth(cycleStartDate.getMonth() - 1);
          break;
        case 'QUARTERLY':
          cycleStartDate = new Date(nextBillingDate);
          cycleStartDate.setMonth(cycleStartDate.getMonth() - 3);
          break;
        case 'YEARLY':
          cycleStartDate = new Date(nextBillingDate);
          cycleStartDate.setFullYear(cycleStartDate.getFullYear() - 1);
          break;
        default:
          cycleStartDate = new Date(nextBillingDate);
          cycleStartDate.setMonth(cycleStartDate.getMonth() - 1);
      }

      const refund = calculateCancellationRefund(
        currentAmount,
        cycleStartDate,
        nextBillingDate,
        cancelDateParsed,
        prorationRule
      );

      return NextResponse.json({
        success: true,
        data: {
          currentAmount,
          refundAmount: Math.abs(refund.adjustmentAmount),
          daysRemaining: refund.daysRemaining,
          totalDays: refund.totalDays,
          fractionRemaining: refund.fractionRemaining,
          description: refund.description,
          cancelDate: cancelDateParsed.toISOString(),
          upcomingSchedulesToCancel: subscription.upcomingCount,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: { code: 'INVALID_ACTION', message: 'Invalid action. Use ?action=modify, ?action=cancel, ?action=preview-modify, or ?action=preview-cancel' } },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Billing/Subscriptions/Action] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

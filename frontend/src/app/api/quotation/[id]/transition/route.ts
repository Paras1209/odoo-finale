// ===========================================
// DealFlow360 - Quotation State Transition API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, QuotationStatus, RiskScoreResult, UserRole } from '@/lib/types';
import { transitionQuotationSchema } from '@/lib/validators';
import { auditLogger, evaluateQuotation, dealEvents, registerBillingEventHandlers } from '@/lib/services';

// Ensure billing event handlers are registered
registerBillingEventHandlers();

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/quotation/[id]/transition - Transition quotation state
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id: quotationId } = await params;
    const body = await request.json();
    const parsed = transitionQuotationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const { action, reason } = parsed.data;

    // Fetch current quotation
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
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

    const previousStatus = quotation.status;
    let newStatus: QuotationStatus = quotation.status as QuotationStatus;
    const actorType = session.user.actorType;
    let riskResult: RiskScoreResult | null = null;

    // State machine logic
    switch (action) {
      case 'CONFIRM':
        if (quotation.status === 'DRAFT') {
          // Evaluate risk score to determine routing
          riskResult = await evaluateQuotation(quotationId);
          newStatus = riskResult.status;

          // If requires approval, create approval record
          if (newStatus === QuotationStatus.PENDING_MANAGER_APPROVAL) {
            await prisma.approval.create({
              data: {
                quotationId,
                level: 'MANAGER',
                status: 'PENDING',
              },
            });
          }
          
          await prisma.quotation.update({
            where: { id: quotationId },
            data: {
              status: newStatus,
              blendedRiskScore: riskResult.blendedScore,
              lastActivityAt: new Date(),
            },
          });

          // If auto-approved (no violations), emit approved event
          if (newStatus === QuotationStatus.APPROVED) {
            dealEvents.emit('quotation.approved', {
              quotationId,
              quotation: quotation as any,
              approvalLevel: 'MANAGER', // Auto-approved passes manager level
              approverId: session.user.id,
              approvedAt: new Date(),
            });
          }
        } else if (quotation.status === 'APPROVED') {
          newStatus = QuotationStatus.CONFIRMED;
          
          await prisma.quotation.update({
            where: { id: quotationId },
            data: {
              status: newStatus,
              lastActivityAt: new Date(),
            },
          });

          // Emit event for fulfillment and billing
          dealEvents.emit('quotation.confirmed', {
            quotationId,
            quotation: quotation as any,
            lines: quotation.lines as any,
            customerId: quotation.customerId,
            confirmedBy: { id: session.user.id, type: actorType },
            confirmedAt: new Date(),
          });
        } else {
          return NextResponse.json(
            { success: false, error: { code: 'INVALID_STATE', message: `Cannot confirm quotation in ${quotation.status} status` } },
            { status: 400 }
          );
        }
        break;

      case 'APPROVE':
        if (actorType !== ActorType.INTERNAL) {
          return NextResponse.json(
            { success: false, error: { code: 'FORBIDDEN', message: 'Only internal users can approve' } },
            { status: 403 }
          );
        }

        // Check if user has an approver role
        const approverRoles = [UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN];
        if (!session.user.role || !approverRoles.includes(session.user.role as UserRole)) {
          return NextResponse.json(
            { success: false, error: { code: 'FORBIDDEN', message: 'Only approvers can approve quotations' } },
            { status: 403 }
          );
        }

        // Enforce role-based approval
        const cannotApprove =
          (quotation.status === 'PENDING_MANAGER_APPROVAL' && session.user.role === UserRole.FINANCE_OPS) ||
          (quotation.status === 'PENDING_FINANCE_APPROVAL' && session.user.role === UserRole.SALES_MANAGER);

        if (cannotApprove) {
          return NextResponse.json(
            { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to approve this level' } },
            { status: 403 }
          );
        }

        if (quotation.status === 'PENDING_MANAGER_APPROVAL') {
          // Re-evaluate to check if finance approval is needed
          riskResult = await evaluateQuotation(quotationId);
          
          if (riskResult.requiresFinance) {
            newStatus = QuotationStatus.PENDING_FINANCE_APPROVAL;
            await prisma.approval.create({
              data: {
                quotationId,
                level: 'FINANCE',
                status: 'PENDING',
              },
            });
          } else {
            newStatus = QuotationStatus.APPROVED;
          }

          // Update the approval record
          await prisma.approval.updateMany({
            where: { quotationId, level: 'MANAGER', status: 'PENDING' },
            data: { status: 'APPROVED', approverId: session.user.id, actedAt: new Date() },
          });
        } else if (quotation.status === 'PENDING_FINANCE_APPROVAL') {
          newStatus = QuotationStatus.APPROVED;
          
          await prisma.approval.updateMany({
            where: { quotationId, level: 'FINANCE', status: 'PENDING' },
            data: { status: 'APPROVED', approverId: session.user.id, actedAt: new Date() },
          });
        } else {
          return NextResponse.json(
            { success: false, error: { code: 'INVALID_STATE', message: `Cannot approve quotation in ${quotation.status} status` } },
            { status: 400 }
          );
        }
        
        await prisma.quotation.update({
          where: { id: quotationId },
          data: { status: newStatus, lastActivityAt: new Date() },
        });

        dealEvents.emit('quotation.approved', {
          quotationId,
          quotation: quotation as any,
          approvalLevel: quotation.status === 'PENDING_MANAGER_APPROVAL' ? 'MANAGER' : 'FINANCE',
          approverId: session.user.id,
          approvedAt: new Date(),
        });
        break;

      case 'REJECT':
        if (actorType !== ActorType.INTERNAL) {
          return NextResponse.json(
            { success: false, error: { code: 'FORBIDDEN', message: 'Only internal users can reject' } },
            { status: 403 }
          );
        }

        // Check if user has an approver role
        const rejectApproverRoles = [UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN];
        if (!session.user.role || !rejectApproverRoles.includes(session.user.role as UserRole)) {
          return NextResponse.json(
            { success: false, error: { code: 'FORBIDDEN', message: 'Only approvers can reject quotations' } },
            { status: 403 }
          );
        }

        if (!['PENDING_MANAGER_APPROVAL', 'PENDING_FINANCE_APPROVAL'].includes(quotation.status)) {
          return NextResponse.json(
            { success: false, error: { code: 'INVALID_STATE', message: `Cannot reject quotation in ${quotation.status} status` } },
            { status: 400 }
          );
        }

        // Enforce role-based rejection
        const cannotReject =
          (quotation.status === 'PENDING_MANAGER_APPROVAL' && session.user.role === UserRole.FINANCE_OPS) ||
          (quotation.status === 'PENDING_FINANCE_APPROVAL' && session.user.role === UserRole.SALES_MANAGER);

        if (cannotReject) {
          return NextResponse.json(
            { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to reject this level' } },
            { status: 403 }
          );
        }

        newStatus = QuotationStatus.REJECTED;
        
        const rejectLevel = quotation.status === 'PENDING_MANAGER_APPROVAL' ? 'MANAGER' : 'FINANCE';
        await prisma.approval.updateMany({
          where: { quotationId, level: rejectLevel, status: 'PENDING' },
          data: { status: 'REJECTED', approverId: session.user.id, reason, actedAt: new Date() },
        });
        
        await prisma.quotation.update({
          where: { id: quotationId },
          data: { status: newStatus, lastActivityAt: new Date() },
        });

        dealEvents.emit('quotation.rejected', {
          quotationId,
          quotation: quotation as any,
          rejectedBy: session.user.id,
          rejectionLevel: rejectLevel,
          reason: reason || 'No reason provided',
          rejectedAt: new Date(),
        });
        break;

      case 'RETURN':
        if (actorType !== ActorType.INTERNAL) {
          return NextResponse.json(
            { success: false, error: { code: 'FORBIDDEN', message: 'Only internal users can return' } },
            { status: 403 }
          );
        }

        // Check if user has an approver role
        const returnApproverRoles = [UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN];
        if (!session.user.role || !returnApproverRoles.includes(session.user.role as UserRole)) {
          return NextResponse.json(
            { success: false, error: { code: 'FORBIDDEN', message: 'Only approvers can return quotations' } },
            { status: 403 }
          );
        }

        if (!['PENDING_MANAGER_APPROVAL', 'PENDING_FINANCE_APPROVAL'].includes(quotation.status)) {
          return NextResponse.json(
            { success: false, error: { code: 'INVALID_STATE', message: `Cannot return quotation in ${quotation.status} status` } },
            { status: 400 }
          );
        }

        // Enforce role-based return
        const cannotReturn =
          (quotation.status === 'PENDING_MANAGER_APPROVAL' && session.user.role === UserRole.FINANCE_OPS) ||
          (quotation.status === 'PENDING_FINANCE_APPROVAL' && session.user.role === UserRole.SALES_MANAGER);

        if (cannotReturn) {
          return NextResponse.json(
            { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to return this level' } },
            { status: 403 }
          );
        }

        newStatus = QuotationStatus.DRAFT;
        
        const returnLevel = quotation.status === 'PENDING_MANAGER_APPROVAL' ? 'MANAGER' : 'FINANCE';
        await prisma.approval.updateMany({
          where: { quotationId, level: returnLevel, status: 'PENDING' },
          data: { status: 'RETURNED', approverId: session.user.id, reason, actedAt: new Date() },
        });
        
        await prisma.quotation.update({
          where: { id: quotationId },
          data: { status: newStatus, lastActivityAt: new Date() },
        });
        break;

      case 'CANCEL':
        if (!['DRAFT', 'APPROVED', 'CONFIRMED'].includes(quotation.status)) {
          return NextResponse.json(
            { success: false, error: { code: 'INVALID_STATE', message: `Cannot cancel quotation in ${quotation.status} status` } },
            { status: 400 }
          );
        }

        newStatus = QuotationStatus.CANCELLED;
        
        await prisma.quotation.update({
          where: { id: quotationId },
          data: { status: newStatus, lastActivityAt: new Date() },
        });
        break;

      case 'CUSTOMER_COUNTER':
        if (actorType !== ActorType.CUSTOMER) {
          return NextResponse.json(
            { success: false, error: { code: 'FORBIDDEN', message: 'Only customers can submit counter-discount' } },
            { status: 403 }
          );
        }

        if (quotation.status !== 'APPROVED') {
          return NextResponse.json(
            { success: false, error: { code: 'INVALID_STATE', message: 'Can only counter APPROVED quotations' } },
            { status: 400 }
          );
        }

        // Re-evaluate risk with the counter proposal
        // The counter discount is already applied to the quotation in the counter route
        riskResult = await evaluateQuotation(quotationId);
        
        // Route based on new risk score
        if (riskResult.blendedScore > 0) {
          // Counter breached thresholds - needs re-approval
          newStatus = QuotationStatus.PENDING_MANAGER_APPROVAL;
          await prisma.approval.create({
            data: {
              quotationId,
              level: 'MANAGER',
              status: 'PENDING',
            },
          });
        } else {
          // Counter is within limits - back to draft for rep review
          newStatus = QuotationStatus.DRAFT;
        }
        
        await prisma.quotation.update({
          where: { id: quotationId },
          data: {
            status: newStatus,
            blendedRiskScore: riskResult.blendedScore,
            lastActivityAt: new Date(),
          },
        });

        dealEvents.emit('portal.counterDiscount', {
          quotationId,
          quotationLineId: '', // Overall discount, not line-specific
          customerId: session.user.id,
          requestedDiscountPct: quotation.overallDiscountPct?.toNumber() ?? 0,
          previousDiscountPct: 0,
          comment: 'Counter discount submitted via transition API',
          requestedAt: new Date(),
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_ACTION', message: `Invalid action: ${action}` } },
          { status: 400 }
        );
    }

    // Emit status change event
    dealEvents.emit('quotation.statusChanged', {
      quotationId,
      previousStatus,
      newStatus,
      changedBy: { id: session.user.id, type: actorType },
      changedAt: new Date(),
    });

    // Audit log
    await auditLogger.logQuotationTransition(
      session.user.id,
      actorType,
      quotationId,
      action as any,
      previousStatus,
      newStatus,
      reason
    );

    // Fetch updated quotation
    const updated = await prisma.quotation.findUnique({
      where: { id: quotationId },
      select: {
        id: true,
        quotationNumber: true,
        status: true,
        blendedRiskScore: true,
        lastActivityAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated!.id,
        quotationNumber: updated!.quotationNumber,
        status: updated!.status,
        blendedRiskScore: updated!.blendedRiskScore?.toNumber() ?? null,
        previousStatus,
        riskResult: riskResult ? {
          blendedScore: riskResult.blendedScore,
          requiresManager: riskResult.requiresManager,
          requiresFinance: riskResult.requiresFinance,
          violationCount: riskResult.lineViolations.length,
        } : null,
        lastActivityAt: updated!.lastActivityAt.toISOString(),
      },
      message: `Quotation ${action.toLowerCase()}ed successfully`,
    });
  } catch (error) {
    console.error('[Quotation/Transition] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

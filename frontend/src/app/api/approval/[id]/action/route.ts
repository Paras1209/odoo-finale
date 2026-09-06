// ===========================================
// DealFlow360 - Approval Action API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, UserRole, QuotationStatus, ApprovalLevel } from '@/lib/types';
import { approvalActionSchema } from '@/lib/validators';
import { auditLogger, evaluateQuotation, dealEvents } from '@/lib/services';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/approval/[id]/action - Approve, reject, or return an approval
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user has approver role
    const approverRoles = [UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN];
    if (!session.user.role || !approverRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only approvers can perform approval actions' } },
        { status: 403 }
      );
    }

    const { id: approvalId } = await params;
    const body = await request.json();
    const parsed = approvalActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const { action, reason } = parsed.data;

    // Fetch the approval with quotation
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        quotation: {
          include: {
            customer: true,
            lines: { include: { product: true } },
          },
        },
      },
    });

    if (!approval) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Approval not found' } },
        { status: 404 }
      );
    }

    // Check if approval is still pending
    if (approval.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'This approval has already been processed' } },
        { status: 400 }
      );
    }

    // Check if user can approve this level
    const userRole = session.user.role;
    const cannotApprove =
      (approval.level === ApprovalLevel.MANAGER && userRole === UserRole.FINANCE_OPS) ||
      (approval.level === ApprovalLevel.FINANCE && userRole === UserRole.SALES_MANAGER);

    if (cannotApprove) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to approve this level' } },
        { status: 403 }
      );
    }

    const quotationId = approval.quotationId;
    const previousQuotationStatus = approval.quotation.status;
    let newQuotationStatus: QuotationStatus;

    switch (action) {
      case 'APPROVE':
        // Update approval record
        await prisma.approval.update({
          where: { id: approvalId },
          data: {
            status: 'APPROVED',
            approverId: session.user.id,
            actedAt: new Date(),
          },
        });

        if (approval.level === ApprovalLevel.MANAGER) {
          // Check if finance approval is needed
          const riskResult = await evaluateQuotation(quotationId);
          
          if (riskResult.requiresFinance) {
            // Create finance approval
            newQuotationStatus = QuotationStatus.PENDING_FINANCE_APPROVAL;
            await prisma.approval.create({
              data: {
                quotationId,
                level: 'FINANCE',
                status: 'PENDING',
              },
            });
          } else {
            newQuotationStatus = QuotationStatus.APPROVED;
          }
        } else {
          // Finance approval - quotation is now approved
          newQuotationStatus = QuotationStatus.APPROVED;
        }

        await prisma.quotation.update({
          where: { id: quotationId },
          data: {
            status: newQuotationStatus,
            lastActivityAt: new Date(),
          },
        });

        // Emit events
        if (newQuotationStatus === QuotationStatus.APPROVED) {
          dealEvents.emit('quotation.approved', {
            quotationId,
            quotation: approval.quotation as any,
            approvalLevel: approval.level,
            approverId: session.user.id,
            approvedAt: new Date(),
          });
        }
        break;

      case 'REJECT':
        if (!reason) {
          return NextResponse.json(
            { success: false, error: { code: 'VALIDATION_ERROR', message: 'Reason is required for rejection' } },
            { status: 400 }
          );
        }

        await prisma.approval.update({
          where: { id: approvalId },
          data: {
            status: 'REJECTED',
            approverId: session.user.id,
            reason,
            actedAt: new Date(),
          },
        });

        newQuotationStatus = QuotationStatus.REJECTED;
        await prisma.quotation.update({
          where: { id: quotationId },
          data: {
            status: newQuotationStatus,
            lastActivityAt: new Date(),
          },
        });

        dealEvents.emit('quotation.rejected', {
          quotationId,
          quotation: approval.quotation as any,
          rejectedBy: session.user.id,
          rejectionLevel: approval.level,
          reason,
          rejectedAt: new Date(),
        });
        break;

      case 'RETURN':
        if (!reason) {
          return NextResponse.json(
            { success: false, error: { code: 'VALIDATION_ERROR', message: 'Reason is required for return' } },
            { status: 400 }
          );
        }

        await prisma.approval.update({
          where: { id: approvalId },
          data: {
            status: 'RETURNED',
            approverId: session.user.id,
            reason,
            actedAt: new Date(),
          },
        });

        newQuotationStatus = QuotationStatus.DRAFT;
        await prisma.quotation.update({
          where: { id: quotationId },
          data: {
            status: newQuotationStatus,
            lastActivityAt: new Date(),
          },
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
      previousStatus: previousQuotationStatus,
      newStatus: newQuotationStatus!,
      changedBy: { id: session.user.id, type: ActorType.INTERNAL },
      changedAt: new Date(),
    });

    // Audit log
    await auditLogger.logApprovalAction(
      session.user.id,
      approvalId,
      quotationId,
      approval.level,
      action,
      reason
    );

    return NextResponse.json({
      success: true,
      data: {
        approvalId,
        quotationId,
        action,
        previousQuotationStatus,
        newQuotationStatus: newQuotationStatus!,
      },
      message: `Approval ${action.toLowerCase()}ed successfully`,
    });
  } catch (error) {
    console.error('[Approval/Action] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

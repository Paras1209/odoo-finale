// ===========================================
// DealFlow360 - Quotation Service
// ===========================================
// DEV A's MODULE: Core quotation business logic
// PHASE 0: Interface stubs agreed upon by both developers.
// ===========================================

import { prisma } from '../../shared/db/prisma.js';
import { dealEvents } from '../../shared/services/eventBus.js';
import { evaluateQuotation } from '../../shared/services/riskScoreEngine.js';
import { auditLogger, AuditEntityType } from '../../shared/services/auditLogger.js';
import {
  QuotationStatus,
  QuotationAction,
  ActorType,
  Quotation,
  QuotationLine,
} from '../../shared/types/index.js';

// ===========================================
// INTERFACE (FROZEN IN PHASE 0)
// ===========================================

/**
 * INTERSECTION POINT 1: Quotation State Transition
 * 
 * This is the ONLY function that should change quotation status.
 * All callers (rep endpoint, manager approval, customer portal) use this function.
 * Never set status directly via a generic update call.
 * 
 * AGREED INTERFACE - DO NOT CHANGE SIGNATURE
 * 
 * @param quotationId - The quotation to transition
 * @param action - The action being performed
 * @param actorId - Who is performing the action
 * @param actorType - INTERNAL (user) or CUSTOMER (portal)
 * @param reason - Optional reason (required for REJECT, RETURN)
 * @returns The updated quotation
 * 
 * @example
 * // Dev B (Portal) calls this when customer confirms:
 * const quotation = await transitionQuotation(
 *   quotationId,
 *   'CONFIRM',
 *   customerId,
 *   'CUSTOMER'
 * );
 * 
 * @example
 * // Dev B (Portal) calls this for counter-discount:
 * const quotation = await transitionQuotation(
 *   quotationId,
 *   'CUSTOMER_COUNTER',
 *   customerId,
 *   'CUSTOMER',
 *   'Requesting additional 5% discount on setup service'
 * );
 */
export async function transitionQuotation(
  quotationId: string,
  action: QuotationAction,
  actorId: string,
  actorType: ActorType,
  reason?: string
): Promise<Quotation> {
  // ===========================================
  // TODO: DEV A IMPLEMENTS THIS IN PHASE 1-2
  // ===========================================
  //
  // State Machine Rules:
  //
  // DRAFT:
  //   CONFIRM → evaluate_quotation()
  //     → score=0 → APPROVED
  //     → score>0, !finance → PENDING_MANAGER_APPROVAL
  //     → score>0, finance → PENDING_MANAGER_APPROVAL (finance comes after)
  //   CANCEL → CANCELLED
  //
  // PENDING_MANAGER_APPROVAL:
  //   APPROVE → (if finance required) PENDING_FINANCE_APPROVAL
  //           → (else) APPROVED
  //   REJECT → REJECTED
  //   RETURN → DRAFT
  //
  // PENDING_FINANCE_APPROVAL:
  //   APPROVE → APPROVED
  //   REJECT → REJECTED
  //
  // APPROVED:
  //   CONFIRM → CONFIRMED (triggers fulfillment + billing)
  //   CANCEL → CANCELLED
  //
  // CONFIRMED:
  //   CUSTOMER_COUNTER → re-evaluate → may route back to PENDING_*
  //
  // Implementation steps:
  // 1. Fetch current quotation
  // 2. Validate action is allowed from current status
  // 3. Determine new status based on action + risk score
  // 4. Update quotation status
  // 5. Create approval record if needed
  // 6. Emit appropriate event
  // 7. Log to audit trail
  // ===========================================

  // Fetch current quotation
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      customer: true,
      lines: { include: { product: true } },
    },
  });

  if (!quotation) {
    throw new QuotationError('NOT_FOUND', `Quotation not found: ${quotationId}`);
  }

  const previousStatus = quotation.status;

  // STUB: Basic implementation for testing
  // TODO: Dev A implements full state machine in Phase 1-2
  console.warn('[QuotationService] Using stub implementation - Dev A to implement in Phase 1-2');

  let newStatus: QuotationStatus = quotation.status as QuotationStatus;

  switch (action) {
    case 'CONFIRM':
      if (quotation.status === 'DRAFT') {
        // Evaluate risk score
        const riskResult = await evaluateQuotation(quotationId);
        
        if (riskResult.blendedScore === 0) {
          newStatus = QuotationStatus.APPROVED;
        } else if (riskResult.requiresManager) {
          newStatus = QuotationStatus.PENDING_MANAGER_APPROVAL;
        }
        
        // Update quotation with risk score
        await prisma.quotation.update({
          where: { id: quotationId },
          data: {
            status: newStatus,
            blendedRiskScore: riskResult.blendedScore,
            lastActivityAt: new Date(),
          },
        });
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
          quotation: quotation as unknown as Quotation,
          lines: quotation.lines as unknown as QuotationLine[],
          customerId: quotation.customerId,
          confirmedBy: { id: actorId, type: actorType },
          confirmedAt: new Date(),
        });
      }
      break;

    case 'APPROVE':
      if (quotation.status === 'PENDING_MANAGER_APPROVAL') {
        // Check if finance approval is also needed
        const riskResult = await evaluateQuotation(quotationId);
        
        if (riskResult.requiresFinance) {
          newStatus = QuotationStatus.PENDING_FINANCE_APPROVAL;
        } else {
          newStatus = QuotationStatus.APPROVED;
        }
      } else if (quotation.status === 'PENDING_FINANCE_APPROVAL') {
        newStatus = QuotationStatus.APPROVED;
      }
      
      await prisma.quotation.update({
        where: { id: quotationId },
        data: {
          status: newStatus,
          lastActivityAt: new Date(),
        },
      });

      dealEvents.emit('quotation.approved', {
        quotationId,
        quotation: quotation as unknown as Quotation,
        approvalLevel: quotation.status === 'PENDING_MANAGER_APPROVAL' ? 'MANAGER' : 'FINANCE',
        approverId: actorId,
        approvedAt: new Date(),
      });
      break;

    case 'REJECT':
      newStatus = QuotationStatus.REJECTED;
      
      await prisma.quotation.update({
        where: { id: quotationId },
        data: {
          status: newStatus,
          lastActivityAt: new Date(),
        },
      });

      dealEvents.emit('quotation.rejected', {
        quotationId,
        quotation: quotation as unknown as Quotation,
        rejectedBy: actorId,
        rejectionLevel: quotation.status === 'PENDING_MANAGER_APPROVAL' ? 'MANAGER' : 'FINANCE',
        reason: reason || 'No reason provided',
        rejectedAt: new Date(),
      });
      break;

    case 'RETURN':
      newStatus = QuotationStatus.DRAFT;
      
      await prisma.quotation.update({
        where: { id: quotationId },
        data: {
          status: newStatus,
          lastActivityAt: new Date(),
        },
      });
      break;

    case 'CANCEL':
      newStatus = QuotationStatus.CANCELLED;
      
      await prisma.quotation.update({
        where: { id: quotationId },
        data: {
          status: newStatus,
          lastActivityAt: new Date(),
        },
      });
      break;

    case 'CUSTOMER_COUNTER':
      // Re-evaluate with new discount (portal will have updated the line first)
      const counterResult = await evaluateQuotation(quotationId);
      
      if (counterResult.blendedScore > 0) {
        newStatus = counterResult.requiresManager 
          ? QuotationStatus.PENDING_MANAGER_APPROVAL 
          : QuotationStatus.APPROVED;
      }
      
      await prisma.quotation.update({
        where: { id: quotationId },
        data: {
          status: newStatus,
          blendedRiskScore: counterResult.blendedScore,
          lastActivityAt: new Date(),
        },
      });

      dealEvents.emit('portal.counterDiscount', {
        quotationId,
        quotationLineId: '', // Portal will provide this
        customerId: actorId,
        requestedDiscountPct: 0, // Portal will provide this
        previousDiscountPct: 0, // Portal will provide this
        comment: reason,
        requestedAt: new Date(),
      });
      break;

    default:
      throw new QuotationError('INVALID_ACTION', `Invalid action: ${action}`);
  }

  // Emit status change event
  dealEvents.emit('quotation.statusChanged', {
    quotationId,
    previousStatus,
    newStatus,
    changedBy: { id: actorId, type: actorType },
    changedAt: new Date(),
  });

  // Fetch and return updated quotation
  const updated = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      customer: true,
      lines: { include: { product: true } },
    },
  });

  return updated as unknown as Quotation;
}

/**
 * Validate if an action is allowed from the current status
 */
export function isActionAllowed(currentStatus: QuotationStatus, action: QuotationAction): boolean {
  const allowedActions: Record<QuotationStatus, QuotationAction[]> = {
    [QuotationStatus.DRAFT]: ['CONFIRM', 'CANCEL'],
    [QuotationStatus.PENDING_MANAGER_APPROVAL]: ['APPROVE', 'REJECT', 'RETURN'],
    [QuotationStatus.PENDING_FINANCE_APPROVAL]: ['APPROVE', 'REJECT'],
    [QuotationStatus.APPROVED]: ['CONFIRM', 'CANCEL'],
    [QuotationStatus.REJECTED]: [],
    [QuotationStatus.CONFIRMED]: ['CUSTOMER_COUNTER', 'CANCEL'],
    [QuotationStatus.FULFILLING]: [],
    [QuotationStatus.BILLED]: [],
    [QuotationStatus.CANCELLED]: [],
  };

  return allowedActions[currentStatus]?.includes(action) ?? false;
}

// ===========================================
// ERROR CLASS
// ===========================================

export class QuotationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'QuotationError';
  }
}

export function isQuotationError(error: unknown): error is QuotationError {
  return error instanceof QuotationError;
}

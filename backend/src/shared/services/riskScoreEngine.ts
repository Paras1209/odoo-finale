// ===========================================
// DealFlow360 - Risk Score Engine
// ===========================================
// PHASE 0: Interface agreed upon by both developers.
// DEV A will implement the actual logic in Phase 2.
// DEV B can mock/call this interface in Portal module.
// ===========================================

import { prisma } from '../db/prisma.js';
import {
  RiskScoreResult,
  LineViolation,
  QuotationStatus,
  CustomerTier,
  ProductCategory,
} from '../types/index.js';

// ===========================================
// INTERFACE (FROZEN IN PHASE 0)
// ===========================================

/**
 * INTERSECTION POINT 1: Risk Score Evaluation
 * 
 * This function evaluates a quotation's discount violations against
 * the configured discount tiers and returns:
 * - The blended risk score
 * - The required approval status
 * - Details of each line's violation
 * 
 * AGREED INTERFACE - DO NOT CHANGE SIGNATURE
 * 
 * @param quotationId - The quotation to evaluate
 * @returns RiskScoreResult with score, status, and violations
 * 
 * @example
 * // Dev B (Portal) calls this when customer counters a discount:
 * const result = await evaluateQuotation(quotationId);
 * if (result.requiresManager || result.requiresFinance) {
 *   // Route to approval workflow
 * }
 */
export async function evaluateQuotation(quotationId: string): Promise<RiskScoreResult> {
  // ===========================================
  // TODO: DEV A IMPLEMENTS THIS IN PHASE 2
  // ===========================================
  // 
  // Implementation steps:
  // 1. Fetch quotation with lines and customer tier
  // 2. Fetch discount tiers for customer's tier
  // 3. For each line:
  //    a. Get the ceiling from discount_tiers (customer_tier + product_category)
  //    b. If line.discount_pct > ceiling, calculate overage
  //    c. Weight overage by line_total (quantity × unit_price × (1 - discount))
  // 4. Sum weighted overages = blended_risk_score
  // 5. Look up approval_chains to determine approval requirements
  // 6. Return RiskScoreResult
  //
  // VALIDATION TEST (from business rules doc):
  // Gold customer with:
  //   - Hardware line: 12% discount (allowed: 15%) → No violation
  //   - Service line: 18% discount (allowed: 10%) → 8pt overage
  // Expected: PENDING_MANAGER_APPROVAL (or higher if score > 10)
  // ===========================================

  // Stub implementation - returns no violations
  // Dev A will replace this with actual logic
  
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      customer: true,
      lines: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!quotation) {
    throw new Error(`Quotation not found: ${quotationId}`);
  }

  // STUB: Return auto-approved for now
  // TODO: Dev A implements actual risk scoring logic
  console.warn('[RiskScoreEngine] Using stub implementation - Dev A to implement in Phase 2');
  
  return {
    blendedScore: 0,
    status: QuotationStatus.APPROVED,
    requiresManager: false,
    requiresFinance: false,
    lineViolations: [],
  };
}

/**
 * Get the discount ceiling for a customer tier + product category
 * Helper function used by the risk score engine
 * 
 * @param customerTier - BRONZE, SILVER, or GOLD
 * @param category - HARDWARE, SERVICE, or SUBSCRIPTION
 * @returns The maximum allowed discount percentage
 */
export async function getDiscountCeiling(
  customerTier: CustomerTier,
  category: ProductCategory
): Promise<number> {
  const discountTier = await prisma.discountTier.findUnique({
    where: {
      customerTier_category: {
        customerTier,
        category,
      },
    },
  });

  if (!discountTier) {
    // Default to 0 if no tier configured (no discount allowed)
    console.warn(`[RiskScoreEngine] No discount tier found for ${customerTier}/${category}, defaulting to 0`);
    return 0;
  }

  return discountTier.maxDiscountPct.toNumber();
}

/**
 * Determine the approval requirements based on risk score
 * 
 * @param riskScore - The calculated blended risk score
 * @returns Object with requiresManager and requiresFinance flags
 */
export async function getApprovalRequirements(
  riskScore: number
): Promise<{ requiresManager: boolean; requiresFinance: boolean }> {
  const chain = await prisma.approvalChain.findFirst({
    where: {
      minRiskScore: { lte: riskScore },
      maxRiskScore: { gte: riskScore },
    },
  });

  if (!chain) {
    // Default: any non-zero score requires manager approval
    console.warn(`[RiskScoreEngine] No approval chain found for score ${riskScore}, using defaults`);
    return {
      requiresManager: riskScore > 0,
      requiresFinance: riskScore > 10,
    };
  }

  return {
    requiresManager: chain.requiresManager,
    requiresFinance: chain.requiresFinance,
  };
}

/**
 * Calculate the weighted overage for a single line
 * Used internally by evaluateQuotation
 * 
 * @param actualDiscount - The discount percentage applied
 * @param ceilingDiscount - The maximum allowed discount
 * @param lineTotal - The line total (for weighting)
 * @param totalOrderValue - The total order value (for normalization)
 * @returns The weighted overage contribution
 */
export function calculateWeightedOverage(
  actualDiscount: number,
  ceilingDiscount: number,
  lineTotal: number,
  totalOrderValue: number
): number {
  if (actualDiscount <= ceilingDiscount) {
    return 0;
  }

  const overage = actualDiscount - ceilingDiscount;
  const weight = totalOrderValue > 0 ? lineTotal / totalOrderValue : 1;
  
  return overage * weight;
}

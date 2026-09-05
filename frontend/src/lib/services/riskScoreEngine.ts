// ===========================================
// DealFlow360 - Risk Score Engine
// ===========================================
// Risk score calculation and approval requirements.
// ===========================================

import { prisma } from '@/lib/db';
import {
  RiskScoreResult,
  QuotationStatus,
  CustomerTier,
  ProductCategory,
} from '@/lib/types';

// ===========================================
// INTERFACE
// ===========================================

/**
 * Evaluate a quotation's discount violations against configured discount tiers
 * Returns the blended risk score, required approval status, and line violations
 */
export async function evaluateQuotation(quotationId: string): Promise<RiskScoreResult> {
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

  // TODO: Implement actual risk scoring logic
  // This is a stub implementation that auto-approves
  console.warn('[RiskScoreEngine] Using stub implementation - to be implemented');
  
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
    console.warn(`[RiskScoreEngine] No discount tier found for ${customerTier}/${category}, defaulting to 0`);
    return 0;
  }

  return discountTier.maxDiscountPct.toNumber();
}

/**
 * Determine the approval requirements based on risk score
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

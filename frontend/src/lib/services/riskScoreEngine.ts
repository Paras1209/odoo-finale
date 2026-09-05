// ===========================================
// DealFlow360 - Risk Score Engine
// ===========================================
// Risk score calculation and approval requirements.
// This is the core "self-governing" discount governance engine.
// ===========================================

import { prisma } from '@/lib/db';
import {
  RiskScoreResult,
  LineViolation,
  QuotationStatus,
  CustomerTier,
  ProductCategory,
} from '@/lib/types';

// ===========================================
// CONFIGURATION DEFAULTS
// ===========================================

// Default thresholds if no ApprovalChain config exists
const DEFAULT_MANAGER_THRESHOLD = 0; // Any violation requires manager
const DEFAULT_FINANCE_THRESHOLD = 10; // Blended score > 10 requires finance

// Default discount ceilings if no DiscountTier config exists
const DEFAULT_DISCOUNT_CEILINGS: Record<CustomerTier, Record<ProductCategory, number>> = {
  [CustomerTier.BRONZE]: {
    [ProductCategory.HARDWARE]: 5,
    [ProductCategory.SERVICE]: 5,
    [ProductCategory.SUBSCRIPTION]: 5,
  },
  [CustomerTier.SILVER]: {
    [ProductCategory.HARDWARE]: 10,
    [ProductCategory.SERVICE]: 8,
    [ProductCategory.SUBSCRIPTION]: 7,
  },
  [CustomerTier.GOLD]: {
    [ProductCategory.HARDWARE]: 15,
    [ProductCategory.SERVICE]: 10,
    [ProductCategory.SUBSCRIPTION]: 10,
  },
};

// ===========================================
// MAIN EVALUATION FUNCTION
// ===========================================

/**
 * Evaluate a quotation's discount violations against configured discount tiers.
 * 
 * Algorithm:
 * 1. For each line, check if discount exceeds the ceiling for (customer_tier, product_category)
 * 2. Calculate overage = actual_discount - ceiling_discount
 * 3. Weight the overage by line's proportion of total order value
 * 4. Sum all weighted overages to get blended risk score
 * 5. Route to appropriate approval level based on score thresholds
 * 
 * @returns RiskScoreResult with blended score, required status, and line violations
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

  const customerTier = quotation.customer.tier as CustomerTier;
  const totalOrderValue = quotation.lines.reduce(
    (sum, line) => sum + line.lineTotal.toNumber(),
    0
  );

  // Fetch all discount tiers for this customer tier (batch query)
  const discountTiers = await prisma.discountTier.findMany({
    where: { customerTier },
  });

  // Build lookup map for O(1) access
  const discountCeilingMap = new Map<ProductCategory, number>();
  for (const tier of discountTiers) {
    discountCeilingMap.set(tier.category as ProductCategory, tier.maxDiscountPct.toNumber());
  }

  // Evaluate each line
  const lineViolations: LineViolation[] = [];
  let totalWeightedOverage = 0;

  for (const line of quotation.lines) {
    const category = line.product.category as ProductCategory;
    const actualDiscount = line.discountPct.toNumber();
    const lineTotal = line.lineTotal.toNumber();

    // Get ceiling from DB or fallback to defaults
    const ceilingDiscount = discountCeilingMap.get(category) 
      ?? DEFAULT_DISCOUNT_CEILINGS[customerTier]?.[category] 
      ?? 0;

    if (actualDiscount > ceilingDiscount) {
      const overage = actualDiscount - ceilingDiscount;
      const weightedOverage = calculateWeightedOverage(
        actualDiscount,
        ceilingDiscount,
        lineTotal,
        totalOrderValue
      );

      totalWeightedOverage += weightedOverage;

      lineViolations.push({
        lineId: line.id,
        productId: line.productId,
        productName: line.product.name,
        category,
        customerTier,
        actualDiscount,
        ceilingDiscount,
        overage,
        lineTotal,
        weightedOverage,
      });
    }
  }

  // Round to 2 decimal places
  const blendedScore = Math.round(totalWeightedOverage * 100) / 100;

  // Determine approval requirements
  const { requiresManager, requiresFinance } = await getApprovalRequirements(blendedScore);

  // Determine the resulting status
  let status: QuotationStatus;
  if (blendedScore === 0) {
    // No violations - auto-approve
    status = QuotationStatus.APPROVED;
  } else if (requiresFinance) {
    // High risk - needs manager first, then finance
    status = QuotationStatus.PENDING_MANAGER_APPROVAL;
  } else if (requiresManager) {
    // Medium risk - needs manager only
    status = QuotationStatus.PENDING_MANAGER_APPROVAL;
  } else {
    // Low risk (below any threshold) - auto-approve
    status = QuotationStatus.APPROVED;
  }

  console.log(`[RiskScoreEngine] Quotation ${quotationId}: score=${blendedScore}, violations=${lineViolations.length}, status=${status}`);

  return {
    blendedScore,
    status,
    requiresManager,
    requiresFinance,
    lineViolations,
  };
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get the discount ceiling for a customer tier + product category.
 * First checks DB, then falls back to defaults.
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

  if (discountTier) {
    return discountTier.maxDiscountPct.toNumber();
  }

  // Fallback to defaults
  const defaultCeiling = DEFAULT_DISCOUNT_CEILINGS[customerTier]?.[category];
  if (defaultCeiling !== undefined) {
    return defaultCeiling;
  }

  console.warn(`[RiskScoreEngine] No discount tier found for ${customerTier}/${category}, defaulting to 0`);
  return 0;
}

/**
 * Get all discount ceilings for a customer tier (for UI display).
 */
export async function getDiscountCeilingsForTier(
  customerTier: CustomerTier
): Promise<Record<ProductCategory, number>> {
  const tiers = await prisma.discountTier.findMany({
    where: { customerTier },
  });

  const result: Record<ProductCategory, number> = {
    [ProductCategory.HARDWARE]: DEFAULT_DISCOUNT_CEILINGS[customerTier][ProductCategory.HARDWARE],
    [ProductCategory.SERVICE]: DEFAULT_DISCOUNT_CEILINGS[customerTier][ProductCategory.SERVICE],
    [ProductCategory.SUBSCRIPTION]: DEFAULT_DISCOUNT_CEILINGS[customerTier][ProductCategory.SUBSCRIPTION],
  };

  for (const tier of tiers) {
    result[tier.category as ProductCategory] = tier.maxDiscountPct.toNumber();
  }

  return result;
}

/**
 * Determine the approval requirements based on risk score.
 * Checks ApprovalChain config in DB, falls back to defaults.
 */
export async function getApprovalRequirements(
  riskScore: number
): Promise<{ requiresManager: boolean; requiresFinance: boolean }> {
  // Find matching approval chain
  const chain = await prisma.approvalChain.findFirst({
    where: {
      minRiskScore: { lte: riskScore },
      maxRiskScore: { gte: riskScore },
    },
  });

  if (chain) {
    return {
      requiresManager: chain.requiresManager,
      requiresFinance: chain.requiresFinance,
    };
  }

  // Fallback to defaults
  return {
    requiresManager: riskScore > DEFAULT_MANAGER_THRESHOLD,
    requiresFinance: riskScore > DEFAULT_FINANCE_THRESHOLD,
  };
}

/**
 * Calculate the weighted overage for a single line.
 * Weight = line's proportion of total order value.
 * This ensures big-ticket items with violations matter more than small items.
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

/**
 * Validate if a proposed discount is within ceiling for a line.
 * Useful for real-time validation in the UI.
 */
export async function validateLineDiscount(
  customerTier: CustomerTier,
  category: ProductCategory,
  proposedDiscount: number
): Promise<{ isValid: boolean; ceiling: number; overage: number }> {
  const ceiling = await getDiscountCeiling(customerTier, category);
  const overage = Math.max(0, proposedDiscount - ceiling);
  
  return {
    isValid: proposedDiscount <= ceiling,
    ceiling,
    overage,
  };
}

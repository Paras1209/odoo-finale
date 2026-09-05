// ===========================================
// DealFlow360 - Quotation Config Seed Data
// ===========================================
// DEV A's FILE: Discount Tiers, Approval Chains
// Add your quotation-related seed data here.
// ===========================================

import { PrismaClient } from '@prisma/client';

export async function seedQuotations(prisma: PrismaClient): Promise<void> {
  // ===========================================
  // DISCOUNT TIERS
  // ===========================================
  // Defines maximum discount percentage allowed per customer tier + product category
  // Based on business rules doc:
  // - Gold: Hardware 15%, Service 10%, Subscription 12%
  // - Silver: Hardware 10%, Service 7%, Subscription 8%
  // - Bronze: Hardware 5%, Service 3%, Subscription 4%

  // GOLD tier discount ceilings
  await prisma.discountTier.upsert({
    where: { customerTier_category: { customerTier: 'GOLD', category: 'HARDWARE' } },
    update: { maxDiscountPct: 15 },
    create: { customerTier: 'GOLD', category: 'HARDWARE', maxDiscountPct: 15 },
  });
  await prisma.discountTier.upsert({
    where: { customerTier_category: { customerTier: 'GOLD', category: 'SERVICE' } },
    update: { maxDiscountPct: 10 },
    create: { customerTier: 'GOLD', category: 'SERVICE', maxDiscountPct: 10 },
  });
  await prisma.discountTier.upsert({
    where: { customerTier_category: { customerTier: 'GOLD', category: 'SUBSCRIPTION' } },
    update: { maxDiscountPct: 12 },
    create: { customerTier: 'GOLD', category: 'SUBSCRIPTION', maxDiscountPct: 12 },
  });

  // SILVER tier discount ceilings
  await prisma.discountTier.upsert({
    where: { customerTier_category: { customerTier: 'SILVER', category: 'HARDWARE' } },
    update: { maxDiscountPct: 10 },
    create: { customerTier: 'SILVER', category: 'HARDWARE', maxDiscountPct: 10 },
  });
  await prisma.discountTier.upsert({
    where: { customerTier_category: { customerTier: 'SILVER', category: 'SERVICE' } },
    update: { maxDiscountPct: 7 },
    create: { customerTier: 'SILVER', category: 'SERVICE', maxDiscountPct: 7 },
  });
  await prisma.discountTier.upsert({
    where: { customerTier_category: { customerTier: 'SILVER', category: 'SUBSCRIPTION' } },
    update: { maxDiscountPct: 8 },
    create: { customerTier: 'SILVER', category: 'SUBSCRIPTION', maxDiscountPct: 8 },
  });

  // BRONZE tier discount ceilings
  await prisma.discountTier.upsert({
    where: { customerTier_category: { customerTier: 'BRONZE', category: 'HARDWARE' } },
    update: { maxDiscountPct: 5 },
    create: { customerTier: 'BRONZE', category: 'HARDWARE', maxDiscountPct: 5 },
  });
  await prisma.discountTier.upsert({
    where: { customerTier_category: { customerTier: 'BRONZE', category: 'SERVICE' } },
    update: { maxDiscountPct: 3 },
    create: { customerTier: 'BRONZE', category: 'SERVICE', maxDiscountPct: 3 },
  });
  await prisma.discountTier.upsert({
    where: { customerTier_category: { customerTier: 'BRONZE', category: 'SUBSCRIPTION' } },
    update: { maxDiscountPct: 4 },
    create: { customerTier: 'BRONZE', category: 'SUBSCRIPTION', maxDiscountPct: 4 },
  });

  console.log(`  Created discount tiers for all customer tiers and categories`);

  // ===========================================
  // APPROVAL CHAINS
  // ===========================================
  // Configurable approval routing based on blended risk score
  // Default threshold = 1 (as per user requirement)
  //
  // Risk Score Ranges:
  // - 0 (no violations): Auto-approved, no approval needed
  // - 1-10: Requires Sales Manager approval only
  // - 11+: Requires Sales Manager THEN Finance approval

  // No violations - auto-approve
  await prisma.approvalChain.upsert({
    where: { id: 'chain-auto-approve' },
    update: {},
    create: {
      id: 'chain-auto-approve',
      minRiskScore: 0,
      maxRiskScore: 0,
      requiresManager: false,
      requiresFinance: false,
    },
  });

  // Low risk - manager only (threshold starts at 1)
  await prisma.approvalChain.upsert({
    where: { id: 'chain-manager-only' },
    update: {},
    create: {
      id: 'chain-manager-only',
      minRiskScore: 1,
      maxRiskScore: 10,
      requiresManager: true,
      requiresFinance: false,
    },
  });

  // High risk - manager + finance
  await prisma.approvalChain.upsert({
    where: { id: 'chain-manager-finance' },
    update: {},
    create: {
      id: 'chain-manager-finance',
      minRiskScore: 11,
      maxRiskScore: 999999, // Effectively unlimited
      requiresManager: true,
      requiresFinance: true,
    },
  });

  console.log(`  Created approval chains (threshold = 1)`);
  console.log(`
  Approval Chain Configuration:
  -----------------------------
  Risk Score 0:       Auto-approved (no violations)
  Risk Score 1-10:    Requires Manager approval
  Risk Score 11+:     Requires Manager + Finance approval
  
  Discount Tier Configuration:
  ----------------------------
  | Tier   | Hardware | Service | Subscription |
  |--------|----------|---------|--------------|
  | Gold   | 15%      | 10%     | 12%          |
  | Silver | 10%      | 7%      | 8%           |
  | Bronze | 5%       | 3%      | 4%           |
  `);
}

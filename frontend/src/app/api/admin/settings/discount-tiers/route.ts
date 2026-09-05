// ===========================================
// DealFlow360 - Admin Discount Tiers API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, UserRole, CustomerTier, ProductCategory } from '@/lib/types';
import { createDiscountTierSchema } from '@/lib/validators';

// GET /api/admin/settings/discount-tiers - List all discount tiers
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Only ADMIN and SALES_MANAGER can view settings
    if (![UserRole.ADMIN, UserRole.SALES_MANAGER].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin or Manager access required' } },
        { status: 403 }
      );
    }

    const discountTiers = await prisma.discountTier.findMany({
      orderBy: [
        { customerTier: 'asc' },
        { category: 'asc' },
      ],
    });

    // Transform to include all possible combinations with defaults
    const allCombinations = generateAllCombinations(discountTiers);

    return NextResponse.json({
      success: true,
      data: allCombinations,
    });
  } catch (error) {
    console.error('[Admin/DiscountTiers] GET Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings/discount-tiers - Create or update discount tier
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createDiscountTierSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
        { status: 400 }
      );
    }

    const { customerTier, category, maxDiscountPct } = parsed.data;

    const discountTier = await prisma.discountTier.upsert({
      where: {
        customerTier_category: { customerTier, category },
      },
      update: { maxDiscountPct },
      create: { customerTier, category, maxDiscountPct },
    });

    return NextResponse.json({
      success: true,
      data: discountTier,
      message: 'Discount tier saved successfully',
    });
  } catch (error) {
    console.error('[Admin/DiscountTiers] POST Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// Helper to generate all tier/category combinations with defaults
function generateAllCombinations(existingTiers: any[]) {
  const tierMap = new Map<string, any>();
  
  // Build lookup from existing tiers
  for (const tier of existingTiers) {
    tierMap.set(`${tier.customerTier}-${tier.category}`, {
      id: tier.id,
      customerTier: tier.customerTier,
      category: tier.category,
      maxDiscountPct: tier.maxDiscountPct.toNumber(),
      isDefault: false,
    });
  }

  // Default discount ceilings
  const defaults: Record<string, Record<string, number>> = {
    [CustomerTier.GOLD]: { [ProductCategory.HARDWARE]: 15, [ProductCategory.SERVICE]: 10, [ProductCategory.SUBSCRIPTION]: 12 },
    [CustomerTier.SILVER]: { [ProductCategory.HARDWARE]: 10, [ProductCategory.SERVICE]: 7, [ProductCategory.SUBSCRIPTION]: 8 },
    [CustomerTier.BRONZE]: { [ProductCategory.HARDWARE]: 5, [ProductCategory.SERVICE]: 3, [ProductCategory.SUBSCRIPTION]: 4 },
  };

  const result = [];
  const tiers = [CustomerTier.GOLD, CustomerTier.SILVER, CustomerTier.BRONZE];
  const categories = [ProductCategory.HARDWARE, ProductCategory.SERVICE, ProductCategory.SUBSCRIPTION];

  for (const customerTier of tiers) {
    for (const category of categories) {
      const key = `${customerTier}-${category}`;
      if (tierMap.has(key)) {
        result.push(tierMap.get(key));
      } else {
        result.push({
          id: null,
          customerTier,
          category,
          maxDiscountPct: defaults[customerTier]?.[category] ?? 5,
          isDefault: true,
        });
      }
    }
  }

  return result;
}

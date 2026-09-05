// ===========================================
// DealFlow360 - Upsell Suggestions API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType } from '@/lib/types';

// GET /api/upsell/suggestions - Get upsell suggestions
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productIdsParam = searchParams.get('productIds');

    if (!productIdsParam) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'productIds parameter is required' } },
        { status: 400 }
      );
    }

    const productIds = productIdsParam.split(',');

    // Find product pairings for the given products
    const pairings = await prisma.productPairing.findMany({
      where: {
        productId: { in: productIds },
        suggestedProductId: { notIn: productIds },
      },
      include: {
        suggestedProduct: true,
      },
      orderBy: [{ weight: 'desc' }, { isPromoted: 'desc' }],
      take: 10,
    });

    // Deduplicate by suggested product ID
    const seen = new Set<string>();
    const suggestions = [];

    for (const pairing of pairings) {
      if (!seen.has(pairing.suggestedProductId)) {
        seen.add(pairing.suggestedProductId);
        const product = pairing.suggestedProduct;
        const marginDelta = product.salePrice.toNumber() - product.costPrice.toNumber();
        const marginPct = product.salePrice.toNumber() > 0 
          ? (marginDelta / product.salePrice.toNumber()) * 100 
          : 0;

        suggestions.push({
          productId: product.id,
          productName: product.name,
          category: product.category,
          salePrice: product.salePrice.toNumber(),
          marginDelta,
          marginPct,
          isPromoted: pairing.isPromoted,
          weight: pairing.weight.toNumber(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('[Upsell/Suggestions] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

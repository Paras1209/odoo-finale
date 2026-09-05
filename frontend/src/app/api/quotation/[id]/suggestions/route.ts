import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id: quotationId } = await params;

    // Get current products in quotation
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      select: { lines: { select: { productId: true } } },
    });

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Quotation not found' } },
        { status: 404 }
      );
    }

    const currentProductIds = quotation.lines.map(l => l.productId);

    if (currentProductIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Find pairings
    const pairings = await prisma.productPairing.findMany({
      where: {
        productId: { in: currentProductIds },
        suggestedProductId: { notIn: currentProductIds },
        suggestedProduct: { isActive: true },
      },
      include: {
        suggestedProduct: {
          select: { id: true, name: true, salePrice: true, category: true },
        },
      },
      orderBy: { weight: 'desc' },
      take: 5,
    });

    // Deduplicate suggestions (in case multiple products suggest the same thing)
    const uniqueSuggestions = new Map();
    for (const pair of pairings) {
      if (!uniqueSuggestions.has(pair.suggestedProductId)) {
        uniqueSuggestions.set(pair.suggestedProductId, pair.suggestedProduct);
      }
    }

    const data = Array.from(uniqueSuggestions.values());

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Quotation/Suggestions] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// ===========================================
// DealFlow360 - Price Lists API
// ===========================================
// DEV B's MODULE: Price list management
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ActorType, UserRole, CustomerTier } from '@/lib/types';
import { getPriceLists, createPriceList } from '@/lib/services';
import { auditLogger } from '@/lib/services';
import { createPriceListSchema, paginationSchema } from '@/lib/validators';

// GET /api/catalog/price-lists - List price lists
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
    
    // Build pagination params, only including values that exist
    const paginationInput: Record<string, string | undefined> = {};
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    const sortByParam = searchParams.get('sortBy');
    const sortOrderParam = searchParams.get('sortOrder');
    
    if (pageParam) paginationInput.page = pageParam;
    if (pageSizeParam) paginationInput.pageSize = pageSizeParam;
    if (sortByParam) paginationInput.sortBy = sortByParam;
    if (sortOrderParam) paginationInput.sortOrder = sortOrderParam;
    
    const pagination = paginationSchema.parse(paginationInput);

    const customerTierParam = searchParams.get('customerTier');
    const isActiveParam = searchParams.get('isActive');

    const filters = {
      ...(customerTierParam && { customerTier: customerTierParam as CustomerTier }),
      ...(isActiveParam && { isActive: isActiveParam === 'true' }),
    };

    const result = await getPriceLists(filters, pagination);

    return NextResponse.json({
      success: true,
      data: result.data.map(pl => ({
        id: pl.id,
        name: pl.name,
        customerTier: pl.customerTier,
        currency: pl.currency,
        isDefault: pl.isDefault,
        validFrom: pl.validFrom?.toISOString() || null,
        validTo: pl.validTo?.toISOString() || null,
        isActive: pl.isActive,
        itemCount: pl._count.items,
        createdAt: pl.createdAt.toISOString(),
        updatedAt: pl.updatedAt.toISOString(),
      })),
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('[Catalog/PriceLists/List] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// POST /api/catalog/price-lists - Create price list
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can create price lists' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createPriceListSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const priceList = await createPriceList({
      name: parsed.data.name,
      customerTier: parsed.data.customerTier as CustomerTier | undefined,
      currency: parsed.data.currency,
      isDefault: parsed.data.isDefault,
      validFrom: parsed.data.validFrom ? new Date(parsed.data.validFrom) : undefined,
      validTo: parsed.data.validTo ? new Date(parsed.data.validTo) : undefined,
    });

    await auditLogger.logCreate(session.user.id, ActorType.INTERNAL, 'PRICE_LIST', priceList.id, {
      name: priceList.name,
      customerTier: priceList.customerTier,
      isDefault: priceList.isDefault,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: priceList.id,
          name: priceList.name,
          customerTier: priceList.customerTier,
          currency: priceList.currency,
          isDefault: priceList.isDefault,
          validFrom: priceList.validFrom?.toISOString() || null,
          validTo: priceList.validTo?.toISOString() || null,
          isActive: priceList.isActive,
          createdAt: priceList.createdAt.toISOString(),
        },
        message: 'Price list created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Catalog/PriceLists/Create] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

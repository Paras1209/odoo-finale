// ===========================================
// DealFlow360 - Price List Detail API
// ===========================================
// DEV B's MODULE: Price list detail, update, delete
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ActorType, UserRole, CustomerTier } from '@/lib/types';
import { getPriceListById, updatePriceList, deletePriceList } from '@/lib/services';
import { auditLogger } from '@/lib/services';
import { updatePriceListSchema } from '@/lib/validators';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/catalog/price-lists/[id] - Get price list details with items
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;

    const priceList = await getPriceListById(id);

    if (!priceList) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Price list not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
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
        updatedAt: priceList.updatedAt.toISOString(),
        items: priceList.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          productSku: item.product.sku,
          productCategory: item.product.category,
          basePrice: item.product.salePrice.toNumber(),
          listPrice: item.price.toNumber(),
          productActive: item.product.isActive,
        })),
      },
    });
  } catch (error) {
    console.error('[Catalog/PriceLists/Get] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// PUT /api/catalog/price-lists/[id] - Update price list
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can update price lists' } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updatePriceListSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const existing = await getPriceListById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Price list not found' } },
        { status: 404 }
      );
    }

    const priceList = await updatePriceList(id, {
      name: parsed.data.name,
      customerTier: parsed.data.customerTier as CustomerTier | undefined,
      currency: parsed.data.currency,
      isDefault: parsed.data.isDefault,
      validFrom: parsed.data.validFrom ? new Date(parsed.data.validFrom) : parsed.data.validFrom === null ? null : undefined,
      validTo: parsed.data.validTo ? new Date(parsed.data.validTo) : parsed.data.validTo === null ? null : undefined,
      isActive: parsed.data.isActive,
    });

    await auditLogger.logUpdate(
      session.user.id,
      ActorType.INTERNAL,
      'PRICE_LIST',
      id,
      { name: existing.name, isDefault: existing.isDefault },
      { name: priceList!.name, isDefault: priceList!.isDefault }
    );

    return NextResponse.json({
      success: true,
      data: {
        id: priceList!.id,
        name: priceList!.name,
        customerTier: priceList!.customerTier,
        currency: priceList!.currency,
        isDefault: priceList!.isDefault,
        validFrom: priceList!.validFrom?.toISOString() || null,
        validTo: priceList!.validTo?.toISOString() || null,
        isActive: priceList!.isActive,
        updatedAt: priceList!.updatedAt.toISOString(),
      },
      message: 'Price list updated successfully',
    });
  } catch (error) {
    console.error('[Catalog/PriceLists/Update] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// DELETE /api/catalog/price-lists/[id] - Deactivate price list
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can deactivate price lists' } },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await getPriceListById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Price list not found' } },
        { status: 404 }
      );
    }

    await deletePriceList(id);

    await auditLogger.logUpdate(
      session.user.id,
      ActorType.INTERNAL,
      'PRICE_LIST',
      id,
      { isActive: true },
      { isActive: false },
      'Price list deactivated'
    );

    return NextResponse.json({
      success: true,
      message: 'Price list deactivated successfully',
    });
  } catch (error) {
    console.error('[Catalog/PriceLists/Deactivate] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

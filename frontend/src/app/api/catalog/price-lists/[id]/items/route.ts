// ===========================================
// DealFlow360 - Price List Items API
// ===========================================
// DEV B's MODULE: Manage items within a price list
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ActorType, UserRole } from '@/lib/types';
import { upsertPriceListItems, getPriceListById } from '@/lib/services';
import { auditLogger } from '@/lib/services';
import { prisma } from '@/lib/db';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Validation schema for upserting price list items
const upsertItemsSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product ID is required'),
      price: z.number().min(0, 'Price must be non-negative'),
    })
  ).min(1, 'At least one item is required'),
});

// DELETE items schema
const deleteItemsSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1, 'At least one product ID is required'),
});

// POST /api/catalog/price-lists/[id]/items - Upsert items in price list
export async function POST(request: NextRequest, { params }: RouteParams) {
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can manage price list items' } },
        { status: 403 }
      );
    }

    const { id: priceListId } = await params;
    const body = await request.json();
    const parsed = upsertItemsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    // Check if price list exists
    const priceList = await getPriceListById(priceListId);
    if (!priceList) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Price list not found' } },
        { status: 404 }
      );
    }

    const result = await upsertPriceListItems(priceListId, parsed.data.items);

    if (result === null) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Price list not found' } },
        { status: 404 }
      );
    }

    const itemCount = result.length;

    await auditLogger.logUpdate(
      session.user.id,
      ActorType.INTERNAL,
      'PRICE_LIST',
      priceListId,
      {},
      { itemsUpserted: itemCount },
      `Upserted ${itemCount} items in price list`
    );

    return NextResponse.json({
      success: true,
      data: {
        priceListId,
        itemsUpserted: itemCount,
      },
      message: `Successfully upserted ${itemCount} price list items`,
    });
  } catch (error) {
    console.error('[Catalog/PriceListItems/Upsert] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// DELETE /api/catalog/price-lists/[id]/items - Remove items from price list
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can manage price list items' } },
        { status: 403 }
      );
    }

    const { id: priceListId } = await params;
    const body = await request.json();
    const parsed = deleteItemsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    // Check if price list exists
    const priceList = await getPriceListById(priceListId);
    if (!priceList) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Price list not found' } },
        { status: 404 }
      );
    }

    // Import prisma for direct delete
    
    const result = await prisma.priceListItem.deleteMany({
      where: {
        priceListId,
        productId: { in: parsed.data.productIds },
      },
    });

    await auditLogger.logUpdate(
      session.user.id,
      ActorType.INTERNAL,
      'PRICE_LIST',
      priceListId,
      {},
      { itemsRemoved: result.count },
      `Removed ${result.count} items from price list`
    );

    return NextResponse.json({
      success: true,
      data: {
        priceListId,
        itemsRemoved: result.count,
      },
      message: `Successfully removed ${result.count} price list items`,
    });
  } catch (error) {
    console.error('[Catalog/PriceListItems/Delete] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

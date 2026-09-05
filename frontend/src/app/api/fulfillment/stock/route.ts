// ===========================================
// DealFlow360 - Stock Levels API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType } from '@/lib/types';

// GET /api/fulfillment/stock - Get stock levels
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
    const productId = searchParams.get('productId');
    const warehouseId = searchParams.get('warehouseId');

    const where = {
      ...(productId && { productId }),
      ...(warehouseId && { warehouseId }),
    };

    const stockLevels = await prisma.stockLevel.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        product: { select: { id: true, name: true, sku: true } },
      },
      orderBy: [{ warehouse: { name: 'asc' } }, { product: { name: 'asc' } }],
    });

    return NextResponse.json({
      success: true,
      data: stockLevels.map(sl => ({
        id: sl.id,
        warehouseId: sl.warehouseId,
        warehouseName: sl.warehouse.name,
        warehouseCode: sl.warehouse.code,
        productId: sl.productId,
        productName: sl.product.name,
        productSku: sl.product.sku,
        quantityAvailable: sl.quantityAvailable,
        quantityReserved: sl.quantityReserved,
        quantityOnHand: sl.quantityAvailable - sl.quantityReserved,
        reorderPoint: sl.reorderPoint,
        updatedAt: sl.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[Fulfillment/Stock/List] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

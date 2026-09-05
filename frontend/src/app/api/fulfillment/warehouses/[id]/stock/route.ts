// ===========================================
// DealFlow360 - Warehouse Stock API
// ===========================================
// DEV B's MODULE: Stock levels for a specific warehouse
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ActorType } from '@/lib/types';
import { getWarehouseById, getWarehouseStockLevels } from '@/lib/services';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/fulfillment/warehouses/[id]/stock - Get stock levels for a warehouse
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id: warehouseId } = await params;
    
    // Verify warehouse exists
    const warehouse = await getWarehouseById(warehouseId);
    if (!warehouse) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Warehouse not found' } },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Build pagination params
    const paginationInput: Record<string, string | number> = {};
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    const sortByParam = searchParams.get('sortBy');
    const sortOrderParam = searchParams.get('sortOrder');
    
    if (pageParam) paginationInput.page = parseInt(pageParam);
    if (pageSizeParam) paginationInput.pageSize = parseInt(pageSizeParam);
    if (sortByParam) paginationInput.sortBy = sortByParam;
    if (sortOrderParam) paginationInput.sortOrder = sortOrderParam as 'asc' | 'desc';

    const result = await getWarehouseStockLevels(warehouseId, paginationInput);

    return NextResponse.json({
      success: true,
      data: {
        warehouse: {
          id: warehouse.id,
          name: warehouse.name,
          code: warehouse.code,
        },
        stockLevels: result.data.map(sl => ({
          id: sl.id,
          productId: sl.productId,
          productName: sl.product.name,
          productSku: sl.product.sku,
          productCategory: sl.product.category,
          productPrice: sl.product.salePrice.toNumber(),
          quantityAvailable: sl.quantityAvailable,
          quantityReserved: sl.quantityReserved,
          reorderPoint: sl.reorderPoint,
          isLowStock: sl.reorderPoint !== null && sl.quantityAvailable <= sl.reorderPoint,
          updatedAt: sl.updatedAt.toISOString(),
        })),
      },
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('[Fulfillment/Warehouse/Stock] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

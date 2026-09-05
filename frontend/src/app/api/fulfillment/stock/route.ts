// ===========================================
// DealFlow360 - Stock Levels API
// ===========================================
// DEV B's MODULE: Stock management across warehouses
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ActorType, UserRole } from '@/lib/types';
import { 
  getProductStockLevels, 
  upsertStockLevel, 
  bulkUpsertStockLevels,
  getLowStockAlerts,
  auditLogger 
} from '@/lib/services';
import { z } from 'zod';

// Validation schemas
const upsertStockSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  productId: z.string().min(1, 'Product ID is required'),
  quantityAvailable: z.number().int().min(0, 'Quantity must be non-negative'),
  reorderPoint: z.number().int().min(0).optional().nullable(),
});

const bulkUpsertStockSchema = z.object({
  updates: z.array(upsertStockSchema).min(1, 'At least one update is required'),
});

// GET /api/fulfillment/stock - Get stock levels (with optional filters)
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
    const lowStockOnly = searchParams.get('lowStock') === 'true';
    const warehouseId = searchParams.get('warehouseId');

    // If requesting low stock alerts
    if (lowStockOnly) {
      const alerts = await getLowStockAlerts(warehouseId || undefined);
      return NextResponse.json({
        success: true,
        data: alerts.map(sl => ({
          id: sl.id,
          warehouseId: sl.warehouseId,
          warehouseName: sl.warehouse.name,
          warehouseCode: sl.warehouse.code,
          productId: sl.productId,
          productName: sl.product.name,
          productSku: sl.product.sku,
          productCategory: sl.product.category,
          quantityAvailable: sl.quantityAvailable,
          reorderPoint: sl.reorderPoint,
          shortfall: (sl.reorderPoint ?? 0) - sl.quantityAvailable,
        })),
      });
    }

    // If requesting stock for a specific product
    if (productId) {
      const stockLevels = await getProductStockLevels(productId);
      return NextResponse.json({
        success: true,
        data: stockLevels.map(sl => ({
          id: sl.id,
          warehouseId: sl.warehouseId,
          warehouseName: sl.warehouse.name,
          warehouseCode: sl.warehouse.code,
          warehouseActive: sl.warehouse.isActive,
          productId: sl.productId,
          quantityAvailable: sl.quantityAvailable,
          quantityReserved: sl.quantityReserved,
          reorderPoint: sl.reorderPoint,
          updatedAt: sl.updatedAt.toISOString(),
        })),
      });
    }

    return NextResponse.json(
      { success: false, error: { code: 'INVALID_REQUEST', message: 'Provide productId or lowStock=true' } },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Fulfillment/Stock/Get] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// POST /api/fulfillment/stock - Upsert single stock level
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Only admins and finance can update stock
    if (![UserRole.ADMIN, UserRole.FINANCE_OPS].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only admins and finance can update stock levels' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = upsertStockSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const stockLevel = await upsertStockLevel({
      warehouseId: parsed.data.warehouseId,
      productId: parsed.data.productId,
      quantityAvailable: parsed.data.quantityAvailable,
      reorderPoint: parsed.data.reorderPoint ?? undefined,
    });

    await auditLogger.logUpdate(
      session.user.id,
      ActorType.INTERNAL,
      'STOCK_LEVEL',
      stockLevel.id,
      {},
      {
        warehouseId: stockLevel.warehouseId,
        productId: stockLevel.productId,
        quantityAvailable: stockLevel.quantityAvailable,
        reorderPoint: stockLevel.reorderPoint,
      },
      'Stock level updated'
    );

    return NextResponse.json({
      success: true,
      data: {
        id: stockLevel.id,
        warehouseId: stockLevel.warehouseId,
        warehouseName: stockLevel.warehouse.name,
        warehouseCode: stockLevel.warehouse.code,
        productId: stockLevel.productId,
        productName: stockLevel.product.name,
        productSku: stockLevel.product.sku,
        quantityAvailable: stockLevel.quantityAvailable,
        reorderPoint: stockLevel.reorderPoint,
      },
      message: 'Stock level updated successfully',
    });
  } catch (error) {
    console.error('[Fulfillment/Stock/Upsert] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// PUT /api/fulfillment/stock - Bulk upsert stock levels
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Only admins and finance can update stock
    if (![UserRole.ADMIN, UserRole.FINANCE_OPS].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only admins and finance can update stock levels' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = bulkUpsertStockSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const results = await bulkUpsertStockLevels(
      parsed.data.updates.map(u => ({
        warehouseId: u.warehouseId,
        productId: u.productId,
        quantityAvailable: u.quantityAvailable,
        reorderPoint: u.reorderPoint ?? undefined,
      }))
    );

    await auditLogger.logUpdate(
      session.user.id,
      ActorType.INTERNAL,
      'STOCK_LEVEL',
      'BULK',
      {},
      { updatedCount: results.length },
      `Bulk stock update: ${results.length} levels`
    );

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: results.length,
      },
      message: `Successfully updated ${results.length} stock levels`,
    });
  } catch (error) {
    console.error('[Fulfillment/Stock/BulkUpsert] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

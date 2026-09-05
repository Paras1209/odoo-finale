// ===========================================
// DealFlow360 - Warehouse Detail API
// ===========================================
// DEV B's MODULE: Single warehouse operations
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ActorType, UserRole } from '@/lib/types';
import { getWarehouseById, updateWarehouse, deactivateWarehouse, getWarehouseByCode, auditLogger, type UpdateWarehouseInput } from '@/lib/services';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Validation schema
const updateWarehouseSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).max(10).optional(),
  address: z.string().optional().nullable(),
  shippingCostWeight: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/fulfillment/warehouses/[id] - Get warehouse details
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
    const warehouse = await getWarehouseById(id);

    if (!warehouse) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Warehouse not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: warehouse.id,
        name: warehouse.name,
        code: warehouse.code,
        address: warehouse.address,
        shippingCostWeight: warehouse.shippingCostWeight.toNumber(),
        isActive: warehouse.isActive,
        fulfillmentCount: warehouse._count.fulfillmentSplits,
        stockLevels: warehouse.stockLevels.map(sl => ({
          id: sl.id,
          productId: sl.productId,
          productName: sl.product.name,
          productSku: sl.product.sku,
          productCategory: sl.product.category,
          quantityAvailable: sl.quantityAvailable,
          quantityReserved: sl.quantityReserved,
          reorderPoint: sl.reorderPoint,
        })),
        createdAt: warehouse.createdAt.toISOString(),
        updatedAt: warehouse.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Fulfillment/Warehouses/Get] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// PUT /api/fulfillment/warehouses/[id] - Update warehouse
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can update warehouses' } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await getWarehouseById(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Warehouse not found' } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateWarehouseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    // Check if new code is unique (if changing)
    if (parsed.data.code && parsed.data.code.toUpperCase() !== existing.code) {
      const codeExists = await getWarehouseByCode(parsed.data.code.toUpperCase());
      if (codeExists) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE_CODE', message: 'A warehouse with this code already exists' } },
          { status: 409 }
        );
      }
    }

    const beforeState = {
      name: existing.name,
      code: existing.code,
      address: existing.address,
      shippingCostWeight: existing.shippingCostWeight.toNumber(),
      isActive: existing.isActive,
    };

    // Transform parsed data to match UpdateWarehouseInput (handle undefined vs null)
    const updateData: UpdateWarehouseInput = {
      name: parsed.data.name,
      code: parsed.data.code,
      address: parsed.data.address ?? undefined,
      shippingCostWeight: parsed.data.shippingCostWeight,
      isActive: parsed.data.isActive,
    };

    const warehouse = await updateWarehouse(id, updateData);

    await auditLogger.logUpdate(
      session.user.id,
      ActorType.INTERNAL,
      'WAREHOUSE',
      warehouse.id,
      beforeState,
      {
        name: warehouse.name,
        code: warehouse.code,
        address: warehouse.address,
        shippingCostWeight: warehouse.shippingCostWeight.toNumber(),
        isActive: warehouse.isActive,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        id: warehouse.id,
        name: warehouse.name,
        code: warehouse.code,
        address: warehouse.address,
        shippingCostWeight: warehouse.shippingCostWeight.toNumber(),
        isActive: warehouse.isActive,
        updatedAt: warehouse.updatedAt.toISOString(),
      },
      message: 'Warehouse updated successfully',
    });
  } catch (error) {
    console.error('[Fulfillment/Warehouses/Update] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// DELETE /api/fulfillment/warehouses/[id] - Deactivate warehouse (soft delete)
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can deactivate warehouses' } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await getWarehouseById(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Warehouse not found' } },
        { status: 404 }
      );
    }

    if (!existing.isActive) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_INACTIVE', message: 'Warehouse is already inactive' } },
        { status: 400 }
      );
    }

    await deactivateWarehouse(id);

    await auditLogger.logUpdate(
      session.user.id,
      ActorType.INTERNAL,
      'WAREHOUSE',
      id,
      { isActive: true },
      { isActive: false },
      'Warehouse deactivated'
    );

    return NextResponse.json({
      success: true,
      message: 'Warehouse deactivated successfully',
    });
  } catch (error) {
    console.error('[Fulfillment/Warehouses/Delete] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

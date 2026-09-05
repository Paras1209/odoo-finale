// ===========================================
// DealFlow360 - Warehouses API
// ===========================================
// DEV B's MODULE: Warehouse management
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ActorType, UserRole } from '@/lib/types';
import { getWarehouses, createWarehouse, getWarehouseByCode, auditLogger } from '@/lib/services';
import { z } from 'zod';

// Validation schemas
const createWarehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required'),
  code: z.string().min(1, 'Warehouse code is required').max(10, 'Code must be 10 characters or less'),
  address: z.string().optional(),
  shippingCostWeight: z.number().min(0).max(100).default(1),
});

// GET /api/fulfillment/warehouses - List warehouses
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

    // Build filters
    const isActiveParam = searchParams.get('isActive');
    const searchParam = searchParams.get('search');

    const filters = {
      ...(isActiveParam && { isActive: isActiveParam === 'true' }),
      ...(searchParam && { search: searchParam }),
    };

    const result = await getWarehouses(filters, paginationInput);

    return NextResponse.json({
      success: true,
      data: result.data.map(wh => ({
        id: wh.id,
        name: wh.name,
        code: wh.code,
        address: wh.address,
        shippingCostWeight: wh.shippingCostWeight.toNumber(),
        isActive: wh.isActive,
        stockLevelCount: wh._count.stockLevels,
        fulfillmentCount: wh._count.fulfillmentSplits,
        createdAt: wh.createdAt.toISOString(),
        updatedAt: wh.updatedAt.toISOString(),
      })),
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('[Fulfillment/Warehouses/List] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// POST /api/fulfillment/warehouses - Create warehouse
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Only admins can create warehouses
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can create warehouses' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createWarehouseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    // Check if code is unique
    const existing = await getWarehouseByCode(parsed.data.code.toUpperCase());
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_CODE', message: 'A warehouse with this code already exists' } },
        { status: 409 }
      );
    }

    const warehouse = await createWarehouse(parsed.data);

    await auditLogger.logCreate(session.user.id, ActorType.INTERNAL, 'WAREHOUSE', warehouse.id, {
      name: warehouse.name,
      code: warehouse.code,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: warehouse.id,
          name: warehouse.name,
          code: warehouse.code,
          address: warehouse.address,
          shippingCostWeight: warehouse.shippingCostWeight.toNumber(),
          isActive: warehouse.isActive,
          createdAt: warehouse.createdAt.toISOString(),
        },
        message: 'Warehouse created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Fulfillment/Warehouses/Create] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

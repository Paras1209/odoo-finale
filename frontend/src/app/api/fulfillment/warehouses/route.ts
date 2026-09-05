// ===========================================
// DealFlow360 - Warehouses API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, UserRole } from '@/lib/types';
import { createWarehouseSchema } from '@/lib/validators';
import { auditLogger } from '@/lib/services';

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
    const isActive = searchParams.get('isActive');

    const warehouses = await prisma.warehouse.findMany({
      where: isActive !== null ? { isActive: isActive === 'true' } : {},
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: warehouses.map(w => ({
        id: w.id,
        name: w.name,
        code: w.code,
        address: w.address,
        shippingCostWeight: w.shippingCostWeight.toNumber(),
        isActive: w.isActive,
        createdAt: w.createdAt.toISOString(),
      })),
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

    const warehouse = await prisma.warehouse.create({
      data: parsed.data,
    });

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

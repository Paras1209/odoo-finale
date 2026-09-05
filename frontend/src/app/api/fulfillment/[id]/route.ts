// ===========================================
// DealFlow360 - Fulfillment Detail API
// ===========================================
// DEV B's MODULE: Single fulfillment operations
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ActorType, UserRole } from '@/lib/types';
import { FulfillmentStatus } from '@prisma/client';
import { 
  getFulfillmentSplitById,
  transitionFulfillmentStatus,
  cancelFulfillment,
  auditLogger,
} from '@/lib/services';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Validation schema for status transition
const transitionSchema = z.object({
  status: z.enum(['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  actualShipDate: z.string().datetime().optional(),
});

// GET /api/fulfillment/[id] - Get fulfillment split details
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
    const split = await getFulfillmentSplitById(id);

    if (!split) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Fulfillment split not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: split.id,
        quotationLineId: split.quotationLineId,
        warehouseId: split.warehouseId,
        warehouse: {
          id: split.warehouse.id,
          name: split.warehouse.name,
          code: split.warehouse.code,
          address: split.warehouse.address,
        },
        quantityFulfilled: split.quantityFulfilled,
        isBackorder: split.isBackorder,
        isManualOverride: split.isManualOverride,
        estimatedShipDate: split.estimatedShipDate?.toISOString() || null,
        actualShipDate: split.actualShipDate?.toISOString() || null,
        status: split.status,
        product: {
          id: split.quotationLine.product.id,
          name: split.quotationLine.product.name,
          sku: split.quotationLine.product.sku,
          category: split.quotationLine.product.category,
        },
        quotation: {
          id: split.quotationLine.quotation.id,
          quotationNumber: split.quotationLine.quotation.quotationNumber,
          status: split.quotationLine.quotation.status,
          customer: {
            id: split.quotationLine.quotation.customer.id,
            name: split.quotationLine.quotation.customer.name,
            companyName: split.quotationLine.quotation.customer.companyName,
          },
          rep: split.quotationLine.quotation.rep,
        },
        lineQuantity: split.quotationLine.quantity,
        lineUnitPrice: split.quotationLine.unitPrice.toNumber(),
        lineTotal: split.quotationLine.lineTotal.toNumber(),
        createdAt: split.createdAt.toISOString(),
        updatedAt: split.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Fulfillment/Get] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// PUT /api/fulfillment/[id] - Transition fulfillment status
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const split = await getFulfillmentSplitById(id);

    if (!split) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Fulfillment split not found' } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = transitionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const newStatus = parsed.data.status as FulfillmentStatus;
    const beforeStatus = split.status;

    // Handle cancellation separately (releases stock)
    if (newStatus === 'CANCELLED') {
      const result = await cancelFulfillment(id);
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: { code: 'TRANSITION_ERROR', message: result.error } },
          { status: 400 }
        );
      }

      await auditLogger.logUpdate(
        session.user.id,
        ActorType.INTERNAL,
        'FULFILLMENT_SPLIT',
        id,
        { status: beforeStatus },
        { status: 'CANCELLED' },
        'Fulfillment cancelled, stock released'
      );

      return NextResponse.json({
        success: true,
        message: 'Fulfillment cancelled and stock released',
      });
    }

    // Regular status transition
    const actualShipDate = parsed.data.actualShipDate ? new Date(parsed.data.actualShipDate) : undefined;
    const result = await transitionFulfillmentStatus(id, newStatus, actualShipDate);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'TRANSITION_ERROR', message: result.error } },
        { status: 400 }
      );
    }

    await auditLogger.logUpdate(
      session.user.id,
      ActorType.INTERNAL,
      'FULFILLMENT_SPLIT',
      id,
      { status: beforeStatus },
      { status: newStatus, actualShipDate: actualShipDate?.toISOString() },
      `Fulfillment transitioned from ${beforeStatus} to ${newStatus}`
    );

    return NextResponse.json({
      success: true,
      message: `Fulfillment status updated to ${newStatus}`,
    });
  } catch (error) {
    console.error('[Fulfillment/Transition] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

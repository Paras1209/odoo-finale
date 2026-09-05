// ===========================================
// DealFlow360 - Product Variant Detail API
// ===========================================
// DEV B's MODULE: Update and delete variants
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ActorType, UserRole } from '@/lib/types';
import { updateVariant, deleteVariant } from '@/lib/services';
import { auditLogger } from '@/lib/services';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string; variantId: string }>;
}

// Validation schema for updating variant
const updateVariantSchema = z.object({
  attribute: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
  extraPrice: z.number().min(0).optional(),
});

// PUT /api/catalog/products/[id]/variants/[variantId] - Update a variant
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can update variants' } },
        { status: 403 }
      );
    }

    const { id: productId, variantId } = await params;
    const body = await request.json();
    const parsed = updateVariantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const variant = await updateVariant(productId, variantId, parsed.data);

    if (variant === null) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Variant not found' } },
        { status: 404 }
      );
    }

    await auditLogger.logUpdate(
      session.user.id,
      ActorType.INTERNAL,
      'PRODUCT_VARIANT',
      variantId,
      {},
      { attribute: variant.attribute, value: variant.value, extraPrice: variant.extraPrice }
    );

    return NextResponse.json({
      success: true,
      data: {
        id: variant.id,
        attribute: variant.attribute,
        value: variant.value,
        extraPrice: variant.extraPrice.toNumber(),
      },
      message: 'Variant updated successfully',
    });
  } catch (error) {
    console.error('[Catalog/Variants/Update] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// DELETE /api/catalog/products/[id]/variants/[variantId] - Delete a variant
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can delete variants' } },
        { status: 403 }
      );
    }

    const { id: productId, variantId } = await params;

    const deleted = await deleteVariant(productId, variantId);

    if (deleted === null) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Variant not found' } },
        { status: 404 }
      );
    }

    await auditLogger.logDelete(
      session.user.id,
      ActorType.INTERNAL,
      'PRODUCT_VARIANT',
      variantId,
      { productId, attribute: deleted.attribute, value: deleted.value }
    );

    return NextResponse.json({
      success: true,
      message: 'Variant deleted successfully',
    });
  } catch (error) {
    console.error('[Catalog/Variants/Delete] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

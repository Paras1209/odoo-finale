// ===========================================
// DealFlow360 - Product Variants API
// ===========================================
// DEV B's MODULE: Variant management for products
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ActorType, UserRole } from '@/lib/types';
import { getProductVariants, createVariant } from '@/lib/services';
import { auditLogger } from '@/lib/services';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Validation schema for creating variant
const createVariantSchema = z.object({
  attribute: z.string().min(1, 'Attribute is required'),
  value: z.string().min(1, 'Value is required'),
  extraPrice: z.number().min(0).default(0),
});

// GET /api/catalog/products/[id]/variants - List variants for a product
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id: productId } = await params;

    const variants = await getProductVariants(productId);

    if (variants === null) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: variants.map(v => ({
        id: v.id,
        attribute: v.attribute,
        value: v.value,
        extraPrice: v.extraPrice.toNumber(),
      })),
    });
  } catch (error) {
    console.error('[Catalog/Variants/List] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// POST /api/catalog/products/[id]/variants - Create a new variant
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can create variants' } },
        { status: 403 }
      );
    }

    const { id: productId } = await params;
    const body = await request.json();
    const parsed = createVariantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const variant = await createVariant(productId, parsed.data);

    if (variant === null) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }

    await auditLogger.logCreate(session.user.id, ActorType.INTERNAL, 'PRODUCT_VARIANT', variant.id, {
      productId,
      attribute: variant.attribute,
      value: variant.value,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: variant.id,
          attribute: variant.attribute,
          value: variant.value,
          extraPrice: variant.extraPrice.toNumber(),
        },
        message: 'Variant created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Catalog/Variants/Create] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

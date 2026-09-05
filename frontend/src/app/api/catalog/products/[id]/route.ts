// ===========================================
// DealFlow360 - Product Detail API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, UserRole } from '@/lib/types';
import { updateProductSchema } from '@/lib/validators';
import { auditLogger } from '@/lib/services';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/catalog/products/[id] - Get product details
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

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        priceListItems: {
          include: {
            priceList: { select: { id: true, name: true, customerTier: true } },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        costPrice: product.costPrice.toNumber(),
        salePrice: product.salePrice.toNumber(),
        unit: product.unit,
        taxPct: product.taxPct.toNumber(),
        description: product.description,
        isActive: product.isActive,
        createdAt: product.createdAt.toISOString(),
        variants: product.variants.map(v => ({
          id: v.id,
          attribute: v.attribute,
          value: v.value,
          extraPrice: v.extraPrice.toNumber(),
        })),
        priceListItems: product.priceListItems.map(item => ({
          priceListId: item.priceListId,
          priceListName: item.priceList.name,
          customerTier: item.priceList.customerTier,
          price: item.price.toNumber(),
        })),
      },
    });
  } catch (error) {
    console.error('[Catalog/Products/Get] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// PUT /api/catalog/products/[id] - Update product
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can update products' } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data: parsed.data,
    });

    await auditLogger.logUpdate(
      session.user.id,
      ActorType.INTERNAL,
      'PRODUCT',
      id,
      { name: existing.name, salePrice: existing.salePrice },
      { name: product.name, salePrice: product.salePrice }
    );

    return NextResponse.json({
      success: true,
      data: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        costPrice: product.costPrice.toNumber(),
        salePrice: product.salePrice.toNumber(),
        unit: product.unit,
        taxPct: product.taxPct.toNumber(),
        description: product.description,
        isActive: product.isActive,
        updatedAt: product.updatedAt.toISOString(),
      },
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('[Catalog/Products/Update] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// DELETE /api/catalog/products/[id] - Deactivate product
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can deactivate products' } },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }

    // Soft delete - just deactivate
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    await auditLogger.logUpdate(
      session.user.id,
      ActorType.INTERNAL,
      'PRODUCT',
      id,
      { isActive: true },
      { isActive: false },
      'Product deactivated'
    );

    return NextResponse.json({
      success: true,
      message: 'Product deactivated successfully',
    });
  } catch (error) {
    console.error('[Catalog/Products/Deactivate] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

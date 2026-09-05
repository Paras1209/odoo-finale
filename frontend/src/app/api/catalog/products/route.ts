// ===========================================
// DealFlow360 - Products API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, UserRole, ProductCategory } from '@/lib/types';
import { createProductSchema, paginationSchema } from '@/lib/validators';
import { auditLogger } from '@/lib/services';

// GET /api/catalog/products - List products
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
    const pagination = paginationSchema.parse({
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    const categoryParam = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    const where = {
      ...(categoryParam && { category: categoryParam as ProductCategory }),
      ...(isActive !== null && { isActive: isActive === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { sku: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { [pagination.sortBy || 'createdAt']: pagination.sortOrder },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        costPrice: p.costPrice.toNumber(),
        salePrice: p.salePrice.toNumber(),
        unit: p.unit,
        taxPct: p.taxPct.toNumber(),
        description: p.description,
        isActive: p.isActive,
        createdAt: p.createdAt.toISOString(),
      })),
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pagination.pageSize),
      },
    });
  } catch (error) {
    console.error('[Catalog/Products/List] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// POST /api/catalog/products - Create product
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can create products' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: parsed.data,
    });

    await auditLogger.logCreate(session.user.id, ActorType.INTERNAL, 'PRODUCT', product.id, {
      name: product.name,
      category: product.category,
    });

    return NextResponse.json(
      {
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
        },
        message: 'Product created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Catalog/Products/Create] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

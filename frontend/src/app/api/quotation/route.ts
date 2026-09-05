// ===========================================
// DealFlow360 - Quotation List & Create API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma, generateQuotationNumber } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, QuotationStatus } from '@/lib/types';
import { createQuotationSchema, paginationSchema } from '@/lib/validators';
import { auditLogger } from '@/lib/services';

// GET /api/quotation - List all quotations
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

    const statusParam = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const repId = searchParams.get('repId');

    const where = {
      ...(statusParam && { status: statusParam as QuotationStatus }),
      ...(customerId && { customerId }),
      ...(repId && { repId }),
    };

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, tier: true } },
          rep: { select: { id: true, name: true } },
          _count: { select: { lines: true } },
        },
        orderBy: { [pagination.sortBy || 'createdAt']: pagination.sortOrder },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      prisma.quotation.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: quotations.map(q => ({
        id: q.id,
        quotationNumber: q.quotationNumber,
        customerId: q.customerId,
        customerName: q.customer.name,
        customerTier: q.customer.tier,
        repId: q.repId,
        repName: q.rep.name,
        status: q.status,
        blendedRiskScore: q.blendedRiskScore?.toNumber() ?? null,
        totalAmount: q.totalAmount.toNumber(),
        totalMargin: q.totalMargin.toNumber(),
        totalMarginPct: q.totalMarginPct.toNumber(),
        notes: q.notes,
        validUntil: q.validUntil?.toISOString() ?? null,
        lastActivityAt: q.lastActivityAt.toISOString(),
        createdAt: q.createdAt.toISOString(),
        lineCount: q._count.lines,
      })),
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pagination.pageSize),
      },
    });
  } catch (error) {
    console.error('[Quotation/List] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// POST /api/quotation - Create new quotation
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createQuotationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const { customerId, notes, validUntil } = parsed.data;

    // Verify customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } },
        { status: 404 }
      );
    }

    const quotationNumber = await generateQuotationNumber();

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        customerId,
        repId: session.user.id,
        notes,
        validUntil: validUntil ? new Date(validUntil) : null,
      },
      include: {
        customer: { select: { id: true, name: true, tier: true } },
        rep: { select: { id: true, name: true } },
      },
    });

    await auditLogger.logCreate(session.user.id, ActorType.INTERNAL, 'QUOTATION', quotation.id, {
      quotationNumber,
      customerId,
      repId: session.user.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: quotation.id,
          quotationNumber: quotation.quotationNumber,
          customerId: quotation.customerId,
          customerName: quotation.customer.name,
          customerTier: quotation.customer.tier,
          repId: quotation.repId,
          repName: quotation.rep.name,
          status: quotation.status,
          totalAmount: quotation.totalAmount.toNumber(),
          notes: quotation.notes,
          validUntil: quotation.validUntil?.toISOString() ?? null,
          createdAt: quotation.createdAt.toISOString(),
        },
        message: 'Quotation created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Quotation/Create] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

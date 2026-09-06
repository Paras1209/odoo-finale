// ===========================================
// DealFlow360 - Quotation List & Create API
// ===========================================

import { NextRequest } from 'next/server';
import { prisma, generateQuotationNumber } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, QuotationStatus } from '@/lib/types';
import { createQuotationSchema, paginationSchema } from '@/lib/validators';
import { auditLogger } from '@/lib/services';
import { 
  apiSuccess, 
  apiSuccessWithPagination, 
  apiError, 
  apiValidationError,
  CommonErrors,
  withErrorHandling,
} from '@/lib/api-utils';
import { ErrorCode, errorLogger } from '@/lib/errors';

// GET /api/quotation - List all quotations
export async function GET(request: NextRequest) {
  return withErrorHandling('Quotation/List', async () => {
    const session = await getSession();
    errorLogger.debug('Quotation/List', 'Session retrieved', { userId: session?.user?.id });
    
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return CommonErrors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    
    // Parse pagination with null safety
    const paginationInput = {
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };
    
    const paginationResult = paginationSchema.safeParse(paginationInput);
    if (!paginationResult.success) {
      return apiValidationError(paginationResult.error);
    }
    const pagination = paginationResult.data;

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

    return apiSuccessWithPagination(
      quotations.map(q => ({
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
      {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pagination.pageSize),
      }
    );
  });
}

// POST /api/quotation - Create new quotation
export async function POST(request: NextRequest) {
  return withErrorHandling('Quotation/Create', async () => {
    errorLogger.debug('Quotation/Create', 'Starting quotation creation');
    
    const session = await getSession();
    errorLogger.debug('Quotation/Create', 'Session retrieved', { userId: session?.user?.id });
    
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return CommonErrors.unauthorized();
    }

    const body = await request.json();
    errorLogger.debug('Quotation/Create', 'Request body received', { customerId: body.customerId });
    
    const parsed = createQuotationSchema.safeParse(body);

    if (!parsed.success) {
      errorLogger.info('Quotation/Create', 'Validation failed', { errors: parsed.error.flatten() });
      return apiValidationError(parsed.error);
    }

    const { customerId, notes, validUntil } = parsed.data;

    // Verify the logged-in user exists in the database
    const repUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!repUser) {
      errorLogger.warn('Quotation/Create', 'Rep user not found - session may be stale', { userId: session.user.id });
      return CommonErrors.sessionInvalid();
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return CommonErrors.notFound('Customer');
    }

    const quotationNumber = await generateQuotationNumber();
    errorLogger.debug('Quotation/Create', 'Generated quotation number', { quotationNumber });

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

    errorLogger.info('Quotation/Create', 'Quotation created successfully', { 
      quotationId: quotation.id, 
      quotationNumber 
    });

    return apiSuccess(
      {
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
      201
    );
  });
}

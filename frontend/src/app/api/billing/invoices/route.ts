// ===========================================
// DealFlow360 - Invoices List API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, InvoiceStatus } from '@/lib/types';
import { paginationSchema } from '@/lib/validators';

// GET /api/billing/invoices - List invoices
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
    const quotationId = searchParams.get('quotationId');

    const where = {
      ...(statusParam && { status: statusParam as InvoiceStatus }),
      ...(quotationId && { quotationId }),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          quotation: {
            include: {
              customer: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { [pagination.sortBy || 'createdAt']: pagination.sortOrder },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        quotationId: inv.quotationId,
        quotationNumber: inv.quotation.quotationNumber,
        customerName: inv.quotation.customer.name,
        invoiceType: inv.invoiceType,
        amount: inv.amount.toNumber(),
        taxAmount: inv.taxAmount.toNumber(),
        totalAmount: inv.totalAmount.toNumber(),
        status: inv.status,
        dueDate: inv.dueDate?.toISOString() ?? null,
        issuedAt: inv.issuedAt?.toISOString() ?? null,
        paidAt: inv.paidAt?.toISOString() ?? null,
        createdAt: inv.createdAt.toISOString(),
      })),
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pagination.pageSize),
      },
    });
  } catch (error) {
    console.error('[Billing/Invoices/List] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

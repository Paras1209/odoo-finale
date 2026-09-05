// ===========================================
// DealFlow360 - Portal Invoices API
// ===========================================
// Returns invoices for the logged-in customer
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, InvoiceStatus } from '@/lib/types';

export interface PortalInvoiceDTO {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  quotationId: string;
  invoiceType: 'ONE_TIME' | 'RECURRING';
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  dueDate: string | null;
  issuedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  lines: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  creditNotes: Array<{
    id: string;
    creditNoteNumber: string;
    amount: number;
    reason: string;
    status: string;
    issuedAt: string | null;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.CUSTOMER) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Portal authentication required' } },
        { status: 401 }
      );
    }

    const customerId = session.user.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build where clause
    const whereClause: any = {
      quotation: { customerId },
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        quotation: {
          select: {
            id: true,
            quotationNumber: true,
            lines: {
              include: {
                product: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        creditNotes: {
          select: {
            id: true,
            creditNoteNumber: true,
            amount: true,
            reason: true,
            status: true,
            issuedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result: PortalInvoiceDTO[] = invoices.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      orderNumber: inv.quotation.quotationNumber,
      quotationId: inv.quotation.id,
      invoiceType: inv.invoiceType as 'ONE_TIME' | 'RECURRING',
      amount: inv.amount.toNumber(),
      taxAmount: inv.taxAmount.toNumber(),
      totalAmount: inv.totalAmount.toNumber(),
      status: inv.status,
      dueDate: inv.dueDate?.toISOString() || null,
      issuedAt: inv.issuedAt?.toISOString() || null,
      paidAt: inv.paidAt?.toISOString() || null,
      createdAt: inv.createdAt.toISOString(),
      lines: inv.quotation.lines.map(line => ({
        productName: line.product.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice.toNumber(),
        lineTotal: line.lineTotal.toNumber(),
      })),
      creditNotes: inv.creditNotes.map(cn => ({
        id: cn.id,
        creditNoteNumber: cn.creditNoteNumber,
        amount: cn.amount.toNumber(),
        reason: cn.reason,
        status: cn.status,
        issuedAt: cn.issuedAt?.toISOString() || null,
      })),
    }));

    // Calculate summary stats
    const summary = {
      totalOutstanding: result
        .filter(inv => inv.status === InvoiceStatus.SENT || inv.status === InvoiceStatus.OVERDUE)
        .reduce((sum, inv) => sum + inv.totalAmount, 0),
      overdueCount: result.filter(inv => inv.status === InvoiceStatus.OVERDUE).length,
      pendingCount: result.filter(inv => inv.status === InvoiceStatus.SENT).length,
      paidCount: result.filter(inv => inv.status === InvoiceStatus.PAID).length,
      totalPaid: result
        .filter(inv => inv.status === InvoiceStatus.PAID)
        .reduce((sum, inv) => sum + inv.totalAmount, 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        invoices: result,
        summary,
      },
    });
  } catch (error) {
    console.error('[Portal/Invoices] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// ===========================================
// DealFlow360 - Portal Invoice Detail API
// ===========================================
// Returns detailed invoice information
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.CUSTOMER) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Portal authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const customerId = session.user.id;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        quotation: {
          select: {
            id: true,
            quotationNumber: true,
            customerId: true,
            customer: {
              select: {
                name: true,
                companyName: true,
                email: true,
                address: true,
              },
            },
            rep: {
              select: {
                name: true,
                email: true,
              },
            },
            lines: {
              include: {
                product: {
                  select: {
                    name: true,
                    sku: true,
                    category: true,
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
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice || invoice.quotation.customerId !== customerId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } },
        { status: 404 }
      );
    }

    // Calculate totals
    const subtotal = invoice.amount.toNumber();
    const taxAmount = invoice.taxAmount.toNumber();
    const totalAmount = invoice.totalAmount.toNumber();
    const creditNotesTotal = invoice.creditNotes.reduce(
      (sum, cn) => sum + cn.amount.toNumber(), 
      0
    );
    const amountDue = totalAmount - creditNotesTotal;

    const result = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceType: invoice.invoiceType,
      status: invoice.status,
      dueDate: invoice.dueDate?.toISOString() || null,
      issuedAt: invoice.issuedAt?.toISOString() || null,
      paidAt: invoice.paidAt?.toISOString() || null,
      createdAt: invoice.createdAt.toISOString(),
      
      // Amounts
      subtotal,
      taxAmount,
      totalAmount,
      creditNotesTotal,
      amountDue: Math.max(0, amountDue),
      
      // Related order
      order: {
        id: invoice.quotation.id,
        orderNumber: invoice.quotation.quotationNumber,
      },
      
      // Billing details
      billingDetails: {
        name: invoice.quotation.customer.companyName || invoice.quotation.customer.name,
        email: invoice.quotation.customer.email,
        address: invoice.quotation.customer.address,
      },
      
      // Sales rep
      salesRep: {
        name: invoice.quotation.rep.name,
        email: invoice.quotation.rep.email,
      },
      
      // Line items
      lines: invoice.quotation.lines.map(line => ({
        id: line.id,
        productName: line.product.name,
        productSku: line.product.sku,
        productCategory: line.product.category,
        quantity: line.quantity,
        unitPrice: line.unitPrice.toNumber(),
        discountPct: line.discountPct.toNumber(),
        lineTotal: line.lineTotal.toNumber(),
        lineType: line.lineType,
      })),
      
      // Credit notes
      creditNotes: invoice.creditNotes.map(cn => ({
        id: cn.id,
        creditNoteNumber: cn.creditNoteNumber,
        amount: cn.amount.toNumber(),
        reason: cn.reason,
        status: cn.status,
        issuedAt: cn.issuedAt?.toISOString() || null,
        createdAt: cn.createdAt.toISOString(),
      })),
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Portal/Invoices/Detail] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

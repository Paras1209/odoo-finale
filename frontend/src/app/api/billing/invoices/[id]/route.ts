// ===========================================
// DealFlow360 - Invoice Detail API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, UserRole } from '@/lib/types';
import { recordPaymentSchema } from '@/lib/validators';
import { auditLogger, dealEvents } from '@/lib/services';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/billing/invoices/[id] - Get invoice details
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

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        quotation: {
          include: {
            customer: { select: { id: true, name: true, email: true, tier: true } },
            rep: { select: { id: true, name: true } },
            lines: {
              include: {
                product: { select: { id: true, name: true } },
              },
            },
          },
        },
        creditNotes: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        quotationId: invoice.quotationId,
        quotationNumber: invoice.quotation.quotationNumber,
        customer: {
          id: invoice.quotation.customer.id,
          name: invoice.quotation.customer.name,
          email: invoice.quotation.customer.email,
          tier: invoice.quotation.customer.tier,
        },
        invoiceType: invoice.invoiceType,
        amount: invoice.amount.toNumber(),
        taxAmount: invoice.taxAmount.toNumber(),
        totalAmount: invoice.totalAmount.toNumber(),
        status: invoice.status,
        dueDate: invoice.dueDate?.toISOString() ?? null,
        issuedAt: invoice.issuedAt?.toISOString() ?? null,
        paidAt: invoice.paidAt?.toISOString() ?? null,
        createdAt: invoice.createdAt.toISOString(),
        lines: invoice.quotation.lines.map(line => ({
          id: line.id,
          productName: line.product.name,
          quantity: line.quantity,
          unitPrice: line.unitPrice.toNumber(),
          discountPct: line.discountPct.toNumber(),
          lineTotal: line.lineTotal.toNumber(),
        })),
        creditNotes: invoice.creditNotes.map(cn => ({
          id: cn.id,
          creditNoteNumber: cn.creditNoteNumber,
          amount: cn.amount.toNumber(),
          reason: cn.reason,
          status: cn.status,
          issuedAt: cn.issuedAt?.toISOString() ?? null,
        })),
      },
    });
  } catch (error) {
    console.error('[Billing/Invoices/Get] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// POST /api/billing/invoices/[id] - Record payment or send invoice
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        quotation: {
          select: { customerId: true },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } },
        { status: 404 }
      );
    }

    if (action === 'send') {
      if (invoice.status !== 'DRAFT') {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_STATE', message: 'Only draft invoices can be sent' } },
          { status: 400 }
        );
      }

      const updated = await prisma.invoice.update({
        where: { id },
        data: {
          status: 'SENT',
          issuedAt: new Date(),
        },
      });

      dealEvents.emit('invoice.sent', {
        invoiceId: id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.quotation.customerId,
        sentAt: new Date(),
        sentBy: session.user.id,
      });

      return NextResponse.json({
        success: true,
        data: { id: updated.id, status: updated.status, issuedAt: updated.issuedAt?.toISOString() },
        message: 'Invoice sent successfully',
      });
    }

    if (action === 'pay') {
      const financeRoles = [UserRole.FINANCE_OPS, UserRole.ADMIN];
      if (!session.user.role || !financeRoles.includes(session.user.role)) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Only finance users can record payments' } },
          { status: 403 }
        );
      }

      if (!['SENT', 'OVERDUE'].includes(invoice.status)) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_STATE', message: 'Invoice must be sent or overdue to record payment' } },
          { status: 400 }
        );
      }

      const body = await request.json();
      const parsed = recordPaymentSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
          { status: 400 }
        );
      }

      const { amount, paidAt } = parsed.data;
      const paymentDate = paidAt ? new Date(paidAt) : new Date();

      const updated = await prisma.invoice.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAt: paymentDate,
        },
      });

      dealEvents.emit('payment.received', {
        invoiceId: id,
        quotationId: invoice.quotationId,
        customerId: invoice.quotation.customerId,
        amount,
        paidAt: paymentDate,
      });

      await auditLogger.log({
        entityType: 'INVOICE',
        entityId: id,
        actorId: session.user.id,
        actorType: ActorType.INTERNAL,
        action: 'PAYMENT',
        afterState: { amount, paidAt: paymentDate },
      });

      return NextResponse.json({
        success: true,
        data: { id: updated.id, status: updated.status, paidAt: updated.paidAt?.toISOString() },
        message: 'Payment recorded successfully',
      });
    }

    return NextResponse.json(
      { success: false, error: { code: 'INVALID_ACTION', message: 'Invalid action. Use ?action=send or ?action=pay' } },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Billing/Invoices/Action] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

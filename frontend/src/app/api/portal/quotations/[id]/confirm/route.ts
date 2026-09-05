import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, QuotationStatus } from '@/lib/types';
import { dealEvents, auditLogger } from '@/lib/services';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.CUSTOMER) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Portal authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;

    const quotation = await prisma.quotation.findUnique({
      where: { id, customerId: session.user.id },
      include: {
        customer: true,
        lines: { include: { product: true } },
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Quotation not found' } },
        { status: 404 }
      );
    }

    if (quotation.status !== 'APPROVED') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Can only confirm APPROVED quotations' } },
        { status: 400 }
      );
    }

    const previousStatus = quotation.status;

    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        status: QuotationStatus.CONFIRMED,
        lastActivityAt: new Date(),
      }
    });

    // Emit event for fulfillment (M3) and billing (M4) modules to handle
    dealEvents.emit('quotation.confirmed', {
      quotationId: id,
      quotation: quotation as any,
      lines: quotation.lines as any,
      customerId: quotation.customerId,
      confirmedBy: { id: session.user.id, type: ActorType.CUSTOMER },
      confirmedAt: new Date(),
    });

    // Emit status change event
    dealEvents.emit('quotation.statusChanged', {
      quotationId: id,
      previousStatus,
      newStatus: QuotationStatus.CONFIRMED,
      changedBy: { id: session.user.id, type: ActorType.CUSTOMER },
      changedAt: new Date(),
    });

    // Audit log
    await auditLogger.logQuotationTransition(
      session.user.id,
      ActorType.CUSTOMER,
      id,
      'CONFIRM',
      previousStatus,
      QuotationStatus.CONFIRMED
    );

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        quotationNumber: updated.quotationNumber,
        status: updated.status,
        previousStatus,
        confirmedAt: updated.lastActivityAt.toISOString(),
      },
      message: 'Quotation confirmed successfully',
    });
  } catch (error) {
    console.error('[Portal/Quotations/Confirm] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

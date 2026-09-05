import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, QuotationStatus } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Statuses that customers are allowed to see
// Excludes DRAFT, PENDING_MANAGER_APPROVAL, PENDING_FINANCE_APPROVAL (internal workflow states)
const CUSTOMER_VISIBLE_STATUSES: QuotationStatus[] = [
  QuotationStatus.APPROVED,
  QuotationStatus.CONFIRMED,
  QuotationStatus.FULFILLING,
  QuotationStatus.BILLED,
  QuotationStatus.REJECTED,
  QuotationStatus.CANCELLED,
];

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

    const quotation = await prisma.quotation.findUnique({
      where: { id, customerId: session.user.id },
      include: {
        lines: {
          include: {
            product: { select: { id: true, name: true, category: true } },
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Quotation not found' } },
        { status: 404 }
      );
    }

    // Check if the quotation status is visible to customers
    if (!CUSTOMER_VISIBLE_STATUSES.includes(quotation.status as QuotationStatus)) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Quotation not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: quotation.id,
        quotationNumber: quotation.quotationNumber,
        status: quotation.status,
        totalAmount: quotation.totalAmount.toNumber(),
        overallDiscountPct: quotation.overallDiscountPct?.toNumber() ?? 0,
        // Counter offer info
        counterOfferStatus: quotation.counterOfferStatus,
        counteredDiscountPct: quotation.counteredDiscountPct?.toNumber() ?? null,
        counteredTotalAmount: quotation.counteredTotalAmount?.toNumber() ?? null,
        unitPriceTotal: quotation.unitPriceTotal?.toNumber() ?? null,
        counterOfferAt: quotation.counterOfferAt?.toISOString() ?? null,
        counterOfferRespondedAt: quotation.counterOfferRespondedAt?.toISOString() ?? null,
        notes: quotation.notes,
        validUntil: quotation.validUntil?.toISOString() ?? null,
        lastActivityAt: quotation.lastActivityAt.toISOString(),
        createdAt: quotation.createdAt.toISOString(),
        lines: quotation.lines.map(line => ({
          id: line.id,
          productId: line.productId,
          productName: line.product.name,
          productCategory: line.product.category,
          quantity: line.quantity,
          unitPrice: line.unitPrice.toNumber(),
          discountPct: line.discountPct.toNumber(),
          lineTotal: line.lineTotal.toNumber(),
          lineType: line.lineType,
          billingFrequency: line.billingFrequency,
        })),
      },
    });
  } catch (error) {
    console.error('[Portal/Quotations/Get] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

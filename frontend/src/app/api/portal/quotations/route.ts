// ===========================================
// DealFlow360 - Portal Quotations API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType } from '@/lib/types';

// GET /api/portal/quotations - List customer's quotations
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.CUSTOMER) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Portal authentication required' } },
        { status: 401 }
      );
    }

    const quotations = await prisma.quotation.findMany({
      where: {
        customerId: session.user.id,
      },
      include: {
        lines: {
          include: {
            product: { select: { id: true, name: true, category: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: quotations.map(q => ({
        id: q.id,
        quotationNumber: q.quotationNumber,
        status: q.status,
        totalAmount: q.totalAmount.toNumber(),
        notes: q.notes,
        validUntil: q.validUntil?.toISOString() ?? null,
        lastActivityAt: q.lastActivityAt.toISOString(),
        createdAt: q.createdAt.toISOString(),
        lines: q.lines.map(line => ({
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
          // Note: Margin info excluded for portal customers
        })),
      })),
    });
  } catch (error) {
    console.error('[Portal/Quotations/List] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

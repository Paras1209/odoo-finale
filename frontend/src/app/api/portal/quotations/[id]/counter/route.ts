import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, QuotationStatus } from '@/lib/types';

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
    const body = await request.json();

    const quotation = await prisma.quotation.findUnique({
      where: { id, customerId: session.user.id },
    });

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Quotation not found' } },
        { status: 404 }
      );
    }

    if (quotation.status !== 'APPROVED') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Can only counter APPROVED quotations' } },
        { status: 400 }
      );
    }

    // Phase 1 bypass: Just set the overall discount and send back to DRAFT
    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        overallDiscountPct: body.discountPct || 0,
        status: QuotationStatus.DRAFT,
        lastActivityAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Counter offer submitted',
    });
  } catch (error) {
    console.error('[Portal/Quotations/Counter] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// ===========================================
// DealFlow360 - Quotation Lines API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType } from '@/lib/types';
import { createQuotationLineSchema } from '@/lib/validators';
import { auditLogger } from '@/lib/services';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/quotation/[id]/lines - Add line item
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id: quotationId } = await params;
    const body = await request.json();
    const parsed = createQuotationLineSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    // Verify quotation exists and is in DRAFT status
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { customer: true },
    });

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Quotation not found' } },
        { status: 404 }
      );
    }

    if (quotation.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Lines can only be added to draft quotations' } },
        { status: 400 }
      );
    }

    const { productId, quantity, unitPrice, discountPct, lineType, billingFrequency } = parsed.data;

    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }

    // Calculate line values
    const finalUnitPrice = unitPrice ?? product.salePrice.toNumber();
    const discountedPrice = finalUnitPrice * (1 - (discountPct ?? 0) / 100);
    const lineTotal = discountedPrice * quantity;
    const costTotal = product.costPrice.toNumber() * quantity;
    const marginAmount = lineTotal - costTotal;
    const marginPct = lineTotal > 0 ? (marginAmount / lineTotal) * 100 : 0;

    const line = await prisma.quotationLine.create({
      data: {
        quotationId,
        productId,
        quantity,
        unitPrice: finalUnitPrice,
        discountPct: discountPct ?? 0,
        lineTotal,
        lineType: lineType ?? 'ONE_TIME',
        billingFrequency,
        marginAmount,
        marginPct,
      },
      include: {
        product: { select: { name: true, category: true } },
      },
    });

    // Update quotation totals
    await updateQuotationTotals(quotationId);

    await auditLogger.logCreate(session.user.id, ActorType.INTERNAL, 'QUOTATION_LINE', line.id, {
      quotationId,
      productId,
      quantity,
      lineTotal,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
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
          marginAmount: line.marginAmount.toNumber(),
          marginPct: line.marginPct.toNumber(),
        },
        message: 'Line added successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Quotation/Lines/Add] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// Helper function to update quotation totals
async function updateQuotationTotals(quotationId: string) {
  const lines = await prisma.quotationLine.findMany({
    where: { quotationId },
  });

  const totalAmount = lines.reduce((sum, line) => sum + line.lineTotal.toNumber(), 0);
  const totalMargin = lines.reduce((sum, line) => sum + line.marginAmount.toNumber(), 0);
  const totalMarginPct = totalAmount > 0 ? (totalMargin / totalAmount) * 100 : 0;

  await prisma.quotation.update({
    where: { id: quotationId },
    data: {
      totalAmount,
      totalMargin,
      totalMarginPct,
      lastActivityAt: new Date(),
    },
  });
}

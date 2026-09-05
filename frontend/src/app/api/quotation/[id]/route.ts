// ===========================================
// DealFlow360 - Quotation Detail API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType } from '@/lib/types';
import { updateQuotationSchema } from '@/lib/validators';
import { auditLogger } from '@/lib/services';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/quotation/[id] - Get quotation details
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

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, tier: true, email: true } },
        rep: { select: { id: true, name: true, email: true } },
        lines: {
          include: {
            product: { select: { id: true, name: true, category: true, costPrice: true, salePrice: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        approvals: {
          include: {
            approver: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!quotation) {
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
        customerId: quotation.customerId,
        customerName: quotation.customer.name,
        customerTier: quotation.customer.tier,
        customerEmail: quotation.customer.email,
        repId: quotation.repId,
        repName: quotation.rep.name,
        repEmail: quotation.rep.email,
        status: quotation.status,
        blendedRiskScore: quotation.blendedRiskScore?.toNumber() ?? null,
        totalAmount: quotation.totalAmount.toNumber(),
        totalMargin: quotation.totalMargin.toNumber(),
        totalMarginPct: quotation.totalMarginPct.toNumber(),
        overallDiscountPct: quotation.overallDiscountPct.toNumber(),
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
        updatedAt: quotation.updatedAt.toISOString(),
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
          marginAmount: line.marginAmount.toNumber(),
          marginPct: line.marginPct.toNumber(),
          costPrice: line.product.costPrice.toNumber(),
        })),
        approvals: quotation.approvals.map(approval => ({
          id: approval.id,
          level: approval.level,
          approverId: approval.approverId,
          approverName: approval.approver?.name ?? null,
          status: approval.status,
          reason: approval.reason,
          actedAt: approval.actedAt?.toISOString() ?? null,
          createdAt: approval.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('[Quotation/Get] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// PUT /api/quotation/[id] - Update quotation
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateQuotationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const existing = await prisma.quotation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Quotation not found' } },
        { status: 404 }
      );
    }

    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Only draft quotations can be updated' } },
        { status: 400 }
      );
    }

    const { notes, validUntil } = parsed.data;

    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        notes,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        lastActivityAt: new Date(),
      },
    });

    await auditLogger.logUpdate(
      session.user.id,
      ActorType.INTERNAL,
      'QUOTATION',
      id,
      { notes: existing.notes, validUntil: existing.validUntil },
      { notes: quotation.notes, validUntil: quotation.validUntil }
    );

    return NextResponse.json({
      success: true,
      data: {
        id: quotation.id,
        notes: quotation.notes,
        validUntil: quotation.validUntil?.toISOString() ?? null,
        updatedAt: quotation.updatedAt.toISOString(),
      },
      message: 'Quotation updated successfully',
    });
  } catch (error) {
    console.error('[Quotation/Update] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// DELETE /api/quotation/[id] - Delete quotation (draft only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existing = await prisma.quotation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Quotation not found' } },
        { status: 404 }
      );
    }

    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Only draft quotations can be deleted' } },
        { status: 400 }
      );
    }

    await prisma.quotation.delete({ where: { id } });

    await auditLogger.logDelete(session.user.id, ActorType.INTERNAL, 'QUOTATION', id, {
      quotationNumber: existing.quotationNumber,
      status: existing.status,
    });

    return NextResponse.json({
      success: true,
      message: 'Quotation deleted successfully',
    });
  } catch (error) {
    console.error('[Quotation/Delete] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

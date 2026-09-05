import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, QuotationStatus } from '@/lib/types';
import { createFulfillmentSplits, calculateWarehouseSplit } from '@/lib/services';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required. Must be Admin or Sales Rep.' } },
        { status: 401 }
      );
    }

    const { id: quotationId } = await params;
    const body = await request.json();
    const { action } = body; // ACCEPT_SPLIT, REJECT, KEEP_ACTIVE, CANCEL

    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        lines: {
          include: {
            product: true
          }
        }
      }
    });

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Quotation not found' } },
        { status: 404 }
      );
    }

    if (quotation.status !== 'CONFIRMED' && quotation.status !== 'APPROVED') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: `Cannot fulfill quotation in ${quotation.status} status` } },
        { status: 400 }
      );
    }

    switch (action) {
      case 'ACCEPT_SPLIT':
        // Generate splits
        const physicalLines = quotation.lines.filter(l => l.product.category !== 'SERVICE' && l.product.category !== 'SUBSCRIPTION');
        
        for (const line of physicalLines) {
          const calc = await calculateWarehouseSplit(line.productId, line.quantity);
          if (calc.splits.length > 0) {
            // We use the calculated splits and create them in the DB
            await createFulfillmentSplits(
              line.id,
              calc.splits.map(s => ({ warehouseId: s.warehouseId, quantity: s.quantity })),
              false // not manual override
            );
          } else {
            // If completely out of stock, create a backorder split if needed, but calculateWarehouseSplit might not return splits if no stock
            // Wait, calculateWarehouseSplit only returns splits for what IS available. If remaining > 0, we still need a backorder split?
            // Actually createFulfillmentSplits creates a backorder if quantity > available. But we need a warehouseId to assign the backorder to.
            // Let's check if calc.splits is empty. If so, assign backorder to first active warehouse.
            let fallbackWarehouseId = null;
            if (calc.splits.length === 0) {
              const wh = await prisma.warehouse.findFirst({ where: { isActive: true } });
              if (wh) fallbackWarehouseId = wh.id;
            }
            
            if (calc.splits.length === 0 && fallbackWarehouseId) {
               await createFulfillmentSplits(
                 line.id,
                 [{ warehouseId: fallbackWarehouseId, quantity: line.quantity }],
                 false
               );
            }
          }
        }

        // Update Splits status to PROCESSING, because createFulfillmentSplits creates them as PENDING
        // But the user requested "when admin accept split it will confimed and move to processing"
        await prisma.fulfillmentSplit.updateMany({
          where: { quotationLine: { quotationId: quotation.id } },
          data: { status: 'PROCESSING' }
        });

        // Update Quotation status to FULFILLING
        await prisma.quotation.update({
          where: { id: quotation.id },
          data: { status: QuotationStatus.FULFILLING }
        });
        break;

      case 'REJECT':
        // Cancel the quotation
        await prisma.quotation.update({
          where: { id: quotation.id },
          data: { status: QuotationStatus.CANCELLED }
        });
        break;

      case 'KEEP_ACTIVE':
        // Do nothing to the quotation status, let it stay CONFIRMED (in backorder / awaiting state)
        // Wait, maybe we should update the lastActivityAt to show it was reviewed
        await prisma.quotation.update({
          where: { id: quotation.id },
          data: { lastActivityAt: new Date() }
        });
        break;

      case 'CANCEL':
        // Cancel the quotation entirely
        await prisma.quotation.update({
          where: { id: quotation.id },
          data: { status: QuotationStatus.CANCELLED }
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_ACTION', message: 'Invalid action provided' } },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Quotation fulfillment action ${action} completed successfully.`
    });

  } catch (error) {
    console.error('[Fulfillment/Action] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

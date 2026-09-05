import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType } from '@/lib/types';
import { calculateWarehouseSplit } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required. Must be Admin or Sales Rep.' } },
        { status: 401 }
      );
    }

    // Fetch quotations that need fulfillment (CONFIRMED)
    // Only physical products need fulfillment
    const quotations = await prisma.quotation.findMany({
      where: {
        status: { in: ['APPROVED', 'CONFIRMED'] },
        lines: {
          some: {
            product: {
              category: {
                notIn: ['SERVICE', 'SUBSCRIPTION']
              }
            }
          }
        }
      },
      include: {
        customer: { select: { name: true, companyName: true } },
        lines: {
          include: {
            product: { select: { id: true, name: true, sku: true, category: true } }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const canBeFulfilled = [];
    const awaitingFulfillment = [];

    // Evaluate each quotation
    for (const q of quotations) {
      // Filter out non-physical lines for fulfillment logic
      const physicalLines = q.lines.filter(l => l.product.category !== 'SERVICE' && l.product.category !== 'SUBSCRIPTION');
      
      let singleWarehousePossible = true;
      let totalBackorder = false;
      const lineEvaluations = [];

      for (const line of physicalLines) {
        // Find splits for this line
        const calc = await calculateWarehouseSplit(line.productId, line.quantity);
        lineEvaluations.push({
          lineId: line.id,
          productName: line.product.name,
          quantity: line.quantity,
          splits: calc.splits,
          isBackorder: calc.isBackorder,
          shortfall: calc.shortfall
        });

        if (calc.isBackorder) {
          totalBackorder = true;
          singleWarehousePossible = false;
        } else if (calc.splits.length > 1) {
          // If a single line needs multiple warehouses, it's not a single warehouse fulfillment
          singleWarehousePossible = false;
        }
      }

      // Check if ALL lines can be fulfilled by the SAME single warehouse
      if (singleWarehousePossible && lineEvaluations.length > 0) {
        // Get the warehouse used by the first line
        const firstWarehouseId = lineEvaluations[0].splits.length > 0 
          ? lineEvaluations[0].splits[0].warehouseId 
          : null;
        
        // Ensure ALL lines use this exact same warehouse
        const allSameWarehouse = lineEvaluations.every(le => 
          le.splits.length === 1 && le.splits[0].warehouseId === firstWarehouseId
        );

        if (!allSameWarehouse) {
          singleWarehousePossible = false;
        }
      }

      const quotationData = {
        id: q.id,
        quotationNumber: q.quotationNumber,
        customerName: q.customer.name,
        companyName: q.customer.companyName,
        totalAmount: q.totalAmount,
        createdAt: q.createdAt,
        lines: lineEvaluations
      };

      if (singleWarehousePossible && !totalBackorder && lineEvaluations.length > 0 && lineEvaluations[0].splits.length > 0) {
        // Add the single warehouse info for UI
        canBeFulfilled.push({
          ...quotationData,
          warehouseId: lineEvaluations[0].splits[0].warehouseId,
          warehouseName: lineEvaluations[0].splits[0].warehouseName
        });
      } else {
        awaitingFulfillment.push({
          ...quotationData,
          hasBackorder: totalBackorder
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        canBeFulfilled,
        awaitingFulfillment
      }
    });
  } catch (error) {
    console.error('[Fulfillment/Quotations] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

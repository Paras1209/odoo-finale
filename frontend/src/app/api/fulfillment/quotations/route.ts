import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required. Must be Admin or Sales Rep.' } },
        { status: 401 }
      );
    }

    // Fetch quotations that need fulfillment
    const quotations = await prisma.quotation.findMany({
      where: {
        status: { in: ['APPROVED', 'CONFIRMED'] }
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

    // Pre-fetch stock levels for all products across all active warehouses to prevent N+1
    const physicalProductIds = Array.from(new Set(
      quotations
        .flatMap(q => q.lines)
        .filter(l => l.product.category !== 'SERVICE' && l.product.category !== 'SUBSCRIPTION')
        .map(l => l.productId)
    ));

    const stockLevels = await prisma.stockLevel.findMany({
      where: {
        productId: { in: physicalProductIds },
        warehouse: { isActive: true },
        quantityAvailable: { gt: 0 }
      },
      include: {
        warehouse: {
          select: { id: true, name: true, code: true, shippingCostWeight: true },
        }
      }
    });

    // Group stock by product and sort like calculateWarehouseSplit
    const stockByProduct: Record<string, typeof stockLevels> = {};
    for (const sl of stockLevels) {
      if (!stockByProduct[sl.productId]) stockByProduct[sl.productId] = [];
      stockByProduct[sl.productId].push(sl);
    }
    
    // Sort logic from calculateWarehouseSplit: primary quantity desc, secondary shippingCostWeight asc
    for (const pid of Object.keys(stockByProduct)) {
      stockByProduct[pid].sort((a, b) => {
        if (b.quantityAvailable !== a.quantityAvailable) {
          return b.quantityAvailable - a.quantityAvailable;
        }
        return Number(a.warehouse.shippingCostWeight) - Number(b.warehouse.shippingCostWeight);
      });
    }

    // Evaluate each quotation
    for (const q of quotations) {
      const physicalLines = q.lines.filter(l => l.product.category !== 'SERVICE' && l.product.category !== 'SUBSCRIPTION');
      
      let singleWarehousePossible = true;
      let totalBackorder = false;
      const lineEvaluations = [];

      // If no physical lines, it can be fulfilled automatically without warehouse splits
      if (physicalLines.length === 0) {
        canBeFulfilled.push({
          id: q.id,
          quotationNumber: q.quotationNumber,
          customerName: q.customer.name,
          companyName: q.customer.companyName,
          totalAmount: q.totalAmount,
          createdAt: q.createdAt,
          lines: [],
          warehouseId: 'N/A',
          warehouseName: 'Digital / Service (No Warehouse)'
        });
        continue;
      }

      for (const line of physicalLines) {
        // In-memory split calculation
        const splits = [];
        let remaining = line.quantity;
        const availableStocks = stockByProduct[line.productId] || [];

        for (const sl of availableStocks) {
          if (remaining <= 0) break;
          const take = Math.min(sl.quantityAvailable, remaining);
          if (take > 0) {
            splits.push({
              warehouseId: sl.warehouse.id,
              warehouseName: sl.warehouse.name,
              warehouseCode: sl.warehouse.code,
              quantity: take,
              availableStock: sl.quantityAvailable
            });
            remaining -= take;
          }
        }

        const isBackorder = remaining > 0;

        lineEvaluations.push({
          lineId: line.id,
          productName: line.product.name,
          quantity: line.quantity,
          splits,
          isBackorder,
          shortfall: remaining
        });

        if (isBackorder) {
          totalBackorder = true;
          singleWarehousePossible = false;
        } else if (splits.length > 1) {
          singleWarehousePossible = false;
        }
      }

      if (singleWarehousePossible && lineEvaluations.length > 0) {
        const firstWarehouseId = lineEvaluations[0].splits.length > 0 
          ? lineEvaluations[0].splits[0].warehouseId 
          : null;
        
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

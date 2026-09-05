// ===========================================
// DealFlow360 - Portal Orders API
// ===========================================
// Returns orders (confirmed quotations) with fulfillment tracking
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, QuotationStatus } from '@/lib/types';

export interface PortalOrderDTO {
  id: string;
  orderNumber: string;
  quotationId: string;
  status: 'PROCESSING' | 'PARTIALLY_SHIPPED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  confirmedAt: string;
  lines: PortalOrderLineDTO[];
  fulfillmentSummary: {
    totalItems: number;
    shipped: number;
    pending: number;
    delivered: number;
  };
}

export interface PortalOrderLineDTO {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  fulfillment: PortalFulfillmentDTO[];
}

export interface PortalFulfillmentDTO {
  id: string;
  warehouseName: string;
  quantity: number;
  status: string;
  estimatedShipDate: string | null;
  actualShipDate: string | null;
  isBackorder: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.CUSTOMER) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Portal authentication required' } },
        { status: 401 }
      );
    }

    const customerId = session.user.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Orders are quotations in CONFIRMED, FULFILLING, or BILLED status
    const orderStatuses = [
      QuotationStatus.CONFIRMED,
      QuotationStatus.FULFILLING,
      QuotationStatus.BILLED,
    ];

    const quotations = await prisma.quotation.findMany({
      where: {
        customerId,
        status: { in: orderStatuses },
      },
      include: {
        lines: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
            fulfillmentSplits: {
              include: {
                warehouse: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const orders: PortalOrderDTO[] = quotations.map(q => {
      // Calculate fulfillment summary
      let totalItems = 0;
      let shipped = 0;
      let pending = 0;
      let delivered = 0;

      const lines: PortalOrderLineDTO[] = q.lines.map(line => {
        const lineQuantity = line.quantity;
        totalItems += lineQuantity;

        const fulfillment: PortalFulfillmentDTO[] = line.fulfillmentSplits.map(fs => {
          const qty = fs.quantityFulfilled;
          
          if (fs.status === 'DELIVERED') {
            delivered += qty;
          } else if (fs.status === 'SHIPPED') {
            shipped += qty;
          } else {
            pending += qty;
          }

          return {
            id: fs.id,
            warehouseName: fs.warehouse.name,
            quantity: fs.quantityFulfilled,
            status: fs.status,
            estimatedShipDate: fs.estimatedShipDate?.toISOString() || null,
            actualShipDate: fs.actualShipDate?.toISOString() || null,
            isBackorder: fs.isBackorder,
          };
        });

        // If no fulfillment splits yet, all items are pending
        if (fulfillment.length === 0) {
          pending += lineQuantity;
        }

        return {
          id: line.id,
          productName: line.product.name,
          quantity: lineQuantity,
          unitPrice: line.unitPrice.toNumber(),
          lineTotal: line.lineTotal.toNumber(),
          fulfillment,
        };
      });

      // Determine overall order status
      let orderStatus: PortalOrderDTO['status'] = 'PROCESSING';
      if (delivered === totalItems && totalItems > 0) {
        orderStatus = 'DELIVERED';
      } else if (shipped + delivered === totalItems && totalItems > 0) {
        orderStatus = 'SHIPPED';
      } else if (shipped > 0 || delivered > 0) {
        orderStatus = 'PARTIALLY_SHIPPED';
      }

      return {
        id: q.id,
        orderNumber: q.quotationNumber, // Using quotation number as order number
        quotationId: q.id,
        status: orderStatus,
        totalAmount: q.totalAmount.toNumber(),
        confirmedAt: q.updatedAt.toISOString(),
        lines,
        fulfillmentSummary: {
          totalItems,
          shipped,
          pending,
          delivered,
        },
      };
    });

    // Filter by status if provided
    let filteredOrders = orders;
    if (status && status !== 'all') {
      filteredOrders = orders.filter(o => o.status === status);
    }

    return NextResponse.json({
      success: true,
      data: filteredOrders,
    });
  } catch (error) {
    console.error('[Portal/Orders] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

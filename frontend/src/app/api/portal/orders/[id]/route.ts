// ===========================================
// DealFlow360 - Portal Order Detail API
// ===========================================
// Returns detailed order information with fulfillment tracking
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, QuotationStatus } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

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
    const customerId = session.user.id;

    // Orders are quotations in CONFIRMED, FULFILLING, or BILLED status
    const orderStatuses = [
      QuotationStatus.CONFIRMED,
      QuotationStatus.FULFILLING,
      QuotationStatus.BILLED,
    ];

    const quotation = await prisma.quotation.findUnique({
      where: {
        id,
        customerId,
        status: { in: orderStatuses },
      },
      include: {
        rep: {
          select: {
            name: true,
            email: true,
          },
        },
        lines: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                sku: true,
              },
            },
            fulfillmentSplits: {
              include: {
                warehouse: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            status: true,
            issuedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } },
        { status: 404 }
      );
    }

    // Calculate fulfillment summary and timeline
    let totalItems = 0;
    let shipped = 0;
    let pending = 0;
    let delivered = 0;
    const timeline: Array<{
      date: string;
      event: string;
      description: string;
    }> = [];

    // Add order confirmed event
    timeline.push({
      date: quotation.updatedAt.toISOString(),
      event: 'Order Confirmed',
      description: 'Your order has been confirmed and is being processed',
    });

    const lines = quotation.lines.map(line => {
      const lineQuantity = line.quantity;
      totalItems += lineQuantity;

      const fulfillment = line.fulfillmentSplits.map(fs => {
        const qty = fs.quantityFulfilled;
        
        if (fs.status === 'DELIVERED') {
          delivered += qty;
          if (fs.actualShipDate) {
            timeline.push({
              date: fs.actualShipDate.toISOString(),
              event: 'Delivered',
              description: `${qty}x ${line.product.name} delivered from ${fs.warehouse.name}`,
            });
          }
        } else if (fs.status === 'SHIPPED') {
          shipped += qty;
          if (fs.actualShipDate) {
            timeline.push({
              date: fs.actualShipDate.toISOString(),
              event: 'Shipped',
              description: `${qty}x ${line.product.name} shipped from ${fs.warehouse.name}`,
            });
          }
        } else {
          pending += qty;
        }

        return {
          id: fs.id,
          warehouseId: fs.warehouse.id,
          warehouseName: fs.warehouse.name,
          warehouseAddress: fs.warehouse.address,
          quantity: fs.quantityFulfilled,
          status: fs.status,
          estimatedShipDate: fs.estimatedShipDate?.toISOString() || null,
          actualShipDate: fs.actualShipDate?.toISOString() || null,
          isBackorder: fs.isBackorder,
          isManualOverride: fs.isManualOverride,
        };
      });

      // If no fulfillment splits yet, all items are pending
      if (fulfillment.length === 0) {
        pending += lineQuantity;
      }

      return {
        id: line.id,
        productId: line.product.id,
        productName: line.product.name,
        productSku: line.product.sku,
        productCategory: line.product.category,
        quantity: lineQuantity,
        unitPrice: line.unitPrice.toNumber(),
        discountPct: line.discountPct.toNumber(),
        lineTotal: line.lineTotal.toNumber(),
        lineType: line.lineType,
        fulfillment,
      };
    });

    // Sort timeline by date descending
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Determine overall order status
    let orderStatus = 'PROCESSING';
    if (delivered === totalItems && totalItems > 0) {
      orderStatus = 'DELIVERED';
    } else if (shipped + delivered === totalItems && totalItems > 0) {
      orderStatus = 'SHIPPED';
    } else if (shipped > 0 || delivered > 0) {
      orderStatus = 'PARTIALLY_SHIPPED';
    }

    // Calculate estimated delivery (latest estimated ship date + 3 days)
    const allEstimatedDates = quotation.lines
      .flatMap(l => l.fulfillmentSplits)
      .map(fs => fs.estimatedShipDate)
      .filter(Boolean) as Date[];
    
    let estimatedDelivery = null;
    if (allEstimatedDates.length > 0) {
      const latestShip = new Date(Math.max(...allEstimatedDates.map(d => d.getTime())));
      latestShip.setDate(latestShip.getDate() + 3); // Assume 3 days for delivery
      estimatedDelivery = latestShip.toISOString();
    }

    const order = {
      id: quotation.id,
      orderNumber: quotation.quotationNumber,
      status: orderStatus,
      totalAmount: quotation.totalAmount.toNumber(),
      confirmedAt: quotation.updatedAt.toISOString(),
      estimatedDelivery,
      salesRep: {
        name: quotation.rep.name,
        email: quotation.rep.email,
      },
      lines,
      fulfillmentSummary: {
        totalItems,
        shipped,
        pending,
        delivered,
        progressPercent: totalItems > 0 ? Math.round(((shipped + delivered) / totalItems) * 100) : 0,
      },
      timeline,
      invoices: quotation.invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        totalAmount: inv.totalAmount.toNumber(),
        status: inv.status,
        issuedAt: inv.issuedAt?.toISOString() || null,
      })),
    };

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('[Portal/Orders/Detail] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

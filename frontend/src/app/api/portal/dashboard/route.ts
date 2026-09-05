// ===========================================
// DealFlow360 - Portal Dashboard API
// ===========================================
// Returns dashboard statistics for the logged-in customer
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, QuotationStatus, InvoiceStatus, FulfillmentStatus } from '@/lib/types';

export interface PortalDashboardStats {
  quotations: {
    total: number;
    awaitingReview: number;
    pendingApproval: number;
    confirmed: number;
  };
  orders: {
    total: number;
    inProgress: number;
    shippingToday: number;
    delivered: number;
  };
  invoices: {
    outstandingBalance: number;
    overdueCount: number;
    pendingCount: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'QUOTATION' | 'ORDER' | 'INVOICE' | 'COMMENT';
    action: string;
    description: string;
    timestamp: string;
    relatedId: string;
    relatedNumber: string;
  }>;
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

    // Fetch quotation statistics
    const quotations = await prisma.quotation.findMany({
      where: { customerId },
      select: {
        id: true,
        quotationNumber: true,
        status: true,
        totalAmount: true,
        updatedAt: true,
      },
    });

    const quotationStats = {
      total: quotations.length,
      awaitingReview: quotations.filter(q => q.status === QuotationStatus.APPROVED).length,
      pendingApproval: quotations.filter(q => 
        q.status === QuotationStatus.PENDING_MANAGER_APPROVAL || 
        q.status === QuotationStatus.PENDING_FINANCE_APPROVAL ||
        q.status === QuotationStatus.DRAFT
      ).length,
      confirmed: quotations.filter(q => 
        q.status === QuotationStatus.CONFIRMED || 
        q.status === QuotationStatus.FULFILLING ||
        q.status === QuotationStatus.BILLED
      ).length,
    };

    // Fetch order/fulfillment statistics
    // Orders are quotations in CONFIRMED, FULFILLING, or BILLED status
    const confirmedQuotationIds = quotations
      .filter(q => [QuotationStatus.CONFIRMED, QuotationStatus.FULFILLING, QuotationStatus.BILLED].includes(q.status as QuotationStatus))
      .map(q => q.id);

    const fulfillmentSplits = await prisma.fulfillmentSplit.findMany({
      where: {
        quotationLine: {
          quotationId: { in: confirmedQuotationIds },
        },
      },
      select: {
        id: true,
        status: true,
        estimatedShipDate: true,
        actualShipDate: true,
        quotationLine: {
          select: {
            quotation: {
              select: {
                quotationNumber: true,
              },
            },
          },
        },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orderStats = {
      total: confirmedQuotationIds.length,
      inProgress: fulfillmentSplits.filter(f => 
        f.status === FulfillmentStatus.PENDING || f.status === FulfillmentStatus.PROCESSING
      ).length > 0 ? confirmedQuotationIds.filter(id => 
        fulfillmentSplits.some(f => 
          f.quotationLine.quotation.quotationNumber && 
          (f.status === FulfillmentStatus.PENDING || f.status === FulfillmentStatus.PROCESSING)
        )
      ).length : 0,
      shippingToday: fulfillmentSplits.filter(f => 
        f.estimatedShipDate && 
        new Date(f.estimatedShipDate) >= today && 
        new Date(f.estimatedShipDate) < tomorrow &&
        f.status !== FulfillmentStatus.SHIPPED &&
        f.status !== FulfillmentStatus.DELIVERED
      ).length,
      delivered: fulfillmentSplits.filter(f => f.status === FulfillmentStatus.DELIVERED).length,
    };

    // Fetch invoice statistics
    const invoices = await prisma.invoice.findMany({
      where: {
        quotation: { customerId },
      },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        status: true,
        dueDate: true,
        updatedAt: true,
      },
    });

    const invoiceStats = {
      outstandingBalance: invoices
        .filter(i => i.status === InvoiceStatus.SENT || i.status === InvoiceStatus.OVERDUE)
        .reduce((sum, i) => sum + i.totalAmount.toNumber(), 0),
      overdueCount: invoices.filter(i => i.status === InvoiceStatus.OVERDUE).length,
      pendingCount: invoices.filter(i => i.status === InvoiceStatus.SENT).length,
    };

    // Fetch recent activity (last 10 items)
    const recentActivity: PortalDashboardStats['recentActivity'] = [];

    // Recent quotation updates
    const recentQuotations = await prisma.quotation.findMany({
      where: { customerId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        quotationNumber: true,
        status: true,
        totalAmount: true,
        updatedAt: true,
      },
    });

    for (const q of recentQuotations) {
      let action = 'Updated';
      let description = `Quotation ${q.quotationNumber}`;
      
      if (q.status === QuotationStatus.APPROVED) {
        action = 'Ready for Review';
        description = `${q.quotationNumber} is ready for your review ($${q.totalAmount.toNumber().toLocaleString()})`;
      } else if (q.status === QuotationStatus.CONFIRMED) {
        action = 'Confirmed';
        description = `${q.quotationNumber} has been confirmed`;
      } else if (q.status === QuotationStatus.DRAFT) {
        action = 'In Progress';
        description = `${q.quotationNumber} is being prepared by sales`;
      } else if (q.status === QuotationStatus.PENDING_MANAGER_APPROVAL || q.status === QuotationStatus.PENDING_FINANCE_APPROVAL) {
        action = 'Under Review';
        description = `${q.quotationNumber} is under internal review`;
      }

      recentActivity.push({
        id: `quotation-${q.id}`,
        type: 'QUOTATION',
        action,
        description,
        timestamp: q.updatedAt.toISOString(),
        relatedId: q.id,
        relatedNumber: q.quotationNumber,
      });
    }

    // Recent invoice updates
    const recentInvoices = await prisma.invoice.findMany({
      where: { quotation: { customerId } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        totalAmount: true,
        updatedAt: true,
      },
    });

    for (const inv of recentInvoices) {
      let action = 'Updated';
      let description = `Invoice ${inv.invoiceNumber}`;
      
      if (inv.status === InvoiceStatus.SENT) {
        action = 'Payment Due';
        description = `${inv.invoiceNumber} - $${inv.totalAmount.toNumber().toLocaleString()} due`;
      } else if (inv.status === InvoiceStatus.PAID) {
        action = 'Paid';
        description = `${inv.invoiceNumber} payment received`;
      } else if (inv.status === InvoiceStatus.OVERDUE) {
        action = 'Overdue';
        description = `${inv.invoiceNumber} - $${inv.totalAmount.toNumber().toLocaleString()} overdue`;
      }

      recentActivity.push({
        id: `invoice-${inv.id}`,
        type: 'INVOICE',
        action,
        description,
        timestamp: inv.updatedAt.toISOString(),
        relatedId: inv.id,
        relatedNumber: inv.invoiceNumber,
      });
    }

    // Sort by timestamp and take top 10
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const topActivity = recentActivity.slice(0, 10);

    const stats: PortalDashboardStats = {
      quotations: quotationStats,
      orders: orderStats,
      invoices: invoiceStats,
      recentActivity: topActivity,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[Portal/Dashboard] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// ===========================================
// DealFlow360 - Subscriptions List API
// ===========================================
// M4 - Dev A: Subscriptions list and filters
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ActorType, BillingScheduleStatus } from '@/lib/types';
import { paginationSchema, subscriptionFiltersSchema } from '@/lib/validators';
import { getSubscriptions } from '@/lib/services/billingService';

// GET /api/billing/subscriptions - List all subscriptions
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse pagination
    const pagination = paginationSchema.parse({
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    // Parse filters
    const filtersInput = {
      status: searchParams.get('status') || undefined,
      customerId: searchParams.get('customerId') || undefined,
      quotationId: searchParams.get('quotationId') || undefined,
      productId: searchParams.get('productId') || undefined,
      search: searchParams.get('search') || undefined,
    };
    
    const filters = subscriptionFiltersSchema.parse(filtersInput);

    const result = await getSubscriptions(
      {
        status: filters.status as BillingScheduleStatus | undefined,
        customerId: filters.customerId,
        quotationId: filters.quotationId,
        productId: filters.productId,
        search: filters.search,
      },
      {
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortBy: pagination.sortBy || 'createdAt',
        sortOrder: pagination.sortOrder,
      }
    );

    // Format response
    const formattedData = result.data.map(sub => ({
      id: sub.id,
      productId: sub.productId,
      productName: sub.product.name,
      productSku: sub.product.sku,
      quantity: sub.quantity,
      unitPrice: sub.unitPrice.toNumber(),
      discountPct: sub.discountPct.toNumber(),
      lineTotal: sub.lineTotal.toNumber(),
      billingFrequency: sub.billingFrequency,
      quotationId: sub.quotationId,
      quotationNumber: sub.quotation.quotationNumber,
      quotationStatus: sub.quotation.status,
      customer: {
        id: sub.quotation.customer.id,
        name: sub.quotation.customer.name,
        email: sub.quotation.customer.email,
        tier: sub.quotation.customer.tier,
      },
      rep: sub.quotation.rep ?? null,
      subscriptionStatus: sub.subscriptionStatus,
      totalSchedules: sub.totalSchedules,
      upcomingCount: sub.upcomingCount,
      paidCount: sub.paidCount,
      cancelledCount: sub.cancelledCount,
      nextBillingDate: sub.nextBillingDate instanceof Date ? sub.nextBillingDate.toISOString() : null,
      nextBillingAmount: sub.nextBillingAmount ? Number(sub.nextBillingAmount) : null,
      createdAt: sub.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
      pagination: {
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        totalItems: result.pagination.total,
        totalPages: result.pagination.totalPages,
      },
    });
  } catch (error) {
    console.error('[Billing/Subscriptions/List] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[Billing/Subscriptions/List] Stack:', errorStack);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: errorMessage } },
      { status: 500 }
    );
  }
}

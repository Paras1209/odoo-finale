// ===========================================
// DealFlow360 - Fulfillment API
// ===========================================
// DEV B's MODULE: Fulfillment splits management
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ActorType } from '@/lib/types';
import { FulfillmentStatus } from '@prisma/client';
import { 
  getFulfillmentSplits, 
  getFulfillmentSummary,
  getBackorders,
  checkBackorderAvailability,
  getDeliverySlippageAlerts,
} from '@/lib/services';

// GET /api/fulfillment - List fulfillment splits with filters
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
    
    // Check for special endpoints
    const view = searchParams.get('view');
    
    // Summary view
    if (view === 'summary') {
      const summary = await getFulfillmentSummary();
      return NextResponse.json({
        success: true,
        data: summary,
      });
    }

    // Backorders view
    if (view === 'backorders') {
      const pageParam = searchParams.get('page');
      const pageSizeParam = searchParams.get('pageSize');
      
      const pagination: Record<string, number> = {};
      if (pageParam) pagination.page = parseInt(pageParam);
      if (pageSizeParam) pagination.pageSize = parseInt(pageSizeParam);

      const result = await getBackorders(pagination);
      return NextResponse.json({
        success: true,
        data: result.data.map(formatFulfillmentSplit),
        pagination: result.pagination,
      });
    }

    // Backorder availability check
    if (view === 'backorder-availability') {
      const availability = await checkBackorderAvailability();
      return NextResponse.json({
        success: true,
        data: availability,
      });
    }

    // Delivery slippage alerts
    if (view === 'slippage') {
      const alerts = await getDeliverySlippageAlerts();
      return NextResponse.json({
        success: true,
        data: alerts,
      });
    }

    // Build pagination params
    const paginationInput: Record<string, string | number> = {};
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    const sortByParam = searchParams.get('sortBy');
    const sortOrderParam = searchParams.get('sortOrder');
    
    if (pageParam) paginationInput.page = parseInt(pageParam);
    if (pageSizeParam) paginationInput.pageSize = parseInt(pageSizeParam);
    if (sortByParam) paginationInput.sortBy = sortByParam;
    if (sortOrderParam) paginationInput.sortOrder = sortOrderParam as 'asc' | 'desc';

    // Build filters
    const statusParam = searchParams.get('status');
    const isBackorderParam = searchParams.get('isBackorder');
    const warehouseIdParam = searchParams.get('warehouseId');
    const quotationIdParam = searchParams.get('quotationId');

    const filters: Record<string, unknown> = {};
    if (statusParam && Object.values(FulfillmentStatus).includes(statusParam as FulfillmentStatus)) {
      filters.status = statusParam as FulfillmentStatus;
    }
    if (isBackorderParam) {
      filters.isBackorder = isBackorderParam === 'true';
    }
    if (warehouseIdParam) {
      filters.warehouseId = warehouseIdParam;
    }
    if (quotationIdParam) {
      filters.quotationId = quotationIdParam;
    }

    const result = await getFulfillmentSplits(filters, paginationInput);

    return NextResponse.json({
      success: true,
      data: result.data.map(formatFulfillmentSplit),
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('[Fulfillment/List] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: errorMessage } },
      { status: 500 }
    );
  }
}

// Helper to format fulfillment split for API response
function formatFulfillmentSplit(split: {
  id: string;
  quotationLineId: string;
  warehouseId: string;
  quantityFulfilled: number;
  isBackorder: boolean;
  isManualOverride: boolean;
  estimatedShipDate: Date | null;
  actualShipDate: Date | null;
  status: FulfillmentStatus;
  createdAt: Date;
  updatedAt: Date;
  warehouse: { id: string; name: string; code: string };
  quotationLine: {
    id: string;
    quantity: number;
    product: { id: string; name: string; sku: string | null; category: string };
    quotation: {
      id: string;
      quotationNumber: string;
      status: string;
      customer: { id: string; name: string; companyName: string | null };
    };
  };
}) {
  return {
    id: split.id,
    quotationLineId: split.quotationLineId,
    warehouseId: split.warehouseId,
    warehouseName: split.warehouse.name,
    warehouseCode: split.warehouse.code,
    quantityFulfilled: split.quantityFulfilled,
    isBackorder: split.isBackorder,
    isManualOverride: split.isManualOverride,
    estimatedShipDate: split.estimatedShipDate?.toISOString() || null,
    actualShipDate: split.actualShipDate?.toISOString() || null,
    status: split.status,
    product: {
      id: split.quotationLine.product.id,
      name: split.quotationLine.product.name,
      sku: split.quotationLine.product.sku,
      category: split.quotationLine.product.category,
    },
    quotation: {
      id: split.quotationLine.quotation.id,
      quotationNumber: split.quotationLine.quotation.quotationNumber,
      status: split.quotationLine.quotation.status,
      customerName: split.quotationLine.quotation.customer.companyName || split.quotationLine.quotation.customer.name,
    },
    lineQuantity: split.quotationLine.quantity,
    createdAt: split.createdAt.toISOString(),
    updatedAt: split.updatedAt.toISOString(),
  };
}

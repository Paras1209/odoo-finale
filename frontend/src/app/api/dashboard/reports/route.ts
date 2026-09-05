// ===========================================
// DealFlow360 - Reports API
// ===========================================
// DEV B's MODULE: Sales reports with filters
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ActorType } from '@/lib/types';
import { generateSalesReport, type ReportFilters } from '@/lib/services';

// GET /api/dashboard/reports - Generate sales report
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

    // Build filters
    const filters: ReportFilters = {};

    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const repIdParam = searchParams.get('repId');
    const customerIdParam = searchParams.get('customerId');

    if (startDateParam) {
      filters.startDate = new Date(startDateParam);
    }
    if (endDateParam) {
      filters.endDate = new Date(endDateParam);
    }
    if (repIdParam) {
      filters.repId = repIdParam;
    }
    if (customerIdParam) {
      filters.customerId = customerIdParam;
    }

    const report = await generateSalesReport(filters);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('[Reports] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: errorMessage } },
      { status: 500 }
    );
  }
}

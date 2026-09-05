// ===========================================
// DealFlow360 - Billing Cron Job
// ===========================================
// Processes due billing schedules and overdue invoices.
// Should be called periodically by an external cron service
// (e.g., Vercel Cron, cron-job.org, EasyCron, GitHub Actions)
// Recommended frequency: Daily at midnight or hourly
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { 
  processDueBillingSchedules, 
  processOverdueInvoices,
} from '@/lib/services';

// Secret key to protect the endpoint from unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify the request is authorized
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const startTime = Date.now();
  const results = {
    billingSchedules: {
      processed: 0,
      invoicesGenerated: 0,
      errors: [] as string[],
    },
    overdueInvoices: {
      updated: 0,
    },
  };

  try {
    // 1. Process due billing schedules (generate recurring invoices)
    console.log('[CRON/Billing] Processing due billing schedules...');
    const billingResult = await processDueBillingSchedules();
    results.billingSchedules = billingResult;
    console.log(`[CRON/Billing] Billing schedules: ${billingResult.processed} processed, ${billingResult.invoicesGenerated} invoices generated`);

    // 2. Process overdue invoices (mark SENT invoices as OVERDUE if past due date)
    console.log('[CRON/Billing] Processing overdue invoices...');
    const overdueResult = await processOverdueInvoices();
    results.overdueInvoices = {
      updated: overdueResult.updated,
    };
    console.log(`[CRON/Billing] Overdue invoices: ${overdueResult.updated} marked as overdue`);

    const duration = Date.now() - startTime;
    const hasErrors = results.billingSchedules.errors.length > 0;

    return NextResponse.json(
      {
        status: hasErrors ? 'partial_success' : 'success',
        message: 'Billing cron job completed',
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[CRON/Billing] Billing cron job failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Billing cron job failed',
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
        partialResults: results,
      },
      { status: 500 }
    );
  }
}

// Also support POST for cron services that prefer POST requests
export async function POST(request: NextRequest) {
  return GET(request);
}

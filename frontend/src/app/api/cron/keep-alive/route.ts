// ===========================================
// DealFlow360 - Database Keep-Alive Cron Job
// ===========================================
// This endpoint should be called periodically by an external cron service
// (e.g., Vercel Cron, cron-job.org, EasyCron, GitHub Actions)
// to prevent the database from transitioning to idle state.
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Secret key to protect the endpoint from unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify the request is authorized (optional but recommended)
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const startTime = Date.now();

  try {
    // Ping the database with a simple query
    await prisma.$queryRaw`SELECT 1 as ping`;
    
    // Optionally run a lightweight read query to keep connection warm
    const userCount = await prisma.user.count();
    
    const duration = Date.now() - startTime;

    return NextResponse.json(
      {
        status: 'success',
        message: 'Database keep-alive ping successful',
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        stats: {
          userCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[CRON] Database keep-alive failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Database keep-alive ping failed',
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

// Also support POST for cron services that prefer POST requests
export async function POST(request: NextRequest) {
  return GET(request);
}

// ===========================================
// DealFlow360 - Health Check API
// ===========================================

import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db';

export async function GET() {
  const dbHealthy = await checkDatabaseHealth();
  
  return NextResponse.json(
    {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: dbHealthy ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV,
    },
    { status: dbHealthy ? 200 : 503 }
  );
}

// ===========================================
// DealFlow360 - API Info Endpoint
// ===========================================

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'DealFlow360 API',
    version: '1.0.0',
    description: 'Intelligent Sales Operations Platform',
    framework: 'Next.js 14',
    endpoints: {
      auth: '/api/auth',
      quotation: '/api/quotation',
      approval: '/api/approval',
      catalog: '/api/catalog',
      fulfillment: '/api/fulfillment',
      billing: '/api/billing',
      portal: '/api/portal',
      dashboard: '/api/dashboard',
      upsell: '/api/upsell',
      health: '/api/health',
    },
  });
}

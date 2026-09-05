// ===========================================
// DealFlow360 - Customers API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType } from '@/lib/types';

// GET /api/customers - List all customers (for internal users)
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
    const search = searchParams.get('search') || '';
    const tier = searchParams.get('tier');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const customers = await prisma.customer.findMany({
      where: {
        ...(activeOnly && { isActive: true }),
        ...(tier && { tier: tier as any }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { companyName: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        tier: true,
        companyName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { quotations: true },
        },
      },
      orderBy: { name: 'asc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: customers.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        tier: c.tier,
        companyName: c.companyName,
        phone: c.phone,
        isActive: c.isActive,
        quotationCount: c._count.quotations,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[Customers/List] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

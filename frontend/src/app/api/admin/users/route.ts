// ===========================================
// DealFlow360 - Admin Users API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, UserRole } from '@/lib/types';
import { paginationSchema } from '@/lib/validators';
import { auditLogger } from '@/lib/services';
import bcrypt from 'bcryptjs';

// GET /api/admin/users - List all internal users
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Only ADMIN can view users
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Build pagination params
    const paginationInput: Record<string, string | undefined> = {};
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');

    if (pageParam) paginationInput.page = pageParam;
    if (pageSizeParam) paginationInput.pageSize = pageSizeParam;

    const pagination = paginationSchema.parse(paginationInput);

    const roleParam = searchParams.get('role');
    const isActiveParam = searchParams.get('isActive');
    const search = searchParams.get('search');

    const where = {
      ...(roleParam && { role: roleParam as UserRole }),
      ...(isActiveParam && { isActive: isActiveParam === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [users, total, roleCounts] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              quotations: true,
              approvals: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      prisma.user.count({ where }),
      // Get role counts for ALL active users (independent of filters/pagination)
      prisma.user.groupBy({
        by: ['role'],
        where: { isActive: true },
        _count: { role: true },
      }),
    ]);

    // Transform role counts into a map
    const roleCountsMap: Record<string, number> = {
      SALES_REP: 0,
      SALES_MANAGER: 0,
      FINANCE_OPS: 0,
      ADMIN: 0,
    };
    for (const rc of roleCounts) {
      roleCountsMap[rc.role] = rc._count.role;
    }

    return NextResponse.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        quotationCount: u._count.quotations,
        approvalCount: u._count.approvals,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        totalPages: Math.ceil(total / pagination.pageSize),
      },
      roleCounts: roleCountsMap,
    });
  } catch (error) {
    console.error('[Admin/Users/List] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Name, email, and password are required' } },
        { status: 400 }
      );
    }

    // Check for existing user
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'A user with this email already exists' } },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || UserRole.SALES_REP,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await auditLogger.logCreate(session.user.id, ActorType.INTERNAL, 'USER', user.id, {
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json(
      {
        success: true,
        data: user,
        message: 'User created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Admin/Users/Create] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

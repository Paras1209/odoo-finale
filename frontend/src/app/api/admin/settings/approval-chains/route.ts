// ===========================================
// DealFlow360 - Admin Approval Chains API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType, UserRole } from '@/lib/types';
import { createApprovalChainSchema } from '@/lib/validators';

// GET /api/admin/settings/approval-chains - List all approval chains
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.INTERNAL) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Only ADMIN and SALES_MANAGER can view settings
    if (![UserRole.ADMIN, UserRole.SALES_MANAGER].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin or Manager access required' } },
        { status: 403 }
      );
    }

    const approvalChains = await prisma.approvalChain.findMany({
      orderBy: { minRiskScore: 'asc' },
    });

    // Transform decimal values to numbers
    const transformed = approvalChains.map(chain => ({
      id: chain.id,
      minRiskScore: chain.minRiskScore.toNumber(),
      maxRiskScore: chain.maxRiskScore.toNumber(),
      requiresManager: chain.requiresManager,
      requiresFinance: chain.requiresFinance,
    }));

    // If no chains exist, return defaults
    if (transformed.length === 0) {
      return NextResponse.json({
        success: true,
        data: getDefaultChains(),
        isDefault: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: transformed,
      isDefault: false,
    });
  } catch (error) {
    console.error('[Admin/ApprovalChains] GET Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings/approval-chains - Create approval chain
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
    const parsed = createApprovalChainSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
        { status: 400 }
      );
    }

    const { minRiskScore, maxRiskScore, requiresManager, requiresFinance } = parsed.data;

    // Validate score range
    if (minRiskScore > maxRiskScore) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Min score cannot be greater than max score' } },
        { status: 400 }
      );
    }

    const approvalChain = await prisma.approvalChain.create({
      data: { minRiskScore, maxRiskScore, requiresManager, requiresFinance },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: approvalChain.id,
        minRiskScore: approvalChain.minRiskScore.toNumber(),
        maxRiskScore: approvalChain.maxRiskScore.toNumber(),
        requiresManager: approvalChain.requiresManager,
        requiresFinance: approvalChain.requiresFinance,
      },
      message: 'Approval chain created successfully',
    });
  } catch (error) {
    console.error('[Admin/ApprovalChains] POST Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings/approval-chains - Bulk update approval chains
export async function PUT(request: NextRequest) {
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
    const { chains } = body;

    if (!Array.isArray(chains)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Chains array required' } },
        { status: 400 }
      );
    }

    // Delete existing chains and recreate
    await prisma.approvalChain.deleteMany({});

    const created = await prisma.approvalChain.createMany({
      data: chains.map((c: any) => ({
        minRiskScore: c.minRiskScore,
        maxRiskScore: c.maxRiskScore,
        requiresManager: c.requiresManager,
        requiresFinance: c.requiresFinance,
      })),
    });

    return NextResponse.json({
      success: true,
      data: { count: created.count },
      message: 'Approval chains updated successfully',
    });
  } catch (error) {
    console.error('[Admin/ApprovalChains] PUT Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/settings/approval-chains - Delete approval chain by ID (via query param)
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ID required' } },
        { status: 400 }
      );
    }

    await prisma.approvalChain.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Approval chain deleted successfully',
    });
  } catch (error) {
    console.error('[Admin/ApprovalChains] DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

function getDefaultChains() {
  return [
    { id: null, minRiskScore: 0, maxRiskScore: 0, requiresManager: false, requiresFinance: false, isDefault: true },
    { id: null, minRiskScore: 1, maxRiskScore: 10, requiresManager: true, requiresFinance: false, isDefault: true },
    { id: null, minRiskScore: 11, maxRiskScore: 100, requiresManager: true, requiresFinance: true, isDefault: true },
  ];
}

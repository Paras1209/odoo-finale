// ===========================================
// DealFlow360 - Portal Password Change API
// ===========================================
// Change customer portal password
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType } from '@/lib/types';
import { comparePassword, hashPassword } from '@/lib/services/authService';
import { auditLogger } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.CUSTOMER) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Portal authentication required' } },
        { status: 401 }
      );
    }

    const customerId = session.user.id;
    const body = await request.json();

    const { currentPassword, newPassword, confirmPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'All password fields are required' } },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'New passwords do not match' } },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters long' } },
        { status: 400 }
      );
    }

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        portalPasswordHash: true,
      },
    });

    if (!customer || !customer.portalPasswordHash) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Customer not found or password not set' } },
        { status: 404 }
      );
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, customer.portalPasswordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' } },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await prisma.customer.update({
      where: { id: customerId },
      data: { portalPasswordHash: newPasswordHash },
    });

    // Audit log
    await auditLogger.log({
      entityType: 'CUSTOMER',
      entityId: customerId,
      actorId: customerId,
      actorType: ActorType.CUSTOMER,
      action: 'CHANGE_PASSWORD',
      beforeState: null,
      afterState: null,
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('[Portal/Account/Password] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

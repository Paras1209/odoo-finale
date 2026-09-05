// ===========================================
// DealFlow360 - Portal Account API
// ===========================================
// GET and UPDATE customer profile information
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ActorType } from '@/lib/types';
import { auditLogger } from '@/lib/services';

export interface PortalAccountDTO {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  phone: string | null;
  address: string | null;
  tier: string;
  createdAt: string;
}

// GET - Fetch customer profile
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.actorType !== ActorType.CUSTOMER) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Portal authentication required' } },
        { status: 401 }
      );
    }

    const customerId = session.user.id;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        phone: true,
        address: true,
        tier: true,
        createdAt: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } },
        { status: 404 }
      );
    }

    const result: PortalAccountDTO = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      companyName: customer.companyName,
      phone: customer.phone,
      address: customer.address,
      tier: customer.tier,
      createdAt: customer.createdAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Portal/Account] GET Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// PUT - Update customer profile
export async function PUT(request: NextRequest) {
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

    // Get current customer for audit
    const currentCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!currentCustomer) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } },
        { status: 404 }
      );
    }

    // Validate and sanitize input
    const updateData: {
      name?: string;
      companyName?: string | null;
      phone?: string | null;
      address?: string | null;
    } = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 2 || name.length > 100) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Name must be between 2 and 100 characters' } },
          { status: 400 }
        );
      }
      updateData.name = name;
    }

    if (body.companyName !== undefined) {
      updateData.companyName = body.companyName ? String(body.companyName).trim() : null;
    }

    if (body.phone !== undefined) {
      const phone = body.phone ? String(body.phone).trim() : null;
      if (phone && !/^[\d\s\+\-\(\)\.]+$/.test(phone)) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid phone number format' } },
          { status: 400 }
        );
      }
      updateData.phone = phone;
    }

    if (body.address !== undefined) {
      updateData.address = body.address ? String(body.address).trim() : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No valid fields to update' } },
        { status: 400 }
      );
    }

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        phone: true,
        address: true,
        tier: true,
        createdAt: true,
      },
    });

    // Audit log
    await auditLogger.logUpdate(
      customerId,
      ActorType.CUSTOMER,
      'CUSTOMER',
      customerId,
      {
        name: currentCustomer.name,
        companyName: currentCustomer.companyName,
        phone: currentCustomer.phone,
        address: currentCustomer.address,
      },
      updateData as Record<string, unknown>
    );

    const result: PortalAccountDTO = {
      id: updatedCustomer.id,
      name: updatedCustomer.name,
      email: updatedCustomer.email,
      companyName: updatedCustomer.companyName,
      phone: updatedCustomer.phone,
      address: updatedCustomer.address,
      tier: updatedCustomer.tier,
      createdAt: updatedCustomer.createdAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('[Portal/Account] PUT Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

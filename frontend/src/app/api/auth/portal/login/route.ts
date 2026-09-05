// ===========================================
// DealFlow360 - Portal Customer Login API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { loginCustomer, isAuthError, auditLogger } from '@/lib/services';
import { portalLoginSchema } from '@/lib/validators';
import { ActorType } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = portalLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const result = await loginCustomer(email, password);

    // Log portal login
    await auditLogger.logAuth(result.customer.id, ActorType.CUSTOMER, 'LOGIN');

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (isAuthError(error)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: 401 }
      );
    }

    console.error('[Auth/Portal/Login] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}

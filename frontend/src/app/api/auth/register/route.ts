// ===========================================
// DealFlow360 - User Registration API
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { registerUser, isAuthError, auditLogger } from '@/lib/services';
import { registerSchema } from '@/lib/validators';
import { ActorType } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

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

    const { name, email, password, role } = parsed.data;
    const user = await registerUser(name, email, password, role);

    // Log registration
    await auditLogger.logAuth(user.id, ActorType.INTERNAL, 'REGISTER', { email });

    return NextResponse.json(
      {
        success: true,
        data: user,
        message: 'User registered successfully',
      },
      { status: 201 }
    );
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
        { status: 400 }
      );
    }

    console.error('[Auth/Register] Error:', error);
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

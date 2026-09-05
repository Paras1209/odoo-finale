// ===========================================
// DealFlow360 - User Login API (Direct JWT)
// ===========================================
// This route provides direct JWT tokens for API clients
// For browser auth, use NextAuth.js (/api/auth/*)

import { NextRequest, NextResponse } from 'next/server';
import { loginUser, isAuthError, auditLogger } from '@/lib/services';
import { loginSchema } from '@/lib/validators';
import { ActorType } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

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
    const result = await loginUser(email, password);

    // Log login
    await auditLogger.logAuth(result.user.id, ActorType.INTERNAL, 'LOGIN');

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

    console.error('[Auth/Login] Error:', error);
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

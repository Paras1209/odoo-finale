// ===========================================
// DealFlow360 - Current User Profile API
// ===========================================

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        tier: session.user.tier,
        actorType: session.user.actorType,
      },
    });
  } catch (error) {
    console.error('[Auth/Me] Error:', error);
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

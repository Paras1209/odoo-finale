// ===========================================
// DealFlow360 - Logout API Route
// ===========================================
// Handles logout for direct API clients using JWT tokens.
// NextAuth.js clients should use signOut() from next-auth/react.
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/logout
 * 
 * Clears authentication cookies and invalidates the session.
 * For JWT-based auth, we clear the cookies since JWTs are stateless.
 * 
 * Note: For production environments with strict security requirements,
 * consider implementing a token blacklist with Redis for JWT invalidation.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Clear NextAuth.js session cookies
    const cookiesToClear = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Secure-next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
      // Also clear any custom auth cookies
      'auth-token',
      'portal-token',
    ];
    
    for (const cookieName of cookiesToClear) {
      cookieStore.delete(cookieName);
    }
    
    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to logout' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/logout
 * 
 * Redirect-based logout for browser clients.
 * Clears cookies and redirects to login page.
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  
  // Clear all auth cookies
  const cookiesToClear = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.csrf-token',
    '__Secure-next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.callback-url',
    'auth-token',
    'portal-token',
  ];
  
  for (const cookieName of cookiesToClear) {
    cookieStore.delete(cookieName);
  }
  
  // Determine redirect URL based on referer or default to login
  const referer = request.headers.get('referer') || '';
  const redirectUrl = referer.includes('/portal') 
    ? '/portal/login' 
    : '/auth/login';
  
  return NextResponse.redirect(new URL(redirectUrl, request.url));
}

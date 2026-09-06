// ===========================================
// DealFlow360 - User Login API (Direct JWT)
// ===========================================
// This route provides direct JWT tokens for API clients
// For browser auth, use NextAuth.js (/api/auth/*)

import { NextRequest } from 'next/server';
import { loginUser, isAuthError, auditLogger } from '@/lib/services';
import { loginSchema } from '@/lib/validators';
import { ActorType } from '@/lib/types';
import { 
  apiSuccess, 
  apiError, 
  apiValidationError,
  withErrorHandling,
} from '@/lib/api-utils';
import { ErrorCode, errorLogger } from '@/lib/errors';

export async function POST(request: NextRequest) {
  return withErrorHandling('Auth/Login', async () => {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { email, password } = parsed.data;
    
    try {
      const result = await loginUser(email, password);

      // Log successful login
      await auditLogger.logAuth(result.user.id, ActorType.INTERNAL, 'LOGIN');
      
      errorLogger.info('Auth/Login', 'User logged in successfully', { 
        userId: result.user.id 
      });

      return apiSuccess(result);
    } catch (error) {
      if (isAuthError(error)) {
        errorLogger.info('Auth/Login', 'Login failed', { 
          email, 
          errorCode: error.code 
        });
        
        return apiError(error.code as ErrorCode, error.message);
      }
      
      throw error;
    }
  });
}

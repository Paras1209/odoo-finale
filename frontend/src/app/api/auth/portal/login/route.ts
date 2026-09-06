// ===========================================
// DealFlow360 - Portal Customer Login API
// ===========================================

import { NextRequest } from 'next/server';
import { loginCustomer, isAuthError, auditLogger } from '@/lib/services';
import { portalLoginSchema } from '@/lib/validators';
import { ActorType } from '@/lib/types';
import { 
  apiSuccess, 
  apiError, 
  apiValidationError,
  withErrorHandling,
} from '@/lib/api-utils';
import { ErrorCode, errorLogger } from '@/lib/errors';

export async function POST(request: NextRequest) {
  return withErrorHandling('Auth/Portal/Login', async () => {
    const body = await request.json();
    const parsed = portalLoginSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { email, password } = parsed.data;
    
    try {
      const result = await loginCustomer(email, password);

      // Log portal login
      await auditLogger.logAuth(result.customer.id, ActorType.CUSTOMER, 'LOGIN');
      
      errorLogger.info('Auth/Portal/Login', 'Customer logged in successfully', { 
        customerId: result.customer.id 
      });

      return apiSuccess(result);
    } catch (error) {
      if (isAuthError(error)) {
        errorLogger.info('Auth/Portal/Login', 'Login failed', { 
          email, 
          errorCode: error.code 
        });
        
        return apiError(error.code as ErrorCode, error.message);
      }
      
      throw error;
    }
  });
}

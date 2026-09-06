// ===========================================
// DealFlow360 - Portal Customer Registration API
// ===========================================

import { NextRequest } from 'next/server';
import { registerCustomer, isAuthError, auditLogger } from '@/lib/services';
import { portalRegisterSchema } from '@/lib/validators';
import { ActorType, CustomerTier } from '@/lib/types';
import { 
  apiSuccess, 
  apiError, 
  apiValidationError,
  withErrorHandling,
} from '@/lib/api-utils';
import { ErrorCode, errorLogger } from '@/lib/errors';

export async function POST(request: NextRequest) {
  return withErrorHandling('Auth/Portal/Register', async () => {
    let body;
    try {
      body = await request.json();
    } catch {
      return apiError(
        ErrorCode.VALIDATION_ERROR,
        'Invalid request body. Please provide valid JSON.'
      );
    }

    const parsed = portalRegisterSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { name, email, password, companyName, phone } = parsed.data;
    
    try {
      // Register customer with default BRONZE tier
      const customer = await registerCustomer(
        name,
        email,
        password,
        CustomerTier.BRONZE,
        companyName || undefined,
        phone || undefined
      );

      // Log registration
      await auditLogger.logAuth(customer.id, ActorType.CUSTOMER, 'REGISTER', { 
        email,
        companyName: companyName || null,
      });
      
      errorLogger.info('Auth/Portal/Register', 'Customer registered successfully', { 
        customerId: customer.id,
        email,
      });

      return apiSuccess({
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          tier: customer.tier,
          companyName: customer.companyName,
        },
        message: 'Account created successfully. You can now sign in.',
      }, 201);
    } catch (error) {
      if (isAuthError(error)) {
        errorLogger.info('Auth/Portal/Register', 'Registration failed', { 
          email, 
          errorCode: error.code,
        });
        
        // Map auth error codes to user-friendly messages
        if (error.code === 'EMAIL_EXISTS') {
          return apiError(
            ErrorCode.ALREADY_EXISTS,
            'An account with this email already exists. Please sign in or use a different email.'
          );
        }
        
        return apiError(error.code as ErrorCode, error.message);
      }
      
      throw error;
    }
  });
}

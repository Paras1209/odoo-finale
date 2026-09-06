// ===========================================
// DealFlow360 - API Route Utilities
// ===========================================
// Shared utilities for API routes with consistent error handling.
// ===========================================

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { 
  ErrorCode, 
  errorCodeToHttpStatus, 
  getUserFriendlyMessage,
  errorLogger,
  formatValidationErrors,
} from '@/lib/errors';

/**
 * Standard API success response
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Standard API success response with pagination
 */
export function apiSuccessWithPagination<T>(
  data: T,
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  },
  status = 200
) {
  return NextResponse.json({ success: true, data, pagination }, { status });
}

/**
 * Standard API error response with user-friendly message
 */
export function apiError(
  code: ErrorCode | string,
  message?: string,
  details?: unknown,
  status?: number
) {
  const errorCode = code as ErrorCode;
  const httpStatus = status || errorCodeToHttpStatus(errorCode);
  const userMessage = message || getUserFriendlyMessage(errorCode);

  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message: userMessage,
        details,
      },
    },
    { status: httpStatus }
  );
}

/**
 * Handle Zod validation errors
 */
export function apiValidationError(zodError: ZodError) {
  const flattened = zodError.flatten();
  const userMessage = formatValidationErrors({
    fieldErrors: flattened.fieldErrors as Record<string, string[]>,
    formErrors: flattened.formErrors,
  });

  return NextResponse.json(
    {
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: userMessage,
        details: flattened,
      },
    },
    { status: 400 }
  );
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function withErrorHandling(
  context: string,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  return handler().catch((error: unknown) => {
    // Log the error
    errorLogger.error(context, error, {
      errorType: error instanceof Error ? error.name : 'Unknown',
    });

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return apiValidationError(error);
    }

    // Handle known error types
    if (error instanceof Error) {
      // Check for Prisma errors
      if (error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error as { code?: string };
        
        if (prismaError.code === 'P2002') {
          return apiError(
            ErrorCode.ALREADY_EXISTS,
            'A record with this value already exists.'
          );
        }
        
        if (prismaError.code === 'P2025') {
          return apiError(
            ErrorCode.NOT_FOUND,
            'The requested record was not found.'
          );
        }

        return apiError(
          ErrorCode.DATABASE_ERROR,
          'A database error occurred. Please try again.'
        );
      }

      // Check for auth errors
      if (error.name === 'AuthError') {
        const authError = error as { code?: string };
        return apiError(
          authError.code || ErrorCode.UNAUTHORIZED,
          error.message
        );
      }
    }

    // Generic internal error
    return apiError(
      ErrorCode.INTERNAL_ERROR,
      undefined,
      process.env.NODE_ENV === 'development' 
        ? { message: error instanceof Error ? error.message : String(error) }
        : undefined
    );
  });
}

/**
 * Common error responses for reuse
 */
export const CommonErrors = {
  unauthorized: () => apiError(ErrorCode.UNAUTHORIZED),
  forbidden: () => apiError(ErrorCode.FORBIDDEN),
  notFound: (resource = 'Resource') => 
    apiError(ErrorCode.NOT_FOUND, `${resource} not found.`),
  sessionInvalid: () => 
    apiError(ErrorCode.SESSION_INVALID, 'Your session is invalid. Please log in again.'),
  validationFailed: (details?: unknown) => 
    apiError(ErrorCode.VALIDATION_ERROR, undefined, details),
};

// ===========================================
// DealFlow360 - Error Handling Middleware
// ===========================================
// PHASE 0: Global error handlers.
// ===========================================

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { ZodError } from 'zod';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
  }

  static badRequest(message: string, code: string = 'BAD_REQUEST', details?: unknown): ApiError {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED'): ApiError {
    return new ApiError(401, code, message);
  }

  static forbidden(message: string = 'Forbidden', code: string = 'FORBIDDEN'): ApiError {
    return new ApiError(403, code, message);
  }

  static notFound(message: string = 'Not found', code: string = 'NOT_FOUND'): ApiError {
    return new ApiError(404, code, message);
  }

  static conflict(message: string, code: string = 'CONFLICT'): ApiError {
    return new ApiError(409, code, message);
  }

  static internal(message: string = 'Internal server error', code: string = 'INTERNAL_ERROR'): ApiError {
    return new ApiError(500, code, message);
  }
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    },
  });
}

/**
 * Global error handler
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error in development
  if (env.isDevelopment) {
    console.error('[Error]', error);
  }

  // Handle known error types
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && env.isDevelopment ? { details: error.details } : {}),
      },
    });
    return;
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: error.flatten(),
      },
    });
    return;
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as Error & { code?: string };
    
    if (prismaError.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'A record with this value already exists',
        },
      });
      return;
    }
    
    if (prismaError.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Record not found',
        },
      });
      return;
    }
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
      },
    });
    return;
  }

  // Default: Internal server error
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.isDevelopment ? error.message : 'An unexpected error occurred',
      ...(env.isDevelopment ? { stack: error.stack } : {}),
    },
  });
}

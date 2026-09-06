// ===========================================
// DealFlow360 - Centralized Error Utilities
// ===========================================
// User-friendly error messages, error codes, and logging utilities.
// ===========================================

/**
 * Standard error codes used across the application
 */
export enum ErrorCode {
  // Network & Connection
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  SERVER_UNAVAILABLE = 'SERVER_UNAVAILABLE',
  
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_INVALID = 'SESSION_INVALID',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  NO_PORTAL_ACCESS = 'NO_PORTAL_ACCESS',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource Errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Business Logic
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',
  QUOTATION_EXPIRED = 'QUOTATION_EXPIRED',
  INVALID_DISCOUNT = 'INVALID_DISCOUNT',
  
  // Server Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Unknown
  UNKNOWN = 'UNKNOWN',
}

/**
 * Map of error codes to user-friendly messages
 */
const USER_FRIENDLY_MESSAGES: Record<ErrorCode, string> = {
  // Network & Connection
  [ErrorCode.NETWORK_ERROR]: 'Unable to connect to the server. Please check your internet connection and try again.',
  [ErrorCode.TIMEOUT]: 'The request took too long to complete. Please try again.',
  [ErrorCode.SERVER_UNAVAILABLE]: 'The server is temporarily unavailable. Please try again in a few moments.',
  
  // Authentication & Authorization
  [ErrorCode.UNAUTHORIZED]: 'Please log in to continue.',
  [ErrorCode.FORBIDDEN]: 'You don\'t have permission to perform this action.',
  [ErrorCode.SESSION_EXPIRED]: 'Your session has expired. Please log in again.',
  [ErrorCode.SESSION_INVALID]: 'Your session is no longer valid. Please log in again.',
  [ErrorCode.INVALID_CREDENTIALS]: 'The email or password you entered is incorrect.',
  [ErrorCode.ACCOUNT_DISABLED]: 'Your account has been disabled. Please contact support.',
  [ErrorCode.NO_PORTAL_ACCESS]: 'Portal access is not enabled for your account. Please contact your sales representative.',
  
  // Validation
  [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorCode.INVALID_INPUT]: 'The information you provided is invalid. Please check and try again.',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields.',
  
  // Resource Errors
  [ErrorCode.NOT_FOUND]: 'The requested item could not be found.',
  [ErrorCode.ALREADY_EXISTS]: 'This item already exists.',
  [ErrorCode.CONFLICT]: 'This action conflicts with another operation. Please refresh and try again.',
  
  // Business Logic
  [ErrorCode.INSUFFICIENT_STOCK]: 'There is not enough stock available to fulfill this request.',
  [ErrorCode.INVALID_STATUS_TRANSITION]: 'This action cannot be performed in the current status.',
  [ErrorCode.APPROVAL_REQUIRED]: 'This action requires approval from a manager.',
  [ErrorCode.QUOTATION_EXPIRED]: 'This quotation has expired and can no longer be modified.',
  [ErrorCode.INVALID_DISCOUNT]: 'The discount you entered exceeds the allowed limit.',
  
  // Server Errors
  [ErrorCode.INTERNAL_ERROR]: 'Something went wrong on our end. Please try again later.',
  [ErrorCode.DATABASE_ERROR]: 'We encountered a database issue. Please try again later.',
  
  // Unknown
  [ErrorCode.UNKNOWN]: 'An unexpected error occurred. Please try again.',
};

/**
 * Structured error for consistent error handling
 */
export interface AppError {
  code: ErrorCode | string;
  message: string;
  userMessage: string;
  details?: unknown;
  timestamp: string;
  requestId?: string;
}

/**
 * Get a user-friendly message for an error code
 */
export function getUserFriendlyMessage(code: string, fallback?: string): string {
  const errorCode = code as ErrorCode;
  return USER_FRIENDLY_MESSAGES[errorCode] || fallback || USER_FRIENDLY_MESSAGES[ErrorCode.UNKNOWN];
}

/**
 * Convert any error to a structured AppError
 */
export function toAppError(
  error: unknown,
  defaultCode: ErrorCode = ErrorCode.UNKNOWN
): AppError {
  const timestamp = new Date().toISOString();
  
  // Handle API response errors
  if (isApiError(error)) {
    const code = error.code || defaultCode;
    return {
      code,
      message: error.message || 'Unknown error',
      userMessage: getUserFriendlyMessage(code, error.message),
      details: error.details,
      timestamp,
    };
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      code: defaultCode,
      message: error.message,
      userMessage: getUserFriendlyMessage(defaultCode),
      details: { stack: error.stack },
      timestamp,
    };
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return {
      code: defaultCode,
      message: error,
      userMessage: getUserFriendlyMessage(defaultCode),
      timestamp,
    };
  }
  
  // Handle unknown errors
  return {
    code: defaultCode,
    message: 'An unknown error occurred',
    userMessage: getUserFriendlyMessage(defaultCode),
    details: error,
    timestamp,
  };
}

/**
 * Type guard for API error responses
 */
interface ApiErrorResponse {
  code?: string;
  message?: string;
  details?: unknown;
}

function isApiError(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('code' in error || 'message' in error)
  );
}

/**
 * Log level for error logging
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Structured log entry
 */
interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  error?: AppError;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Error logger utility
 */
class ErrorLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  /**
   * Log an error with context
   */
  error(context: string, error: unknown, metadata?: Record<string, unknown>): void {
    const appError = toAppError(error);
    const entry = this.createEntry(LogLevel.ERROR, context, appError.message, appError, metadata);
    this.output(entry);
  }
  
  /**
   * Log a warning
   */
  warn(context: string, message: string, metadata?: Record<string, unknown>): void {
    const entry = this.createEntry(LogLevel.WARN, context, message, undefined, metadata);
    this.output(entry);
  }
  
  /**
   * Log info (only in development)
   */
  info(context: string, message: string, metadata?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      const entry = this.createEntry(LogLevel.INFO, context, message, undefined, metadata);
      this.output(entry);
    }
  }
  
  /**
   * Log debug info (only in development)
   */
  debug(context: string, message: string, metadata?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      const entry = this.createEntry(LogLevel.DEBUG, context, message, undefined, metadata);
      this.output(entry);
    }
  }
  
  private createEntry(
    level: LogLevel,
    context: string,
    message: string,
    error?: AppError,
    metadata?: Record<string, unknown>
  ): LogEntry {
    return {
      level,
      context,
      message,
      error,
      metadata,
      timestamp: new Date().toISOString(),
    };
  }
  
  private output(entry: LogEntry): void {
    const prefix = `[${entry.context}]`;
    const formattedMessage = `${prefix} ${entry.message}`;
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        if (entry.error) {
          console.error(`${prefix} Error details:`, {
            code: entry.error.code,
            userMessage: entry.error.userMessage,
            details: entry.error.details,
          });
        }
        if (entry.metadata) {
          console.error(`${prefix} Metadata:`, entry.metadata);
        }
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        if (entry.metadata) {
          console.warn(`${prefix} Metadata:`, entry.metadata);
        }
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        if (entry.metadata) {
          console.info(`${prefix} Metadata:`, entry.metadata);
        }
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        if (entry.metadata) {
          console.debug(`${prefix} Metadata:`, entry.metadata);
        }
        break;
    }
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

/**
 * HTTP status code to error code mapping
 */
export function httpStatusToErrorCode(status: number): ErrorCode {
  switch (status) {
    case 400:
      return ErrorCode.VALIDATION_ERROR;
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 408:
      return ErrorCode.TIMEOUT;
    case 409:
      return ErrorCode.CONFLICT;
    case 422:
      return ErrorCode.INVALID_INPUT;
    case 500:
      return ErrorCode.INTERNAL_ERROR;
    case 502:
    case 503:
    case 504:
      return ErrorCode.SERVER_UNAVAILABLE;
    default:
      return ErrorCode.UNKNOWN;
  }
}

/**
 * Error code to HTTP status mapping
 */
export function errorCodeToHttpStatus(code: ErrorCode): number {
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_INPUT:
    case ErrorCode.MISSING_REQUIRED_FIELD:
    case ErrorCode.INVALID_DISCOUNT:
      return 400;
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.SESSION_EXPIRED:
    case ErrorCode.SESSION_INVALID:
    case ErrorCode.INVALID_CREDENTIALS:
      return 401;
    case ErrorCode.FORBIDDEN:
    case ErrorCode.ACCOUNT_DISABLED:
    case ErrorCode.NO_PORTAL_ACCESS:
      return 403;
    case ErrorCode.NOT_FOUND:
      return 404;
    case ErrorCode.CONFLICT:
    case ErrorCode.ALREADY_EXISTS:
    case ErrorCode.INVALID_STATUS_TRANSITION:
      return 409;
    case ErrorCode.INSUFFICIENT_STOCK:
    case ErrorCode.APPROVAL_REQUIRED:
    case ErrorCode.QUOTATION_EXPIRED:
      return 422;
    case ErrorCode.TIMEOUT:
      return 408;
    case ErrorCode.SERVER_UNAVAILABLE:
      return 503;
    case ErrorCode.INTERNAL_ERROR:
    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.UNKNOWN:
    default:
      return 500;
  }
}

/**
 * Format validation errors from Zod into user-friendly messages
 */
export function formatValidationErrors(
  zodErrors: { fieldErrors?: Record<string, string[]>; formErrors?: string[] }
): string {
  const messages: string[] = [];
  
  if (zodErrors.formErrors?.length) {
    messages.push(...zodErrors.formErrors);
  }
  
  if (zodErrors.fieldErrors) {
    for (const [field, errors] of Object.entries(zodErrors.fieldErrors)) {
      if (errors?.length) {
        // Convert camelCase to Title Case
        const fieldName = field
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          .trim();
        messages.push(`${fieldName}: ${errors[0]}`);
      }
    }
  }
  
  return messages.length > 0 
    ? messages.join('. ') 
    : 'Please check your input and try again.';
}

/**
 * Create a standardized API error response
 */
export function createApiErrorResponse(
  code: ErrorCode | string,
  message?: string,
  details?: unknown
) {
  const errorCode = code as ErrorCode;
  const userMessage = message || getUserFriendlyMessage(errorCode);
  
  return {
    success: false,
    error: {
      code,
      message: userMessage,
      details,
    },
  };
}

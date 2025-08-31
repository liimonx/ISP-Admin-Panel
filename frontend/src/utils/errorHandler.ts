import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  status?: number;
  timestamp?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export class AppError extends Error {
  public code: string;
  public status: number;
  public field?: string;
  public timestamp: string;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', status: number = 500, field?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.field = field;
    this.timestamp = new Date().toISOString();
  }
}

export class ValidationErrorHandler {
  static formatValidationErrors(errors: Record<string, string[]>): ValidationError[] {
    const formattedErrors: ValidationError[] = [];

    Object.entries(errors).forEach(([field, messages]) => {
      messages.forEach(message => {
        formattedErrors.push({ field, message });
      });
    });

    return formattedErrors;
  }

  static getFirstErrorMessage(errors: Record<string, string[]>): string {
    const firstField = Object.keys(errors)[0];
    return errors[firstField]?.[0] || 'Validation failed';
  }
}

export class ApiErrorHandler {
  static handleError(error: unknown): AppError {
    // Handle Axios errors
    if (this.isAxiosError(error)) {
      return this.handleAxiosError(error);
    }

    // Handle App errors
    if (error instanceof AppError) {
      return error;
    }

    // Handle generic errors
    if (error instanceof Error) {
      return new AppError(error.message, 'GENERIC_ERROR', 500);
    }

    // Handle unknown errors
    return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR', 500);
  }

  private static isAxiosError(error: unknown): error is AxiosError {
    return (error as AxiosError).isAxiosError === true;
  }

  private static handleAxiosError(error: AxiosError): AppError {
    const response = error.response;
    const request = error.request;

    // No response received (network error, timeout, etc.)
    if (request && !response) {
      return new AppError(
        'Network error - please check your connection',
        'NETWORK_ERROR',
        0
      );
    }

    // Response received with error status
    if (response) {
      const data = response.data as any;
      const status = response.status;

      // Handle standardized API error responses
      if (data && typeof data === 'object') {
        // New standardized format
        if (data.success === false && data.message) {
          return new AppError(data.message, data.code || this.getErrorCodeFromStatus(status), status);
        }

        // Handle validation errors
        if (data.errors && typeof data.errors === 'object') {
          const message = ValidationErrorHandler.getFirstErrorMessage(data.errors);
          return new AppError(message, 'VALIDATION_ERROR', status);
        }

        // Handle Django REST framework errors
        if (data.detail) {
          return new AppError(data.detail, this.getErrorCodeFromStatus(status), status);
        }

        // Handle field-specific errors
        if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
          return new AppError(data.non_field_errors[0], 'VALIDATION_ERROR', status);
        }

        // Handle generic message field
        if (data.message) {
          return new AppError(data.message, this.getErrorCodeFromStatus(status), status);
        }
      }

      // Fallback to status-based messages
      return new AppError(
        this.getDefaultErrorMessage(status),
        this.getErrorCodeFromStatus(status),
        status
      );
    }

    // Fallback for request errors
    return new AppError(
      error.message || 'Request failed',
      'REQUEST_ERROR',
      500
    );
  }

  private static getErrorCodeFromStatus(status: number): string {
    const statusCodeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      405: 'METHOD_NOT_ALLOWED',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };

    return statusCodeMap[status] || 'UNKNOWN_ERROR';
  }

  private static getDefaultErrorMessage(status: number): string {
    const statusMessageMap: Record<number, string> = {
      400: 'Invalid request data',
      401: 'Authentication required',
      403: 'Access denied',
      404: 'Resource not found',
      405: 'Method not allowed',
      409: 'Resource conflict',
      422: 'Invalid data provided',
      429: 'Too many requests - please wait',
      500: 'Internal server error',
      502: 'Service temporarily unavailable',
      503: 'Service unavailable',
      504: 'Request timeout',
    };

    return statusMessageMap[status] || 'An error occurred';
  }

  // Retry logic for specific error types
  static shouldRetry(error: AppError): boolean {
    const retryableErrors = [
      'NETWORK_ERROR',
      'INTERNAL_SERVER_ERROR',
      'BAD_GATEWAY',
      'SERVICE_UNAVAILABLE',
      'GATEWAY_TIMEOUT'
    ];

    return retryableErrors.includes(error.code);
  }

  static getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s...
    return Math.min(1000 * Math.pow(2, attempt), 10000);
  }
}

export class ErrorNotificationHandler {
  private static notificationCallbacks: Array<(error: AppError) => void> = [];

  static subscribe(callback: (error: AppError) => void): () => void {
    this.notificationCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.notificationCallbacks.indexOf(callback);
      if (index > -1) {
        this.notificationCallbacks.splice(index, 1);
      }
    };
  }

  static notify(error: AppError): void {
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error in notification callback:', err);
      }
    });
  }
}

// Utility functions for common error scenarios
export const ErrorUtils = {
  isNetworkError: (error: AppError): boolean => error.code === 'NETWORK_ERROR',
  isAuthError: (error: AppError): boolean => ['UNAUTHORIZED', 'FORBIDDEN'].includes(error.code),
  isValidationError: (error: AppError): boolean => error.code === 'VALIDATION_ERROR',
  isRateLimitError: (error: AppError): boolean => error.code === 'RATE_LIMITED',
  isServerError: (error: AppError): boolean => error.status >= 500,

  getUserFriendlyMessage: (error: AppError): string => {
    const friendlyMessages: Record<string, string> = {
      NETWORK_ERROR: 'Please check your internet connection and try again.',
      UNAUTHORIZED: 'Please log in to continue.',
      FORBIDDEN: 'You don\'t have permission to perform this action.',
      NOT_FOUND: 'The requested resource was not found.',
      RATE_LIMITED: 'You\'re making requests too quickly. Please wait a moment.',
      VALIDATION_ERROR: 'Please check your input and try again.',
      INTERNAL_SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
    };

    return friendlyMessages[error.code] || error.message;
  }
};

// Logger for error tracking
export class ErrorLogger {
  private static isDevelopment = process.env.NODE_ENV === 'development';

  static log(error: AppError, context?: Record<string, any>): void {
    const logEntry = {
      timestamp: error.timestamp,
      message: error.message,
      code: error.code,
      status: error.status,
      field: error.field,
      context,
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    if (this.isDevelopment) {
      console.error('API Error:', logEntry);
    } else {
      // In production, send to logging service
      this.sendToLoggingService(logEntry);
    }
  }

  private static sendToLoggingService(logEntry: any): void {
    // Implement your logging service integration here
    // e.g., Sentry, LogRocket, etc.
    try {
      // Example: window.Sentry?.captureException(logEntry);
      console.error('Production Error:', logEntry);
    } catch (err) {
      console.error('Failed to send error to logging service:', err);
    }
  }
}

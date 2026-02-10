/**
 * Error Handling Utilities
 * Centralized error handling with toast notifications
 * Requirements: 1.5, 14.1, 14.3, 14.4, 14.5
 */

import { toast } from 'sonner';

/**
 * Error types for categorization
 */
export enum ErrorType {
  NETWORK = 'network',
  API = 'api',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Error details interface
 */
export interface ErrorDetails {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error | unknown;
  context?: Record<string, unknown>;
  isRecoverable?: boolean;
  retryAction?: () => void | Promise<void>;
}

/**
 * Parse error to extract meaningful information
 * Requirements: 14.3
 */
export function parseError(error: unknown): ErrorDetails {
  // Handle axios/fetch errors
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as any;
    const status = axiosError.response?.status;
    const message = axiosError.response?.data?.message || axiosError.message;

    // Authentication errors (401, 403)
    if (status === 401 || status === 403) {
      return {
        type: ErrorType.AUTHENTICATION,
        severity: ErrorSeverity.CRITICAL,
        message: 'Your session has expired. Please log in again.',
        originalError: error,
        isRecoverable: false,
      };
    }

    // Not found errors (404)
    if (status === 404) {
      return {
        type: ErrorType.API,
        severity: ErrorSeverity.WARNING,
        message: 'The requested resource was not found.',
        originalError: error,
        isRecoverable: false,
      };
    }

    // Server errors (500+)
    if (status >= 500) {
      return {
        type: ErrorType.API,
        severity: ErrorSeverity.ERROR,
        message: 'Server error. Please try again later.',
        originalError: error,
        isRecoverable: true,
      };
    }

    // Rate limiting (429)
    if (status === 429) {
      return {
        type: ErrorType.API,
        severity: ErrorSeverity.WARNING,
        message: 'Too many requests. Please wait a moment and try again.',
        originalError: error,
        isRecoverable: true,
      };
    }

    // Other API errors
    return {
      type: ErrorType.API,
      severity: ErrorSeverity.ERROR,
      message: message || 'An error occurred. Please try again.',
      originalError: error,
      isRecoverable: true,
    };
  }

  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.ERROR,
      message: 'Network error. Please check your connection and try again.',
      originalError: error,
      isRecoverable: true,
    };
  }

  // Handle Error instances
  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message.includes('Not connected')) {
      return {
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.ERROR,
        message: 'Not connected to chat server. Please check your connection.',
        originalError: error,
        isRecoverable: true,
      };
    }

    if (error.message.includes('empty') || error.message.includes('whitespace')) {
      return {
        type: ErrorType.VALIDATION,
        severity: ErrorSeverity.WARNING,
        message: error.message,
        originalError: error,
        isRecoverable: false,
      };
    }

    return {
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.ERROR,
      message: error.message || 'An unexpected error occurred.',
      originalError: error,
      isRecoverable: true,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.ERROR,
      message: error,
      originalError: error,
      isRecoverable: true,
    };
  }

  // Unknown error type
  return {
    type: ErrorType.UNKNOWN,
    severity: ErrorSeverity.ERROR,
    message: 'An unexpected error occurred. Please try again.',
    originalError: error,
    isRecoverable: true,
  };
}

/**
 * Show error toast notification
 * Requirements: 14.1, 14.3, 14.5
 */
export function showErrorToast(
  error: unknown,
  options?: {
    title?: string;
    retryAction?: () => void | Promise<void>;
    onDismiss?: () => void;
  }
) {
  const errorDetails = parseError(error);

  // Log error to console
  console.error('[ErrorHandling]', errorDetails);

  // Determine toast variant based on severity
  const variant = errorDetails.severity === ErrorSeverity.WARNING ? 'default' : 'default';

  // Show toast with retry button if recoverable
  if (errorDetails.isRecoverable && (options?.retryAction || errorDetails.retryAction)) {
    toast.error(options?.title || 'Error', {
      description: errorDetails.message,
      action: {
        label: 'Retry',
        onClick: async () => {
          try {
            if (options?.retryAction) {
              await options.retryAction();
            } else if (errorDetails.retryAction) {
              await errorDetails.retryAction();
            }
          } catch (retryError) {
            showErrorToast(retryError);
          }
        },
      },
      onDismiss: options?.onDismiss,
    });
  } else {
    // Show simple error toast
    toast.error(options?.title || 'Error', {
      description: errorDetails.message,
      onDismiss: options?.onDismiss,
    });
  }

  return errorDetails;
}

/**
 * Show network error toast
 * Requirements: 14.1
 */
export function showNetworkErrorToast(retryAction?: () => void | Promise<void>) {
  toast.error('Network Error', {
    description: 'Unable to connect to the server. Please check your internet connection.',
    action: retryAction
      ? {
          label: 'Retry',
          onClick: async () => {
            try {
              await retryAction();
            } catch (error) {
              showErrorToast(error);
            }
          },
        }
      : undefined,
  });
}

/**
 * Show API error toast
 * Requirements: 14.3
 */
export function showApiErrorToast(
  message: string,
  retryAction?: () => void | Promise<void>
) {
  toast.error('API Error', {
    description: message,
    action: retryAction
      ? {
          label: 'Retry',
          onClick: async () => {
            try {
              await retryAction();
            } catch (error) {
              showErrorToast(error);
            }
          },
        }
      : undefined,
  });
}

/**
 * Show authentication error toast and redirect to login
 * Requirements: 1.5, 14.4
 */
export function showAuthenticationErrorToast(redirectToLogin: () => void) {
  toast.error('Authentication Required', {
    description: 'Your session has expired. Please log in again.',
    action: {
      label: 'Log In',
      onClick: redirectToLogin,
    },
    duration: 10000, // Show for 10 seconds
  });
}

/**
 * Show validation error toast
 * Requirements: 9.2
 */
export function showValidationErrorToast(message: string) {
  toast.warning('Validation Error', {
    description: message,
  });
}

/**
 * Show success toast
 */
export function showSuccessToast(message: string, description?: string) {
  toast.success(message, {
    description,
  });
}

/**
 * Show info toast
 */
export function showInfoToast(message: string, description?: string) {
  toast.info(message, {
    description,
  });
}

/**
 * Handle chat-specific errors
 * Requirements: 14.1, 14.3, 14.4, 14.5
 */
export function handleChatError(
  error: unknown,
  context: {
    action: string;
    conversationId?: string;
    retryAction?: () => void | Promise<void>;
    onAuthError?: () => void;
  }
) {
  const errorDetails = parseError(error);

  // Handle authentication errors
  if (errorDetails.type === ErrorType.AUTHENTICATION && context.onAuthError) {
    showAuthenticationErrorToast(context.onAuthError);
    return errorDetails;
  }

  // Handle network errors
  if (errorDetails.type === ErrorType.NETWORK) {
    showNetworkErrorToast(context.retryAction);
    return errorDetails;
  }

  // Handle validation errors
  if (errorDetails.type === ErrorType.VALIDATION) {
    showValidationErrorToast(errorDetails.message);
    return errorDetails;
  }

  // Handle API errors with retry
  if (errorDetails.type === ErrorType.API && errorDetails.isRecoverable) {
    showApiErrorToast(errorDetails.message, context.retryAction);
    return errorDetails;
  }

  // Handle other errors
  showErrorToast(error, {
    title: `Failed to ${context.action}`,
    retryAction: context.retryAction,
  });

  return errorDetails;
}

/**
 * Create a retry wrapper for async functions
 * Requirements: 14.5
 */
export function createRetryWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    onError?: (error: unknown, attempt: number) => void;
  }
): T {
  const maxRetries = options?.maxRetries || 3;
  const retryDelay = options?.retryDelay || 1000;

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;

        if (options?.onError) {
          options.onError(error, attempt);
        }

        // Don't retry on authentication or validation errors
        const errorDetails = parseError(error);
        if (
          errorDetails.type === ErrorType.AUTHENTICATION ||
          errorDetails.type === ErrorType.VALIDATION ||
          !errorDetails.isRecoverable
        ) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1))
          );
        }
      }
    }

    throw lastError;
  }) as T;
}

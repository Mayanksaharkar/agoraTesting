/**
 * Chat Error Handling Hook
 * Provides error handling utilities for chat components
 * Requirements: 1.5, 14.1, 14.3, 14.4, 14.5
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  handleChatError,
  showAuthenticationErrorToast,
  showNetworkErrorToast,
  showApiErrorToast,
  showValidationErrorToast,
  ErrorType,
  parseError,
} from '@/utils/errorHandling';

/**
 * Hook for handling chat-specific errors
 * Requirements: 1.5, 14.1, 14.3, 14.4, 14.5
 */
export function useChatErrorHandling() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  /**
   * Handle authentication errors with redirect
   * Requirements: 1.5, 14.4
   */
  const handleAuthError = useCallback(() => {
    // Logout user
    logout();

    // Show toast notification
    showAuthenticationErrorToast(() => {
      navigate('/login');
    });

    // Redirect to login after a short delay
    setTimeout(() => {
      navigate('/login');
    }, 2000);
  }, [logout, navigate]);

  /**
   * Handle message send error
   * Requirements: 5.5, 14.1, 14.5
   */
  const handleMessageSendError = useCallback(
    (error: unknown, conversationId: string, retryAction?: () => void | Promise<void>) => {
      const errorDetails = parseError(error);

      if (errorDetails.type === ErrorType.AUTHENTICATION) {
        handleAuthError();
        return;
      }

      handleChatError(error, {
        action: 'send message',
        conversationId,
        retryAction,
        onAuthError: handleAuthError,
      });
    },
    [handleAuthError]
  );

  /**
   * Handle conversation load error
   * Requirements: 14.1, 14.3, 14.5
   */
  const handleConversationLoadError = useCallback(
    (error: unknown, retryAction?: () => void | Promise<void>) => {
      const errorDetails = parseError(error);

      if (errorDetails.type === ErrorType.AUTHENTICATION) {
        handleAuthError();
        return;
      }

      handleChatError(error, {
        action: 'load conversations',
        retryAction,
        onAuthError: handleAuthError,
      });
    },
    [handleAuthError]
  );

  /**
   * Handle message history load error
   * Requirements: 14.1, 14.3, 14.5
   */
  const handleMessageHistoryError = useCallback(
    (error: unknown, conversationId: string, retryAction?: () => void | Promise<void>) => {
      const errorDetails = parseError(error);

      if (errorDetails.type === ErrorType.AUTHENTICATION) {
        handleAuthError();
        return;
      }

      handleChatError(error, {
        action: 'load message history',
        conversationId,
        retryAction,
        onAuthError: handleAuthError,
      });
    },
    [handleAuthError]
  );

  /**
   * Handle conversation creation error
   * Requirements: 11.4, 14.1, 14.3, 14.5
   */
  const handleConversationCreationError = useCallback(
    (error: unknown, retryAction?: () => void | Promise<void>) => {
      const errorDetails = parseError(error);

      if (errorDetails.type === ErrorType.AUTHENTICATION) {
        handleAuthError();
        return;
      }

      handleChatError(error, {
        action: 'create conversation',
        retryAction,
        onAuthError: handleAuthError,
      });
    },
    [handleAuthError]
  );

  /**
   * Handle network error
   * Requirements: 14.1
   */
  const handleNetworkError = useCallback((retryAction?: () => void | Promise<void>) => {
    showNetworkErrorToast(retryAction);
  }, []);

  /**
   * Handle API error
   * Requirements: 14.3
   */
  const handleApiError = useCallback(
    (message: string, retryAction?: () => void | Promise<void>) => {
      showApiErrorToast(message, retryAction);
    },
    []
  );

  /**
   * Handle validation error
   * Requirements: 9.2
   */
  const handleValidationError = useCallback((message: string) => {
    showValidationErrorToast(message);
  }, []);

  return {
    handleAuthError,
    handleMessageSendError,
    handleConversationLoadError,
    handleMessageHistoryError,
    handleConversationCreationError,
    handleNetworkError,
    handleApiError,
    handleValidationError,
  };
}

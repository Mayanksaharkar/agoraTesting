/**
 * ConnectionBanner Component
 * Displays connection status and provides reconnection controls
 * Requirements: 1.2, 1.3
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, WifiOff, AlertCircle } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface ConnectionBannerProps {
  /**
   * Current connection status
   * Requirements: 1.2
   */
  status: ConnectionStatus;

  /**
   * Callback when user clicks reconnect button
   * Requirements: 1.3
   */
  onReconnect?: () => void;

  /**
   * Optional additional CSS classes
   */
  className?: string;

  /**
   * Optional reconnection attempt number (for progress display)
   * Requirements: 1.3
   */
  reconnectionAttempt?: number;

  /**
   * Optional max reconnection attempts
   */
  maxReconnectionAttempts?: number;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ConnectionBanner Component
 * Shows connection status with smooth transitions
 * Requirements: 1.2, 1.3
 */
export function ConnectionBanner({
  status,
  onReconnect,
  className,
  reconnectionAttempt = 0,
  maxReconnectionAttempts = 10,
}: ConnectionBannerProps) {
  // Don't render anything when connected
  // Requirements: 1.2
  if (status === 'connected') {
    return null;
  }

  // Determine banner variant and content based on status
  const isReconnecting = status === 'reconnecting';
  const isDisconnected = status === 'disconnected';

  return (
    <div
      className={cn(
        'w-full transition-all duration-300 ease-in-out',
        'animate-in slide-in-from-top-2',
        className
      )}
      data-testid="connection-banner"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <Alert
        variant={isDisconnected ? 'destructive' : 'default'}
        className={cn(
          'border-l-4 rounded-none border-t-0 border-r-0 border-b',
          isReconnecting && 'bg-yellow-50 border-yellow-500 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100',
          isDisconnected && 'bg-red-50 border-red-500 dark:bg-red-950'
        )}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Status Icon and Message */}
          <div className="flex items-center gap-3 flex-1">
            {/* Icon */}
            {isReconnecting && (
              <Loader2
                className="h-5 w-5 animate-spin text-yellow-600 dark:text-yellow-400"
                aria-hidden="true"
              />
            )}
            {isDisconnected && (
              <WifiOff
                className="h-5 w-5 text-red-600 dark:text-red-400"
                aria-hidden="true"
              />
            )}

            {/* Message */}
            <AlertDescription className="flex-1 m-0">
              {isReconnecting && (
                <div className="flex flex-col gap-1">
                  <span className="font-medium">
                    Reconnecting to server...
                  </span>
                  {reconnectionAttempt > 0 && (
                    <span className="text-xs opacity-80">
                      Attempt {reconnectionAttempt} of {maxReconnectionAttempts}
                    </span>
                  )}
                </div>
              )}
              {isDisconnected && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium">
                    Connection lost. Please check your internet connection.
                  </span>
                </div>
              )}
            </AlertDescription>
          </div>

          {/* Reconnect Button */}
          {/* Requirements: 1.3 */}
          {isDisconnected && onReconnect && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReconnect}
              className={cn(
                'shrink-0',
                'bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800',
                'border-red-300 dark:border-red-700',
                'text-red-700 dark:text-red-300'
              )}
              aria-label="Reconnect to server"
            >
              Reconnect
            </Button>
          )}
        </div>
      </Alert>
    </div>
  );
}

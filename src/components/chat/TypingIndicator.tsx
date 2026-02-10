/**
 * TypingIndicator Component
 * Displays an animated typing indicator when the other participant is typing
 * Requirements: 7.3, 7.4, 7.5
 */

import React from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface TypingIndicatorProps {
  participantName: string;
  isTyping: boolean;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * TypingIndicator Component
 * Shows animated dots with participant name when they are typing
 * Requirements: 7.3, 7.4, 7.5
 */
export function TypingIndicator({
  participantName,
  isTyping,
  className,
}: TypingIndicatorProps) {
  if (!isTyping) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 transition-opacity duration-300 ease-in-out',
        isTyping ? 'opacity-100' : 'opacity-0',
        className
      )}
      data-testid="typing-indicator"
      role="status"
      aria-live="polite"
      aria-label={`${participantName} is typing`}
    >
      {/* Typing text */}
      {/* Requirements: 7.5 */}
      <span className="text-sm text-muted-foreground">
        {participantName} is typing...
      </span>

      {/* Animated dots */}
      {/* Requirements: 7.4 */}
      <div className="flex items-center gap-1" aria-hidden="true">
        <span
          className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
          style={{
            animationDelay: '0ms',
            animationDuration: '1.4s',
          }}
        />
        <span
          className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
          style={{
            animationDelay: '200ms',
            animationDuration: '1.4s',
          }}
        />
        <span
          className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
          style={{
            animationDelay: '400ms',
            animationDuration: '1.4s',
          }}
        />
      </div>
    </div>
  );
}

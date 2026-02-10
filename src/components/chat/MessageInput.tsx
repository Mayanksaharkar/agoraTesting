/**
 * MessageInput Component
 * Text input for composing and sending messages with validation and typing indicators
 * Requirements: 5.1, 9.1, 9.2, 9.3, 9.4, 9.5, 7.1, 7.2, 17.3
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// ============================================================================
// Constants
// ============================================================================

const MAX_MESSAGE_LENGTH = 2000;

// ============================================================================
// Types
// ============================================================================

export interface MessageInputProps {
  conversationId: string;
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * MessageInput Component
 * Provides text input for composing messages with validation and typing indicators
 * Requirements: 5.1, 9.1, 9.2, 9.3, 9.4, 9.5, 7.1, 7.2, 17.3
 */
export function MessageInput({
  conversationId,
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
}: MessageInputProps) {
  const [value, setValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Auto-focus textarea when conversation changes
   * Requirements: 16.1, 16.4
   */
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [conversationId, disabled]);

  /**
   * Validate message content
   * Requirements: 9.1, 9.2, 9.3
   */
  const validateMessage = useCallback((content: string): { isValid: boolean; error?: string } => {
    // Check if message is empty or whitespace-only
    if (!content || content.trim().length === 0) {
      return { isValid: false, error: 'Message cannot be empty' };
    }

    // Check if message exceeds maximum length
    if (content.length > MAX_MESSAGE_LENGTH) {
      return { isValid: false, error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters` };
    }

    return { isValid: true };
  }, []);

  /**
   * Check if send button should be enabled
   * Requirements: 9.4, 9.5
   */
  const isSendEnabled = useCallback(() => {
    if (disabled || isSending) return false;
    const validation = validateMessage(value);
    return validation.isValid;
  }, [value, disabled, isSending, validateMessage]);



  /**
   * Handle input change
   * Requirements: 7.1, 9.1, 9.2, 9.3
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      // Clear validation error when user starts typing
      if (validationError) {
        setValidationError(null);
      }

      // Auto-resize textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    },
    [validationError]
  );

  /**
   * Handle send message
   * Requirements: 5.1, 9.1, 9.2, 9.3
   */
  const handleSend = useCallback(async () => {
    // Validate message
    const validation = validateMessage(value);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid message');
      return;
    }

    setIsSending(true);
    setValidationError(null);

    try {
      // Emit typing:stop immediately on send
      // Requirements: 7.2


      await onSend(value);
      setValue('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setValidationError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [value, onSend, validateMessage]);

  /**
   * Handle Enter key to send (Shift+Enter for new line)
   * Requirements: 5.1
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (isSendEnabled()) {
          handleSend();
        }
      }
    },
    [isSendEnabled, handleSend]
  );

  /**
   * Cleanup typing timeout on unmount
   * Requirements: 17.3
   */


  /**
   * Get character count color based on length
   * Requirements: 9.3
   */
  const getCharCountColor = () => {
    const length = value.length;
    if (length > MAX_MESSAGE_LENGTH) {
      return 'text-destructive';
    }
    if (length > MAX_MESSAGE_LENGTH * 0.9) {
      return 'text-yellow-600';
    }
    return 'text-muted-foreground';
  };

  return (
    <div className="border-t bg-background p-4" data-testid="message-input-container">
      <div className="flex flex-col gap-2">
        {/* Validation error */}
        {/* Requirements: 9.2 */}
        {validationError && (
          <div
            className="text-sm text-destructive"
            data-testid="validation-error"
            role="alert"
          >
            {validationError}
          </div>
        )}

        {/* Input area */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isSending}
              className={cn(
                'min-h-[60px] max-h-[200px] resize-none',
                'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                validationError && 'border-destructive focus-visible:ring-destructive'
              )}
              data-testid="message-textarea"
              aria-label="Message input"
              aria-invalid={!!validationError}
              aria-describedby={validationError ? 'validation-error' : undefined}
            />

            {/* Character count */}
            {/* Requirements: 9.3 */}
            <div
              className={cn(
                'absolute bottom-2 right-2 text-xs',
                getCharCountColor()
              )}
              data-testid="character-count"
              aria-live="polite"
            >
              {value.length}/{MAX_MESSAGE_LENGTH}
            </div>
          </div>

          {/* Send button */}
          {/* Requirements: 9.4, 9.5 */}
          <Button
            onClick={handleSend}
            disabled={!isSendEnabled()}
            size="icon"
            className="h-[60px] w-[60px] flex-shrink-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            data-testid="send-button"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

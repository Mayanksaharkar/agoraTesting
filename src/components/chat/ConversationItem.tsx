/**
 * ConversationItem Component
 * Displays a single conversation in the chat list with participant info, preview, and status
 * Requirements: 2.2, 2.3, 2.5, 3.1
 */

import React, { useRef, useEffect } from 'react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types/chat';
import { LazyAvatar } from './LazyAvatar';

// ============================================================================
// Types
// ============================================================================

export interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ConversationItem Component
 * Displays conversation preview with participant info, last message, and status indicators
 * Requirements: 2.2, 2.3, 2.5, 3.1
 */
export function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: ConversationItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-focus when selected (for keyboard navigation)
   * Requirements: 16.1
   */
  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.focus();
    }
  }, [isSelected]);

  /**
   * Get initials for avatar fallback
   */
  const getInitials = (name: string) => {
    if (!name) return '?';
    
    const parts = name.split(' ').filter(Boolean);
    
    if (parts.length === 0) {
      return '?';
    } else if (parts.length === 1) {
      // For single word, take first two characters
      return parts[0].slice(0, 2).toUpperCase();
    } else {
      // For multiple words, take first letter of first two words
      return parts
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();
    }
  };

  /**
   * Format timestamp for last message
   * Requirements: 2.2
   */
  const formatTimestamp = (date: Date) => {
    const messageDate = new Date(date);
    
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return 'Yesterday';
    } else {
      // Show date for older messages
      return format(messageDate, 'MMM d');
    }
  };

  /**
   * Truncate last message preview
   * Requirements: 2.2
   */
  const truncateMessage = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) {
      return content;
    }
    return content.slice(0, maxLength).trim() + '...';
  };

  return (
    <div
      ref={itemRef}
      className={cn(
        'flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-accent',
        'border-b border-border',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset',
        isSelected && 'bg-accent'
      )}
      onClick={onClick}
      data-testid={`conversation-item-${conversation._id}`}
      data-conversation-id={conversation._id}
      data-selected={isSelected}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Conversation with ${conversation.participantName || 'Unknown'}`}
      aria-selected={isSelected}
    >
      {/* Avatar with online status indicator */}
      {/* Requirements: 2.2, 2.5, 17.4 */}
      <div className="relative flex-shrink-0">
        <LazyAvatar
          className="h-12 w-12"
          src={conversation.participantAvatar}
          alt={conversation.participantName || 'Unknown'}
          fallback={
            <span className="text-sm">
              {getInitials(conversation.participantName || '')}
            </span>
          }
        />
        
        {/* Online status indicator */}
        {/* Requirements: 2.5 */}
        {conversation.isOnline && (
          <div
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"
            data-testid="online-indicator"
            aria-label="Online"
          />
        )}
      </div>

      {/* Conversation details */}
      <div className="flex-1 min-w-0">
        {/* Participant name and timestamp */}
        {/* Requirements: 2.2 */}
        <div className="flex items-center justify-between mb-1">
          <h3
            className={cn(
              'text-sm font-medium truncate',
              conversation.unreadCount > 0 && 'font-semibold'
            )}
          >
            {conversation.participantName || 'Unknown'}
          </h3>
          
          {conversation.lastMessage && (
            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
              {formatTimestamp(conversation.lastMessage.timestamp)}
            </span>
          )}
        </div>

        {/* Last message preview and unread badge */}
        {/* Requirements: 2.2, 2.3 */}
        <div className="flex items-center justify-between gap-2">
          {conversation.lastMessage ? (
            <p
              className={cn(
                'text-sm text-muted-foreground truncate',
                conversation.unreadCount > 0 && 'font-medium text-foreground'
              )}
            >
              {truncateMessage(conversation.lastMessage.content)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No messages yet
            </p>
          )}

          {/* Unread count badge */}
          {/* Requirements: 2.3 */}
          {conversation.unreadCount > 0 && (
            <Badge
              variant="default"
              className="flex-shrink-0 h-5 min-w-[20px] px-1.5 text-xs font-semibold"
              data-testid="unread-badge"
              aria-label={`${conversation.unreadCount} unread messages`}
            >
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

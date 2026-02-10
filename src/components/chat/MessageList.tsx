import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Message } from './Message';
import type { UIMessage } from '@/types/chat';

export interface MessageListProps {
  conversationId: string;
  messages: UIMessage[];
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onRetry?: (messageId: string) => void;
  currentUserId: string;
  currentUserRole?: 'user' | 'astrologer';
}

interface MessageGroup {
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  messages: UIMessage[];
  startIndex: number;
}

const MESSAGE_GROUP_TIME_THRESHOLD = 5 * 60 * 1000;
const SCROLL_THRESHOLD = 100;

export function MessageList({
  conversationId,
  messages,
  isLoadingMore,
  hasMore,
  onLoadMore,
  onRetry,
  currentUserId,
  currentUserRole,
}: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const previousMessageCountRef = useRef(messages.length);
  const previousScrollHeightRef = useRef(0);

  const groupMessages = useCallback((messages: UIMessage[]): MessageGroup[] => {
    if (messages.length === 0) return [];

    const groups: MessageGroup[] = [];
    let currentGroup: MessageGroup | null = null;

    messages.forEach((message, index) => {
      const shouldStartNewGroup =
        !currentGroup ||
        currentGroup.senderId !== message.senderId ||
        (index > 0 &&
          new Date(message.timestamp).getTime() -
          new Date(messages[index - 1].timestamp).getTime() >
          MESSAGE_GROUP_TIME_THRESHOLD);

      if (shouldStartNewGroup) {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = {
          senderId: message.senderId,
          senderName: message.senderName,
          senderAvatar: message.senderAvatar,
          messages: [message],
          startIndex: index,
        };
      } else {
        currentGroup!.messages.push(message);
      }
    });

    if (currentGroup) groups.push(currentGroup);
    return groups;
  }, []);

  const checkIfNearBottom = useCallback(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return false;

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom < 100;
  }, []);

  const handleScroll = useCallback(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    setIsNearBottom(checkIfNearBottom());

    // Load more when scrolled to top
    if (viewport.scrollTop < SCROLL_THRESHOLD && hasMore && !isLoadingMore) {
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onLoadMore, checkIfNearBottom]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    const currentScrollHeight = viewport.scrollHeight;
    const previousScrollHeight = previousScrollHeightRef.current;
    const previousMessageCount = previousMessageCountRef.current;

    // Maintain scroll position when history is loaded
    if (messages.length > previousMessageCount && !isNearBottom) {
      const diff = currentScrollHeight - previousScrollHeight;
      viewport.scrollTop = viewport.scrollTop + diff;
    }

    previousMessageCountRef.current = messages.length;
    previousScrollHeightRef.current = currentScrollHeight;
  }, [messages.length, isNearBottom]);

  useEffect(() => {
    const previousCount = previousMessageCountRef.current;
    if (messages.length > previousCount && isNearBottom) {
      scrollToBottom('smooth');
    }
  }, [messages, isNearBottom, scrollToBottom]);

  useEffect(() => {
    setTimeout(() => scrollToBottom('auto'), 100);
  }, [conversationId, scrollToBottom]);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const messageGroups = groupMessages(messages);

  return (
    <div className="flex-1 flex flex-col relative">
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div
          ref={scrollViewportRef}
          className="py-4 space-y-2 bg-background min-h-full"
          role="log"
        >
          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!hasMore && messages.length > 0 && (
            <div className="flex justify-center py-4">
              <span className="text-xs text-muted-foreground">Beginning of conversation</span>
            </div>
          )}

          {messages.length === 0 && !isLoadingMore && (
            <div className="flex justify-center items-center h-full py-8">
              <span className="text-sm text-muted-foreground">No messages yet.</span>
            </div>
          )}

          {messageGroups.map((group, groupIndex) => {
            const isOwnGroup = group.senderId === currentUserId ||
              (currentUserRole && group.messages[0]?.senderType === currentUserRole);

            return (
              <div key={`group-${groupIndex}`} className="space-y-1">
                {group.messages.map((message, messageIndex) => (
                  <Message
                    key={message._id || message.tempId}
                    message={message}
                    isOwn={isOwnGroup}
                    showAvatar={messageIndex === 0 && !isOwnGroup}
                    showName={messageIndex === 0 && !isOwnGroup}
                    showTimestamp={messageIndex === group.messages.length - 1}
                    onRetry={onRetry}
                  />
                ))}
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {!isNearBottom && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <button
            onClick={() => scrollToBottom('smooth')}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg text-sm hover:bg-primary/90 transition-colors"
          >
            New messages ↓
          </button>
        </div>
      )}
    </div>
  );
}

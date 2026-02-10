import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { chatApi } from '@/services/chatApi';
import { ConversationItem } from './ConversationItem';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types/chat';

export interface ChatListProps {
  onConversationSelect: (conversationId: string) => void;
  selectedConversationId: string | null;
  className?: string;
}

export function ChatList({
  onConversationSelect,
  selectedConversationId,
  className,
}: ChatListProps) {
  const { role: userRole } = useAuth();
  const { getConversationList } = useChat();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localConversations, setLocalConversations] = useState<Conversation[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setError(null);
        const response = await chatApi.getConversations({ page: 1, limit: 100 });

        if (!response || !response.conversations || !Array.isArray(response.conversations)) {
          setIsLoading(false);
          return;
        }

        const sortedConversations = response.conversations.sort((a, b) => {
          const aTime = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
          const bTime = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
          return bTime - aTime;
        });

        setLocalConversations(sortedConversations);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const conversations = useCallback(() => {
    const contextConversations = getConversationList();
    if (contextConversations.length > 0) {
      return contextConversations;
    }
    return localConversations;
  }, [getConversationList, localConversations]);

  const conversationList = conversations();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (conversationList.length === 0) return;

      const currentIndex = conversationList.findIndex(
        (conv) => conv._id === selectedConversationId
      );

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < conversationList.length - 1 ? currentIndex + 1 : 0;
        onConversationSelect(conversationList[nextIndex]._id);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : conversationList.length - 1;
        onConversationSelect(conversationList[prevIndex]._id);
      }
    };

    const listElement = listRef.current;
    if (listElement) {
      listElement.addEventListener('keydown', handleKeyDown);
      return () => {
        listElement.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [conversationList, selectedConversationId, onConversationSelect]);

  if (isLoading) {
    return (
      <div className={cn('flex flex-col', className)}>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 p-3 border-b border-border">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to Load Conversations</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (conversationList.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
        <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Conversations Yet</h3>
        <p className="text-sm text-muted-foreground">
          {userRole === 'astrologer'
            ? 'Wait for users to start a conversation'
            : 'Start a conversation with an astrologer to begin chatting'}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className={cn('flex flex-col overflow-y-auto', className)}
      role="list"
      aria-label="Conversations"
      tabIndex={0}
    >
      {conversationList.map((conversation) => (
        <ConversationItem
          key={conversation._id}
          conversation={conversation}
          isSelected={selectedConversationId === conversation._id}
          onClick={() => onConversationSelect(conversation._id)}
        />
      ))}
    </div>
  );
}

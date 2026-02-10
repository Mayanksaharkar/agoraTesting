import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, User, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ConnectionBanner } from './ConnectionBanner';
import { LazyAvatar } from './LazyAvatar';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export interface ChatWindowProps {
  conversationId: string;
  onBack?: () => void;
  className?: string;
}

export function ChatWindow({ conversationId, onBack, className }: ChatWindowProps) {
  const { user, role } = useAuth();
  const {
    getConversation,
    loadConversationHistory,
    sendMessage,
    retryFailedMessage,
    clearUnreadCount,
    isConnected,
  } = useChat();

  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const conversation = getConversation(conversationId);

  useEffect(() => {
    const loadHistory = async () => {
      if (!conversation) return;

      if (conversation.initialHistoryLoaded) {
        return;
      }

      setIsLoadingHistory(true);
      setLoadError(null);

      try {
        await loadConversationHistory(conversationId, 1);
      } catch (error) {
        console.error('Failed to load conversation history:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load messages');
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [conversationId, conversation, loadConversationHistory]);

  useEffect(() => {
    if (!conversation) return;
    clearUnreadCount(conversationId);
  }, [conversationId, conversation, clearUnreadCount]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      await sendMessage(conversationId, content);
    },
    [conversationId, sendMessage]
  );

  const handleLoadMore = useCallback(async () => {
    if (!conversation || conversation.isLoadingMessages || !conversation.hasMoreMessages) {
      return;
    }

    try {
      await loadConversationHistory(conversationId, conversation.currentPage + 1);
    } catch (error) {
      console.error('Failed to load more messages:', error);
    }
  }, [conversation, conversationId, loadConversationHistory]);

  const handleRetry = useCallback(
    async (messageId: string) => {
      try {
        await retryFailedMessage(messageId);
      } catch (error) {
        console.error('Failed to retry message:', error);
      }
    },
    [retryFailedMessage]
  );

  const handleRetryLoad = useCallback(async () => {
    setIsLoadingHistory(true);
    setLoadError(null);

    try {
      await loadConversationHistory(conversationId, 1);
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load messages');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [conversationId, loadConversationHistory]);

  const handleReconnect = useCallback(() => {
    window.location.reload();
  }, []);

  if (!conversation && isLoadingHistory) {
    return (
      <div className={cn('flex flex-col h-full bg-background', className)}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className={cn('flex flex-col h-full bg-background', className)}>
        <div className="flex items-center justify-center h-full p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Conversation not found</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const currentUserId = user?._id || localStorage.getItem('userId') || '';
  let actualUserId = currentUserId;

  if (!actualUserId || actualUserId === 'unknown') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        actualUserId = payload.id || payload.userId || payload._id || payload.sub || '';
        if (actualUserId) {
          localStorage.setItem('userId', actualUserId);
        }
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    }
  }

  return (
    <div
      className={cn('flex flex-col h-full bg-background', className)}
    >
      <ConnectionBanner
        status={isConnected ? 'connected' : 'disconnected'}
        onReconnect={handleReconnect}
      />

      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background" role="banner">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        <LazyAvatar
          className="h-10 w-10"
          src={conversation.participantAvatar}
          alt={conversation.participantName}
          fallback={<User className="h-5 w-5" />}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-base truncate">{conversation.participantName}</h1>
            {conversation.isOnline && (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
              >
                Online
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground capitalize">
            {conversation.participantRole}
          </p>
        </div>
      </div>

      {loadError && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{loadError}</span>
            <Button variant="outline" size="sm" onClick={handleRetryLoad}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <MessageList
        conversationId={conversationId}
        messages={conversation.messages}
        isLoadingMore={conversation.isLoadingMessages}
        hasMore={conversation.hasMoreMessages}
        onLoadMore={handleLoadMore}
        onRetry={handleRetry}
        currentUserId={actualUserId}
        currentUserRole={role || undefined}
      />

      <MessageInput
        conversationId={conversationId}
        onSend={handleSendMessage}
        disabled={!isConnected}
        placeholder={
          isConnected
            ? `Message ${conversation.participantName}...`
            : 'Reconnecting...'
        }
      />
    </div>
  );
}

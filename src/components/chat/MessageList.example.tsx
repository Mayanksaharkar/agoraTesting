/**
 * MessageList Component Example
 * Demonstrates usage of the MessageList component
 */

import React, { useState } from 'react';
import { MessageList } from './MessageList';
import type { UIMessage } from '@/types/chat';

export function MessageListExample() {
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      _id: '1',
      conversationId: 'conv1',
      senderId: 'user1',
      senderName: 'Alice',
      senderAvatar: undefined,
      senderType: 'user',
      content: 'Hello! How are you?',
      type: 'text',
      attachments: [],
      status: 'read',
      timestamp: new Date(Date.now() - 3600000),
      isDeleted: false,
      isOptimistic: false,
      retryCount: 0,
    },
    {
      _id: '2',
      conversationId: 'conv1',
      senderId: 'astrologer1',
      senderName: 'Bob',
      senderAvatar: undefined,
      senderType: 'astrologer',
      content: "I'm doing great! How can I help you today?",
      type: 'text',
      attachments: [],
      status: 'read',
      timestamp: new Date(Date.now() - 3500000),
      isDeleted: false,
      isOptimistic: false,
      retryCount: 0,
    },
    {
      _id: '3',
      conversationId: 'conv1',
      senderId: 'user1',
      senderName: 'Alice',
      senderAvatar: undefined,
      senderType: 'user',
      content: 'I wanted to ask about my horoscope.',
      type: 'text',
      attachments: [],
      status: 'delivered',
      timestamp: new Date(Date.now() - 3400000),
      isDeleted: false,
      isOptimistic: false,
      retryCount: 0,
    },
  ]);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    // Simulate loading older messages
    setTimeout(() => {
      const olderMessages: UIMessage[] = [
        {
          _id: '0',
          conversationId: 'conv1',
          senderId: 'astrologer1',
          senderName: 'Bob',
          senderAvatar: undefined,
          senderType: 'astrologer',
          content: 'Welcome! Feel free to ask me anything.',
          type: 'text',
          attachments: [],
          status: 'read',
          timestamp: new Date(Date.now() - 7200000),
          isDeleted: false,
          isOptimistic: false,
          retryCount: 0,
        },
      ];
      setMessages((prev) => [...olderMessages, ...prev]);
      setIsLoadingMore(false);
      setHasMore(false); // No more messages after this
    }, 1000);
  };

  const handleRetry = (messageId: string) => {
    console.log('Retrying message:', messageId);
  };

  return (
    <div className="h-[600px] border rounded-lg">
      <MessageList
        conversationId="conv1"
        messages={messages}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        onRetry={handleRetry}
        currentUserId="user1"
      />
    </div>
  );
}

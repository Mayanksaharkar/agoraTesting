/**
 * Message Component Examples
 * Visual examples demonstrating different message states and configurations
 */

import React from 'react';
import { Message } from './Message';
import type { UIMessage } from '@/types/chat';

/**
 * Example messages for demonstration
 */
const exampleMessages: Record<string, UIMessage> = {
  receivedMessage: {
    _id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'astrologer-1',
    senderName: 'Sarah Johnson',
    senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    senderType: 'astrologer',
    content: 'Hello! I can help you with your astrological questions today.',
    type: 'text',
    attachments: [],
    status: 'delivered',
    timestamp: new Date(),
    isDeleted: false,
    isOptimistic: false,
    retryCount: 0,
  },
  ownMessageSending: {
    _id: 'msg-2',
    conversationId: 'conv-1',
    senderId: 'user-1',
    senderName: 'John Doe',
    senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    senderType: 'user',
    content: 'Thank you! I have a question about my birth chart.',
    type: 'text',
    attachments: [],
    status: 'sending',
    timestamp: new Date(),
    isDeleted: false,
    isOptimistic: true,
    tempId: 'temp-1',
    retryCount: 0,
  },
  ownMessageSent: {
    _id: 'msg-3',
    conversationId: 'conv-1',
    senderId: 'user-1',
    senderName: 'John Doe',
    senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    senderType: 'user',
    content: 'What does my sun sign mean?',
    type: 'text',
    attachments: [],
    status: 'sent',
    timestamp: new Date(Date.now() - 60000),
    isDeleted: false,
    isOptimistic: false,
    retryCount: 0,
  },
  ownMessageRead: {
    _id: 'msg-4',
    conversationId: 'conv-1',
    senderId: 'user-1',
    senderName: 'John Doe',
    senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    senderType: 'user',
    content: 'Thanks for the explanation!',
    type: 'text',
    attachments: [],
    status: 'read',
    timestamp: new Date(Date.now() - 120000),
    isDeleted: false,
    isOptimistic: false,
    retryCount: 0,
  },
  failedMessage: {
    _id: 'msg-5',
    conversationId: 'conv-1',
    senderId: 'user-1',
    senderName: 'John Doe',
    senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    senderType: 'user',
    content: 'This message failed to send.',
    type: 'text',
    attachments: [],
    status: 'failed',
    timestamp: new Date(Date.now() - 180000),
    isDeleted: false,
    isOptimistic: false,
    retryCount: 1,
  },
  longMessage: {
    _id: 'msg-6',
    conversationId: 'conv-1',
    senderId: 'astrologer-1',
    senderName: 'Sarah Johnson',
    senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    senderType: 'astrologer',
    content:
      'Your sun sign represents your core identity and ego. It influences your basic personality traits, how you express yourself, and your general approach to life. The sun sign is determined by the position of the sun at the time of your birth and is the most commonly known aspect of astrology.',
    type: 'text',
    attachments: [],
    status: 'delivered',
    timestamp: new Date(Date.now() - 240000),
    isDeleted: false,
    isOptimistic: false,
    retryCount: 0,
  },
  multilineMessage: {
    _id: 'msg-7',
    conversationId: 'conv-1',
    senderId: 'astrologer-1',
    senderName: 'Sarah Johnson',
    senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    senderType: 'astrologer',
    content: 'Here are the key points:\n\n1. Sun sign - Core identity\n2. Moon sign - Emotions\n3. Rising sign - Outer personality',
    type: 'text',
    attachments: [],
    status: 'delivered',
    timestamp: new Date(Date.now() - 300000),
    isDeleted: false,
    isOptimistic: false,
    retryCount: 0,
  },
};

/**
 * Message Examples Component
 * Demonstrates various message states and configurations
 */
export function MessageExamples() {
  const handleRetry = (messageId: string) => {
    console.log('Retry message:', messageId);
    alert(`Retrying message: ${messageId}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Message Component Examples</h1>

      {/* Received Message */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Received Message</h2>
        <div className="bg-background p-4 rounded-lg border">
          <Message
            message={exampleMessages.receivedMessage}
            isOwn={false}
            showAvatar={true}
            showName={true}
            showTimestamp={true}
          />
        </div>
      </section>

      {/* Own Message - Sending */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Own Message - Sending</h2>
        <div className="bg-background p-4 rounded-lg border">
          <Message
            message={exampleMessages.ownMessageSending}
            isOwn={true}
            showAvatar={false}
            showName={false}
            showTimestamp={true}
          />
        </div>
      </section>

      {/* Own Message - Sent */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Own Message - Sent</h2>
        <div className="bg-background p-4 rounded-lg border">
          <Message
            message={exampleMessages.ownMessageSent}
            isOwn={true}
            showAvatar={false}
            showName={false}
            showTimestamp={true}
          />
        </div>
      </section>

      {/* Own Message - Read */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Own Message - Read</h2>
        <div className="bg-background p-4 rounded-lg border">
          <Message
            message={exampleMessages.ownMessageRead}
            isOwn={true}
            showAvatar={false}
            showName={false}
            showTimestamp={true}
          />
        </div>
      </section>

      {/* Failed Message with Retry */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Failed Message with Retry</h2>
        <div className="bg-background p-4 rounded-lg border">
          <Message
            message={exampleMessages.failedMessage}
            isOwn={true}
            showAvatar={false}
            showName={false}
            showTimestamp={true}
            onRetry={handleRetry}
          />
        </div>
      </section>

      {/* Long Message */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Long Message</h2>
        <div className="bg-background p-4 rounded-lg border">
          <Message
            message={exampleMessages.longMessage}
            isOwn={false}
            showAvatar={true}
            showName={true}
            showTimestamp={true}
          />
        </div>
      </section>

      {/* Multiline Message */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Multiline Message</h2>
        <div className="bg-background p-4 rounded-lg border">
          <Message
            message={exampleMessages.multilineMessage}
            isOwn={false}
            showAvatar={true}
            showName={true}
            showTimestamp={true}
          />
        </div>
      </section>

      {/* Message Grouping Example */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Message Grouping (Consecutive Messages)</h2>
        <div className="bg-background p-4 rounded-lg border">
          <Message
            message={exampleMessages.receivedMessage}
            isOwn={false}
            showAvatar={true}
            showName={true}
            showTimestamp={false}
          />
          <Message
            message={{
              ...exampleMessages.receivedMessage,
              _id: 'msg-8',
              content: 'Feel free to ask any questions!',
            }}
            isOwn={false}
            showAvatar={false}
            showName={false}
            showTimestamp={false}
          />
          <Message
            message={{
              ...exampleMessages.receivedMessage,
              _id: 'msg-9',
              content: "I'm here to help.",
            }}
            isOwn={false}
            showAvatar={false}
            showName={false}
            showTimestamp={true}
          />
        </div>
      </section>
    </div>
  );
}

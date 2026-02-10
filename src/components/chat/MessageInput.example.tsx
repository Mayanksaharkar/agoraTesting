/**
 * MessageInput Component Example
 * Demonstrates usage of the MessageInput component
 */

import React from 'react';
import { MessageInput } from './MessageInput';
import { useChat } from '@/contexts/ChatContext';

/**
 * Example: Basic MessageInput usage with ChatContext
 */
export function MessageInputExample() {
  const { sendMessage, setTypingStatus } = useChat();
  const conversationId = 'example-conversation-id';

  const handleSend = async (content: string) => {
    await sendMessage(conversationId, content);
  };

  const handleTypingStart = (convId: string) => {
    setTypingStatus(convId, true);
  };

  const handleTypingStop = (convId: string) => {
    setTypingStatus(convId, false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <MessageInput
        conversationId={conversationId}
        onSend={handleSend}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        placeholder="Type your message..."
      />
    </div>
  );
}

/**
 * Example: MessageInput with custom placeholder
 */
export function MessageInputWithCustomPlaceholder() {
  const handleSend = async (content: string) => {
    console.log('Sending message:', content);
  };

  return (
    <MessageInput
      conversationId="conv-123"
      onSend={handleSend}
      placeholder="Ask your astrologer a question..."
    />
  );
}

/**
 * Example: Disabled MessageInput
 */
export function DisabledMessageInput() {
  const handleSend = async (content: string) => {
    console.log('Sending message:', content);
  };

  return (
    <MessageInput
      conversationId="conv-123"
      onSend={handleSend}
      disabled={true}
      placeholder="Chat is currently disabled"
    />
  );
}

/**
 * Example: MessageInput without typing indicators
 */
export function MessageInputWithoutTypingIndicators() {
  const handleSend = async (content: string) => {
    console.log('Sending message:', content);
  };

  return (
    <MessageInput
      conversationId="conv-123"
      onSend={handleSend}
      // No onTypingStart or onTypingStop callbacks
    />
  );
}

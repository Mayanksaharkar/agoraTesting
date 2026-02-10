/**
 * ChatWindow Component Example
 * Demonstrates usage of the ChatWindow component
 */

import React from 'react';
import { ChatWindow } from './ChatWindow';
import { ChatProvider } from '@/contexts/ChatContext';
import { AuthProvider } from '@/contexts/AuthContext';

/**
 * Example 1: Basic ChatWindow
 * Shows a chat window for a specific conversation
 */
export function BasicChatWindowExample() {
  return (
    <AuthProvider>
      <ChatProvider>
        <div className="h-screen">
          <ChatWindow conversationId="conv123" />
        </div>
      </ChatProvider>
    </AuthProvider>
  );
}

/**
 * Example 2: ChatWindow with Back Button (Mobile)
 * Shows a chat window with a back button for mobile navigation
 */
export function MobileChatWindowExample() {
  const handleBack = () => {
    console.log('Navigate back to conversation list');
    // In a real app, this would navigate back to the chat list
  };

  return (
    <AuthProvider>
      <ChatProvider>
        <div className="h-screen">
          <ChatWindow conversationId="conv123" onBack={handleBack} />
        </div>
      </ChatProvider>
    </AuthProvider>
  );
}

/**
 * Example 3: ChatWindow in a Layout
 * Shows how to integrate ChatWindow into a responsive layout
 */
export function ResponsiveChatWindowExample() {
  const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>(
    'conv123'
  );
  const [showChatWindow, setShowChatWindow] = React.useState(false);

  const handleBack = () => {
    setShowChatWindow(false);
  };

  return (
    <AuthProvider>
      <ChatProvider>
        <div className="h-screen flex">
          {/* Chat List (Desktop: always visible, Mobile: hidden when chat window is open) */}
          <div
            className={`w-full md:w-1/3 border-r ${
              showChatWindow ? 'hidden md:block' : 'block'
            }`}
          >
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Conversations</h2>
              <button
                onClick={() => {
                  setSelectedConversationId('conv123');
                  setShowChatWindow(true);
                }}
                className="w-full text-left p-3 hover:bg-muted rounded-lg"
              >
                <div className="font-medium">Test Astrologer</div>
                <div className="text-sm text-muted-foreground">Last message preview...</div>
              </button>
            </div>
          </div>

          {/* Chat Window (Desktop: always visible, Mobile: shown when conversation selected) */}
          <div
            className={`flex-1 ${
              showChatWindow || selectedConversationId ? 'block' : 'hidden md:block'
            }`}
          >
            {selectedConversationId ? (
              <ChatWindow
                conversationId={selectedConversationId}
                onBack={handleBack}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a conversation to start chatting
              </div>
            )}
          </div>
        </div>
      </ChatProvider>
    </AuthProvider>
  );
}

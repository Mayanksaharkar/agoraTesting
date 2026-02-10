/**
 * ChatList Component Example
 * Demonstrates usage of the ChatList component
 */

import React, { useState } from 'react';
import { ChatList } from './ChatList';
import { ChatProvider } from '@/contexts/ChatContext';

/**
 * Basic ChatList Example
 * Shows a simple conversation list with selection handling
 */
export function BasicChatListExample() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const handleConversationSelect = (conversationId: string) => {
    console.log('Selected conversation:', conversationId);
    setSelectedConversationId(conversationId);
  };

  return (
    <ChatProvider>
      <div className="h-screen w-full max-w-md border border-border rounded-lg overflow-hidden">
        <div className="bg-background border-b border-border p-4">
          <h2 className="text-lg font-semibold">Messages</h2>
        </div>
        <ChatList
          onConversationSelect={handleConversationSelect}
          selectedConversationId={selectedConversationId}
          className="h-[calc(100vh-64px)]"
        />
      </div>
    </ChatProvider>
  );
}

/**
 * ChatList with Custom Styling Example
 * Shows how to apply custom styling to the ChatList
 */
export function StyledChatListExample() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  return (
    <ChatProvider>
      <div className="h-screen w-full max-w-md bg-slate-50 rounded-lg overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
          <h2 className="text-lg font-semibold text-white">Conversations</h2>
          <p className="text-sm text-white/80">Select a conversation to start chatting</p>
        </div>
        <ChatList
          onConversationSelect={setSelectedConversationId}
          selectedConversationId={selectedConversationId}
          className="h-[calc(100vh-88px)] bg-white"
        />
      </div>
    </ChatProvider>
  );
}

/**
 * ChatList in Sidebar Layout Example
 * Shows ChatList as part of a two-column layout
 */
export function SidebarChatListExample() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  return (
    <ChatProvider>
      <div className="flex h-screen">
        {/* Sidebar with ChatList */}
        <div className="w-80 border-r border-border flex flex-col">
          <div className="bg-background border-b border-border p-4">
            <h2 className="text-lg font-semibold">Chats</h2>
          </div>
          <ChatList
            onConversationSelect={setSelectedConversationId}
            selectedConversationId={selectedConversationId}
            className="flex-1"
          />
        </div>

        {/* Main content area */}
        <div className="flex-1 flex items-center justify-center bg-muted">
          {selectedConversationId ? (
            <div className="text-center">
              <p className="text-lg font-medium">Conversation: {selectedConversationId}</p>
              <p className="text-sm text-muted-foreground">Chat window would go here</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-lg font-medium">No conversation selected</p>
              <p className="text-sm text-muted-foreground">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </ChatProvider>
  );
}

/**
 * Mobile ChatList Example
 * Shows ChatList optimized for mobile view
 */
export function MobileChatListExample() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setShowChat(true);
  };

  const handleBack = () => {
    setShowChat(false);
    setSelectedConversationId(null);
  };

  return (
    <ChatProvider>
      <div className="h-screen w-full max-w-md mx-auto">
        {!showChat ? (
          <>
            <div className="bg-background border-b border-border p-4">
              <h2 className="text-lg font-semibold">Messages</h2>
            </div>
            <ChatList
              onConversationSelect={handleConversationSelect}
              selectedConversationId={selectedConversationId}
              className="h-[calc(100vh-64px)]"
            />
          </>
        ) : (
          <div className="h-full flex flex-col">
            <div className="bg-background border-b border-border p-4 flex items-center gap-3">
              <button
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
              <h2 className="text-lg font-semibold">Chat</h2>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Chat window for {selectedConversationId}</p>
            </div>
          </div>
        )}
      </div>
    </ChatProvider>
  );
}

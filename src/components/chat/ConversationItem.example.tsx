/**
 * ConversationItem Component Example
 * Demonstrates usage of the ConversationItem component
 */

import React, { useState } from 'react';
import { ConversationItem } from './ConversationItem';
import type { Conversation } from '@/types/chat';

// ============================================================================
// Example Data
// ============================================================================

const exampleConversations: Conversation[] = [
  {
    _id: 'conv-1',
    participantId: 'user-1',
    participantName: 'Alice Johnson',
    participantAvatar: 'https://i.pravatar.cc/150?img=1',
    participantRole: 'user',
    isOnline: true,
    lastMessage: {
      content: 'Thank you for the reading! It was very insightful.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      senderId: 'user-1',
      senderType: 'user',
    },
    unreadCount: 3,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    _id: 'conv-2',
    participantId: 'astrologer-1',
    participantName: 'Dr. Rajesh Kumar',
    participantAvatar: 'https://i.pravatar.cc/150?img=12',
    participantRole: 'astrologer',
    isOnline: false,
    lastMessage: {
      content: 'I will send you the detailed birth chart analysis by tomorrow.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      senderId: 'astrologer-1',
      senderType: 'astrologer',
    },
    unreadCount: 0,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    _id: 'conv-3',
    participantId: 'user-2',
    participantName: 'Bob Smith',
    participantAvatar: undefined,
    participantRole: 'user',
    isOnline: true,
    lastMessage: {
      content: 'Can we schedule a session for next week?',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      senderId: 'user-2',
      senderType: 'user',
    },
    unreadCount: 1,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    _id: 'conv-4',
    participantId: 'user-3',
    participantName: 'Sarah Williams',
    participantAvatar: 'https://i.pravatar.cc/150?img=5',
    participantRole: 'user',
    isOnline: false,
    lastMessage: undefined,
    unreadCount: 0,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    _id: 'conv-5',
    participantId: 'user-4',
    participantName: 'Michael Chen',
    participantAvatar: 'https://i.pravatar.cc/150?img=8',
    participantRole: 'user',
    isOnline: false,
    lastMessage: {
      content: 'This is a very long message that should be truncated to fit in the preview area without breaking the layout of the conversation item component.',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      senderId: 'user-4',
      senderType: 'user',
    },
    unreadCount: 150, // Test 99+ display
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
];

// ============================================================================
// Examples
// ============================================================================

/**
 * Example: Basic ConversationItem usage
 */
export function ConversationItemExample() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="w-full max-w-md mx-auto border rounded-lg overflow-hidden">
      <div className="bg-muted p-3 border-b">
        <h2 className="text-lg font-semibold">Conversations</h2>
      </div>
      <div>
        {exampleConversations.map((conversation) => (
          <ConversationItem
            key={conversation._id}
            conversation={conversation}
            isSelected={selectedId === conversation._id}
            onClick={() => setSelectedId(conversation._id)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Example: Single ConversationItem with unread messages
 */
export function ConversationItemWithUnread() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="w-full max-w-md mx-auto border rounded-lg overflow-hidden">
      <ConversationItem
        conversation={exampleConversations[0]}
        isSelected={selectedId === exampleConversations[0]._id}
        onClick={() => setSelectedId(exampleConversations[0]._id)}
      />
    </div>
  );
}

/**
 * Example: ConversationItem with online status
 */
export function ConversationItemOnline() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="w-full max-w-md mx-auto border rounded-lg overflow-hidden">
      <ConversationItem
        conversation={exampleConversations[0]}
        isSelected={selectedId === exampleConversations[0]._id}
        onClick={() => setSelectedId(exampleConversations[0]._id)}
      />
    </div>
  );
}

/**
 * Example: ConversationItem without avatar
 */
export function ConversationItemNoAvatar() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="w-full max-w-md mx-auto border rounded-lg overflow-hidden">
      <ConversationItem
        conversation={exampleConversations[2]}
        isSelected={selectedId === exampleConversations[2]._id}
        onClick={() => setSelectedId(exampleConversations[2]._id)}
      />
    </div>
  );
}

/**
 * Example: ConversationItem with no messages
 */
export function ConversationItemNoMessages() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="w-full max-w-md mx-auto border rounded-lg overflow-hidden">
      <ConversationItem
        conversation={exampleConversations[3]}
        isSelected={selectedId === exampleConversations[3]._id}
        onClick={() => setSelectedId(exampleConversations[3]._id)}
      />
    </div>
  );
}

/**
 * Example: ConversationItem with long message and high unread count
 */
export function ConversationItemLongMessage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="w-full max-w-md mx-auto border rounded-lg overflow-hidden">
      <ConversationItem
        conversation={exampleConversations[4]}
        isSelected={selectedId === exampleConversations[4]._id}
        onClick={() => setSelectedId(exampleConversations[4]._id)}
      />
    </div>
  );
}

/**
 * Example: Selected ConversationItem
 */
export function ConversationItemSelected() {
  return (
    <div className="w-full max-w-md mx-auto border rounded-lg overflow-hidden">
      <ConversationItem
        conversation={exampleConversations[0]}
        isSelected={true}
        onClick={() => console.log('Clicked')}
      />
    </div>
  );
}

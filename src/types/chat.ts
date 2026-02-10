/**
 * Chat-related type definitions for one-to-one messaging
 * Comprehensive types for messages, conversations, events, and caching
 * Requirements: All requirements (foundational)
 */

// ============================================================================
// Base Types
// ============================================================================

/**
 * Message delivery status
 * - queued: Message is queued for sending when connection is restored (offline)
 * - sending: Message is being sent to server (optimistic update)
 * - sent: Message confirmed by server
 * - delivered: Message delivered to recipient
 * - read: Message read by recipient
 * - failed: Message failed to send
 */
export type MessageStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'failed';

/**
 * Message content type
 */
export type MessageType = 'text' | 'image' | 'file';

/**
 * Participant role in conversation
 */
export type ParticipantRole = 'user' | 'astrologer';

/**
 * Socket connection status
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

// ============================================================================
// Backend Types (matching backend schema)
// ============================================================================

/**
 * Message attachment metadata
 */
export interface MessageAttachment {
  _id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  thumbnailUrl?: string;
}

/**
 * Chat message (backend schema)
 * Represents a single message in a conversation
 */
export interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderType: ParticipantRole;
  content: string;
  type: MessageType;
  attachments?: MessageAttachment[];
  status: MessageStatus;
  timestamp: Date;
  deliveredAt?: Date;
  isDeleted: boolean;
}

/**
 * Conversation (backend schema)
 * Represents a one-to-one chat between user and astrologer
 */
export interface Conversation {
  _id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  participantRole: ParticipantRole;
  isOnline: boolean;
  lastMessage?: {
    content: string;
    timestamp: Date;
    senderId: string;
    senderType: ParticipantRole;
  };
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// UI-Specific Types (extending backend types)
// ============================================================================

/**
 * UI Message - extends ChatMessage with UI-specific fields
 * Used for optimistic updates and retry logic
 */
export interface UIMessage extends ChatMessage {
  isOptimistic: boolean; // True for messages not yet confirmed by server
  tempId?: string; // Client-generated ID for optimistic updates
  retryCount: number; // Number of send attempts
}

/**
 * UI Conversation - extends Conversation with UI state
 * Used for managing conversation display and loading states
 */
export interface UIConversation extends Conversation {
  messages: UIMessage[];
  hasMoreMessages: boolean;
  isLoadingMessages: boolean;
  initialHistoryLoaded: boolean;
  currentPage: number;
  scrollPosition: number; // Saved scroll position for restoration
}

/**
 * Conversation list item for display in chat list
 * Lightweight version for list rendering
 */
export interface ConversationListItem {
  conversationId: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  participantRole: ParticipantRole;
  isOnline: boolean;
  lastMessage: {
    content: string;
    timestamp: Date;
    senderId: string;
  };
  unreadCount: number;
}

/**
 * Chat UI state
 * Global UI state for chat interface
 */
export interface ChatUIState {
  activeConversationId: string | null;
  isMobileView: boolean;
  showChatWindow: boolean; // Mobile only
  connectionStatus: ConnectionStatus;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Get conversations list parameters
 */
export interface GetConversationsParams {
  page?: number;
  limit?: number;
}

/**
 * Get conversations list response
 */
export interface GetConversationsResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Get or create conversation response (backend returns minimal session data)
 */
export interface GetOrCreateConversationResponse {
  conversation: {
    sessionId?: string; // Backend returns sessionId instead of _id
    _id?: string; // Some responses might use _id
    userId: string;
    astrologerId: string;
    status: string;
    createdAt: Date | string;
    lastMessageAt?: Date | string;
  };
  isNew: boolean; // True if conversation was just created
}

/**
 * Get messages parameters
 */
export interface GetMessagesParams {
  conversationId: string;
  page?: number;
  limit?: number;
  before?: string; // Message ID for cursor-based pagination
}

/**
 * Get messages response
 */
export interface GetMessagesResponse {
  messages: ChatMessage[];
  hasMore: boolean;
  total: number;
}

/**
 * Mark messages as read parameters
 */
export interface MarkMessagesAsReadParams {
  conversationId: string;
  messageIds?: string[]; // Optional: specific messages to mark as read
}

/**
 * Upload attachment response
 */
export interface UploadAttachmentResponse {
  attachment: MessageAttachment;
}

/**
 * Get unread count response
 */
export interface GetUnreadCountResponse {
  total: number;
  byConversation: Record<string, number>;
}

// ============================================================================
// Socket Event Types
// ============================================================================

/**
 * Send message event (client -> server)
 */
export interface SendMessageEvent {
  sessionId: string; // Backend uses sessionId instead of conversationId
  content: string;
  tempId: string; // Client-generated ID for optimistic updates
}

/**
 * New message event (server -> client)
 * Emitted when a message is received in a chat
 */
export interface NewMessageEvent {
  sessionId: string;
  message: {
    _id: string;
    senderId: string;
    senderType: ParticipantRole;
    content: string;
    timestamp: Date;
    status: MessageStatus;
    tempId?: string;
  };
}

/**
 * Message delivered event (server -> client)
 * Confirmation that message was saved to database
 */
export interface MessageDeliveredEvent {
  messageId: string;
  sessionId: string;
  timestamp: Date;
  status: MessageStatus;
  tempId?: string;
}

/**
 * Message status changed event (server -> client)
 * Emitted when message status changes (delivered, read)
 */
export interface MessageStatusChangedEvent {
  sessionId: string;
  messageIds: string[];
  status: 'delivered';
  deliveredAt?: Date;
  deliveredTo?: string;
}

/**
 * Typing indicator event (server -> client)
 */
// Typing indicator event removed

/**
 * User online event (server -> client)
 */
export interface UserOnlineEvent {
  userId: string;
  userRole: ParticipantRole;
  timestamp: Date;
}

/**
 * User offline event (server -> client)
 */
export interface UserOfflineEvent {
  userId: string;
  userRole: ParticipantRole;
  timestamp: Date;
}

/**
 * Missed messages event (server -> client)
 * Delivered on reconnection
 */
export interface MissedMessagesEvent {
  sessionId: string;
  messages: Array<{
    _id: string;
    senderId: string;
    senderType: ParticipantRole;
    content: string;
    timestamp: Date;
    status: MessageStatus;
  }>;
  count: number;
}

/**
 * Reconnection complete event (server -> client)
 */
export interface ReconnectionCompleteEvent {
  results: Array<{
    sessionId: string;
    success: boolean;
    roomName?: string;
    missedMessageCount?: number;
    error?: string;
    message?: string;
  }>;
  totalSessions: number;
  successfulReconnections: number;
  wasOffline: boolean;
}

/**
 * Chat joined event (server -> client)
 */
export interface ChatJoinedEvent {
  sessionId: string;
  roomName: string;
  message: string;
}

/**
 * Error event (server -> client)
 */
export interface SocketErrorEvent {
  code: string;
  message: string;
  event: string;
  timestamp: Date;
}

// ============================================================================
// Local Storage Cache Types
// ============================================================================

/**
 * Cache version for migrations
 */
export const CACHE_VERSION = 1;

/**
 * Cache expiration time (24 hours in milliseconds)
 */
export const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/**
 * Pending message for offline queuing
 */
export interface PendingMessage {
  tempId: string;
  conversationId: string;
  content: string;
  attachments?: File[];
  timestamp: number;
  retryCount: number;
}

/**
 * Cached conversation data
 */
export interface CachedConversation {
  data: Conversation;
  messages: ChatMessage[];
  lastFetched: number;
}

/**
 * Local storage cache schema
 * Stores conversations, messages, and pending messages
 */
export interface ChatCache {
  version: number; // Cache version for migrations
  lastUpdated: number; // Timestamp of last cache update
  conversations: Record<string, CachedConversation>;
  pendingMessages: PendingMessage[];
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Message grouping info
 * Used for grouping consecutive messages by sender
 */
export interface MessageGroup {
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  messages: UIMessage[];
  timestamp: Date;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Retry options for failed operations
 */
export interface RetryOptions {
  maxRetries: number;
  retryDelay: number; // milliseconds
  exponentialBackoff: boolean;
}

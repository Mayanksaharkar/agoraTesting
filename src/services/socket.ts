import { io, Socket } from 'socket.io-client';
import { config } from '@/config';
import type {
  ConnectionStatus,
  NewMessageEvent,
  MessageDeliveredEvent,
  MessageStatusChangedEvent,
  TypingIndicatorEvent,
  UserOnlineEvent,
  UserOfflineEvent,
  MissedMessagesEvent,
  ReconnectionCompleteEvent,
  ChatJoinedEvent,
  SocketErrorEvent,
  SendMessageEvent,
} from '@/types/chat';

// ============================================================================
// Types
// ============================================================================

/**
 * Chat event handlers
 * Typed event handlers for all chat-specific Socket.io events
 */
export interface ChatEventHandlers {
  onNewMessage?: (event: NewMessageEvent) => void;
  onMessageDelivered?: (event: MessageDeliveredEvent) => void;
  onMessageStatusChanged?: (event: MessageStatusChangedEvent) => void;
  onTypingIndicator?: (event: TypingIndicatorEvent) => void;
  onUserOnline?: (event: UserOnlineEvent) => void;
  onUserOffline?: (event: UserOfflineEvent) => void;
  onMissedMessages?: (event: MissedMessagesEvent) => void;
  onReconnectionComplete?: (event: ReconnectionCompleteEvent) => void;
  onChatJoined?: (event: ChatJoinedEvent) => void;
  onError?: (event: SocketErrorEvent) => void;
}

/**
 * Connection status change callback
 */
export type ConnectionStatusCallback = (status: ConnectionStatus) => void;

// ============================================================================
// State
// ============================================================================

let socket: Socket | null = null;
let connectionStatus: ConnectionStatus = 'disconnected';
let connectionStatusCallbacks: Set<ConnectionStatusCallback> = new Set();
let chatEventHandlers: ChatEventHandlers = {};
let reconnectionAttempt = 0;
let maxReconnectionAttempts = 10;

// ============================================================================
// Connection Status Management
// ============================================================================

/**
 * Get current connection status
 * Requirements: 1.2, 1.3
 */
export function getConnectionStatus(): ConnectionStatus {
  return connectionStatus;
}

/**
 * Set connection status and notify all listeners
 * Requirements: 1.2, 1.3
 */
function setConnectionStatus(status: ConnectionStatus) {
  if (connectionStatus !== status) {
    connectionStatus = status;
    connectionStatusCallbacks.forEach((callback) => callback(status));
  }
}

/**
 * Subscribe to connection status changes
 * Returns unsubscribe function
 * Requirements: 1.2, 1.3
 */
export function onConnectionStatusChange(
  callback: ConnectionStatusCallback
): () => void {
  connectionStatusCallbacks.add(callback);
  // Immediately call with current status
  callback(connectionStatus);
  
  return () => {
    connectionStatusCallbacks.delete(callback);
  };
}

// ============================================================================
// Socket Management
// ============================================================================

/**
 * Get current socket instance
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Calculate exponential backoff delay
 * Requirements: 1.3, 1.4
 */
function getReconnectionDelay(attempt: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  return delay;
}

/**
 * Connect to Socket.io server with authentication
 * Implements exponential backoff reconnection logic
 * Requirements: 1.1, 1.3, 1.4
 */
export function connectSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  // Disconnect existing socket if any
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = io(config.api.socketURL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: maxReconnectionAttempts,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    timeout: 10000,
    transports: ['websocket', 'polling'],
  });

  setupSocketListeners();

  return socket;
}

/**
 * Set up core socket event listeners
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
function setupSocketListeners() {
  if (!socket) return;

  // Connection events
  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
    reconnectionAttempt = 0;
    setConnectionStatus('connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
    setConnectionStatus('disconnected');
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
    setConnectionStatus('disconnected');
  });

  // Reconnection events
  socket.io.on('reconnect_attempt', (attempt) => {
    console.log('[Socket] Reconnection attempt:', attempt);
    reconnectionAttempt = attempt;
    setConnectionStatus('reconnecting');
  });

  socket.io.on('reconnect', (attempt) => {
    console.log('[Socket] Reconnected after', attempt, 'attempts');
    reconnectionAttempt = 0;
    setConnectionStatus('connected');
  });

  socket.io.on('reconnect_failed', () => {
    console.error('[Socket] Reconnection failed after max attempts');
    setConnectionStatus('disconnected');
  });

  socket.io.on('reconnect_error', (err) => {
    console.error('[Socket] Reconnection error:', err.message);
    setConnectionStatus('reconnecting');
  });

  // Set up chat event listeners
  setupChatEventListeners();
}

/**
 * Set up chat-specific event listeners
 * Requirements: 1.4
 */
function setupChatEventListeners() {
  if (!socket) return;

  // New message received
  socket.on('new_message', (event: NewMessageEvent) => {
    chatEventHandlers.onNewMessage?.(event);
  });

  // Message delivered confirmation
  socket.on('message_delivered', (event: MessageDeliveredEvent) => {
    chatEventHandlers.onMessageDelivered?.(event);
  });

  // Message status changed (delivered, read)
  socket.on('message_status_changed', (event: MessageStatusChangedEvent) => {
    chatEventHandlers.onMessageStatusChanged?.(event);
  });

  // Typing indicator
  socket.on('typing_indicator', (event: TypingIndicatorEvent) => {
    chatEventHandlers.onTypingIndicator?.(event);
  });

  // User online status
  socket.on('user_online', (event: UserOnlineEvent) => {
    chatEventHandlers.onUserOnline?.(event);
  });

  // User offline status
  socket.on('user_offline', (event: UserOfflineEvent) => {
    chatEventHandlers.onUserOffline?.(event);
  });

  // Missed messages on reconnection
  socket.on('missed_messages', (event: MissedMessagesEvent) => {
    chatEventHandlers.onMissedMessages?.(event);
  });

  // Reconnection complete
  socket.on('reconnection_complete', (event: ReconnectionCompleteEvent) => {
    chatEventHandlers.onReconnectionComplete?.(event);
  });

  // Chat joined confirmation
  socket.on('chat_joined', (event: ChatJoinedEvent) => {
    chatEventHandlers.onChatJoined?.(event);
  });

  // Error events
  socket.on('error', (event: SocketErrorEvent) => {
    console.error('[Socket] Error:', event);
    chatEventHandlers.onError?.(event);
  });
}

/**
 * Register chat event handlers
 * Requirements: 1.4
 */
export function registerChatEventHandlers(handlers: ChatEventHandlers) {
  chatEventHandlers = { ...chatEventHandlers, ...handlers };
}

/**
 * Unregister specific chat event handler
 */
export function unregisterChatEventHandler(
  handlerName: keyof ChatEventHandlers
) {
  delete chatEventHandlers[handlerName];
}

/**
 * Clear all chat event handlers
 */
export function clearChatEventHandlers() {
  chatEventHandlers = {};
}

// ============================================================================
// Chat Event Emitters (Typed)
// ============================================================================

/**
 * Join a chat session
 * Requirements: 1.1
 */
export function joinChat(sessionId: string): void {
  if (!socket?.connected) {
    console.error('[Socket] Cannot join chat: not connected');
    return;
  }
  socket.emit('join_chat', { sessionId });
}

/**
 * Leave a chat session
 */
export function leaveChat(sessionId: string): void {
  if (!socket?.connected) {
    console.error('[Socket] Cannot leave chat: not connected');
    return;
  }
  socket.emit('leave_chat', { sessionId });
}

/**
 * Send a message
 * Requirements: 1.1
 */
export function sendMessage(event: SendMessageEvent): void {
  if (!socket?.connected) {
    console.error('[Socket] Cannot send message: not connected');
    throw new Error('Socket not connected');
  }
  socket.emit('send_message', {
    sessionId: event.sessionId,
    content: event.content
  });
}

/**
 * Emit typing indicator
 */
export function emitTyping(sessionId: string, isTyping: boolean): void {
  if (!socket?.connected) {
    return;
  }
  const event = isTyping ? 'typing_start' : 'typing_stop';
  socket.emit(event, { sessionId });
}

/**
 * Mark messages as read
 */
export function markMessagesAsRead(
  sessionId: string,
  messageIds?: string[]
): void {
  if (!socket?.connected) {
    console.error('[Socket] Cannot mark messages as read: not connected');
    return;
  }
  socket.emit('mark_read', { sessionId });
}

/**
 * Request missed messages sync
 * Requirements: 1.4
 */
export function requestMissedMessages(sessionIds: string[]): void {
  if (!socket?.connected) {
    console.error('[Socket] Cannot request missed messages: not connected');
    return;
  }
  socket.emit('reconnect_chat', { sessionIds });
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Disconnect socket and clean up
 */
export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  setConnectionStatus('disconnected');
  connectionStatusCallbacks.clear();
  chatEventHandlers = {};
  reconnectionAttempt = 0;
}

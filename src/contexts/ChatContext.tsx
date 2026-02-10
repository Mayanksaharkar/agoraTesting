import React, { createContext, useContext, useState, useCallback, useEffect, useReducer, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getSocket, joinChat } from '@/services/socket';
import { chatApi } from '@/services/chatApi';
import { handleChatError, showValidationErrorToast } from '@/utils/errorHandling';
import type {
  ChatMessage,
  Conversation,
  MessageStatus,
  UIMessage,
  UIConversation,
  ParticipantRole,
  NewMessageEvent,
  MessageDeliveredEvent,
  MessageStatusChangedEvent,
  UserOnlineEvent,
  UserOfflineEvent,
  MissedMessagesEvent,
  ReconnectionCompleteEvent,
} from '@/types/chat';

interface ChatContextValue {
  conversations: Map<string, UIConversation>;
  activeConversationId: string | null;
  isConnected: boolean;

  setActiveConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, content: string, attachments?: File[]) => Promise<void>;
  loadConversationHistory: (conversationId: string, page?: number) => Promise<void>;
  markMessagesAsRead: (conversationId: string, messageIds: string[]) => void;
  updateMessageStatus: (messageId: string, status: MessageStatus) => void;
  addMessage: (message: ChatMessage) => void;
  retryFailedMessage: (messageId: string) => Promise<void>;
  setTypingStatus: (conversationId: string, isTyping: boolean) => void;
  updateParticipantOnlineStatus: (participantId: string, isOnline: boolean) => void;
  getOrCreateConversation: (
    participantId: string,
    participantName: string,
    participantRole: ParticipantRole,
    participantAvatar?: string
  ) => Promise<string>;
  clearUnreadCount: (conversationId: string) => void;

  getConversation: (conversationId: string) => UIConversation | undefined;
  getActiveConversation: () => UIConversation | undefined;
  getTotalUnreadCount: () => number;
  getConversationList: () => UIConversation[];
}

type ConversationAction =
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'UPDATE_CONVERSATION'; payload: { id: string; updates: Partial<UIConversation> } }
  | { type: 'ADD_MESSAGE'; payload: { conversationId: string; message: UIMessage } }
  | { type: 'UPDATE_MESSAGE_STATUS'; payload: { messageId: string; status: MessageStatus } }
  | { type: 'UPDATE_MESSAGE_ID'; payload: { tempId: string; realId: string; status: MessageStatus } }
  | { type: 'SET_MESSAGES'; payload: { conversationId: string; messages: ChatMessage[]; hasMore: boolean } }
  | { type: 'PREPEND_MESSAGES'; payload: { conversationId: string; messages: ChatMessage[]; hasMore: boolean } }
  | { type: 'UPDATE_PARTICIPANT_STATUS'; payload: { participantId: string; isOnline: boolean } }
  | { type: 'CLEAR_UNREAD_COUNT'; payload: { conversationId: string } }
  | { type: 'INCREMENT_UNREAD_COUNT'; payload: { conversationId: string } };

function conversationsReducer(
  state: Map<string, UIConversation>,
  action: ConversationAction
): Map<string, UIConversation> {
  const newState = new Map(state);

  switch (action.type) {
    case 'SET_CONVERSATIONS': {
      if (!action.payload || !Array.isArray(action.payload)) return state;

      action.payload.forEach((conv) => {
        const existing = newState.get(conv._id);
        newState.set(conv._id, {
          ...conv,
          messages: existing?.messages || [],
          hasMoreMessages: existing?.hasMoreMessages ?? true,
          isLoadingMessages: false,
          initialHistoryLoaded: existing?.initialHistoryLoaded || false,
          currentPage: existing?.currentPage || 1,
          scrollPosition: existing?.scrollPosition || 0,
        });
      });
      return newState;
    }

    case 'ADD_CONVERSATION': {
      if (!newState.has(action.payload._id)) {
        newState.set(action.payload._id, {
          ...action.payload,
          messages: [],
          hasMoreMessages: true,
          isLoadingMessages: false,
          initialHistoryLoaded: false,
          currentPage: 1,
          scrollPosition: 0,
        });
      }
      return newState;
    }

    case 'UPDATE_CONVERSATION': {
      const existing = newState.get(action.payload.id);
      if (existing) {
        newState.set(action.payload.id, { ...existing, ...action.payload.updates });
      }
      return newState;
    }

    case 'ADD_MESSAGE': {
      let conv = newState.get(action.payload.conversationId);

      if (!conv) {
        conv = {
          _id: action.payload.conversationId,
          participantId: action.payload.message.senderId,
          participantName: action.payload.message.senderName,
          participantAvatar: action.payload.message.senderAvatar,
          participantRole: action.payload.message.senderType,
          isOnline: false,
          unreadCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [],
          hasMoreMessages: true,
          isLoadingMessages: false,
          initialHistoryLoaded: false,
          currentPage: 1,
          scrollPosition: 0,
        };
        newState.set(action.payload.conversationId, conv);
      }

      const existingIndex = conv.messages.findIndex(
        (m) => m._id === action.payload.message._id ||
          (action.payload.message.tempId && m.tempId === action.payload.message.tempId)
      );

      let messages = [...conv.messages];
      if (existingIndex !== -1) {
        messages[existingIndex] = action.payload.message;
      } else {
        messages.push(action.payload.message);
      }

      messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const lastMessage = messages[messages.length - 1];
      const lastMessageData = lastMessage ? {
        content: lastMessage.content,
        timestamp: lastMessage.timestamp,
        senderId: lastMessage.senderId,
        senderType: lastMessage.senderType,
      } : conv.lastMessage;

      newState.set(action.payload.conversationId, {
        ...conv,
        messages,
        lastMessage: lastMessageData,
        updatedAt: new Date(),
      });
      return newState;
    }

    case 'UPDATE_MESSAGE_STATUS': {
      newState.forEach((conv, id) => {
        const messageIndex = conv.messages.findIndex((m) => m._id === action.payload.messageId);
        if (messageIndex !== -1) {
          const updatedMessages = [...conv.messages];
          updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            status: action.payload.status,
            isOptimistic: false,
          };
          newState.set(id, { ...conv, messages: updatedMessages });
        }
      });
      return newState;
    }

    case 'UPDATE_MESSAGE_ID': {
      newState.forEach((conv, id) => {
        const messageIndex = conv.messages.findIndex((m) => m.tempId === action.payload.tempId);
        if (messageIndex !== -1) {
          const updatedMessages = [...conv.messages];
          updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            _id: action.payload.realId,
            status: action.payload.status,
            isOptimistic: false,
          };
          newState.set(id, { ...conv, messages: updatedMessages });
        }
      });
      return newState;
    }

    case 'SET_MESSAGES': {
      const conv = newState.get(action.payload.conversationId);
      if (conv) {
        const uiMessages: UIMessage[] = action.payload.messages.map((msg) => ({
          ...msg,
          isOptimistic: false,
          retryCount: 0,
        }));

        uiMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        newState.set(action.payload.conversationId, {
          ...conv,
          messages: uiMessages,
          hasMoreMessages: action.payload.hasMore,
          isLoadingMessages: false,
          initialHistoryLoaded: true,
        });
      }
      return newState;
    }

    case 'PREPEND_MESSAGES': {
      const conv = newState.get(action.payload.conversationId);
      if (conv) {
        const uiMessages: UIMessage[] = action.payload.messages.map((msg) => ({
          ...msg,
          isOptimistic: false,
          retryCount: 0,
        }));

        const allMessages = [...uiMessages, ...conv.messages];
        allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        newState.set(action.payload.conversationId, {
          ...conv,
          messages: allMessages,
          hasMoreMessages: action.payload.hasMore,
          isLoadingMessages: false,
          currentPage: conv.currentPage + 1,
        });
      }
      return newState;
    }

    case 'UPDATE_PARTICIPANT_STATUS': {
      newState.forEach((conv, id) => {
        if (conv.participantId === action.payload.participantId) {
          newState.set(id, { ...conv, isOnline: action.payload.isOnline });
        }
      });
      return newState;
    }

    case 'CLEAR_UNREAD_COUNT': {
      const conv = newState.get(action.payload.conversationId);
      if (conv) {
        newState.set(action.payload.conversationId, { ...conv, unreadCount: 0 });
      }
      return newState;
    }

    case 'INCREMENT_UNREAD_COUNT': {
      const conv = newState.get(action.payload.conversationId);
      if (conv) {
        newState.set(action.payload.conversationId, { ...conv, unreadCount: conv.unreadCount + 1 });
      }
      return newState;
    }

    default:
      return state;
  }
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [conversations, dispatch] = useReducer(conversationsReducer, new Map());
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const joinedSessionsRef = useRef<Set<string>>(new Set());

  const generateTempId = useCallback(() => {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const validateMessage = useCallback((content: string): { isValid: boolean; error?: string } => {
    if (!content || content.trim().length === 0) {
      return { isValid: false, error: 'Message cannot be empty' };
    }
    if (content.length > 2000) {
      return { isValid: false, error: 'Message cannot exceed 2000 characters' };
    }
    return { isValid: true };
  }, []);

  const sendMessage = useCallback(
    async (conversationId: string, content: string, attachments?: File[]) => {
      const validation = validateMessage(content);
      if (!validation.isValid) {
        showValidationErrorToast(validation.error || 'Invalid message');
        throw new Error(validation.error);
      }

      const socket = getSocket();
      if (!user) throw new Error('User not authenticated');

      const tempId = generateTempId();
      const messageStatus: MessageStatus = !socket?.connected ? 'failed' : 'sending';

      const optimisticMessage: UIMessage = {
        _id: tempId,
        conversationId,
        senderId: user._id,
        senderName: user.name,
        senderAvatar: user.avatar,
        senderType: user.role as ParticipantRole,
        content,
        type: 'text',
        attachments: [],
        status: messageStatus,
        timestamp: new Date(),
        isDeleted: false,
        isOptimistic: true,
        tempId,
        retryCount: 0,
      };

      dispatch({
        type: 'ADD_MESSAGE',
        payload: { conversationId, message: optimisticMessage },
      });

      if (!socket?.connected) {
        throw new Error('Not connected');
      }

      try {
        if (attachments?.length) {
          const uploads = attachments.map(chatApi.uploadAttachment);
          await Promise.all(uploads);
        }

        socket.emit('send_message', { sessionId: conversationId, content, tempId });
      } catch (error) {
        dispatch({ type: 'UPDATE_MESSAGE_STATUS', payload: { messageId: tempId, status: 'failed' } });
        handleChatError(error, { action: 'send message', conversationId });
        throw error;
      }
    },
    [user, validateMessage, generateTempId]
  );

  const addMessage = useCallback((message: ChatMessage) => {
    dispatch({
      type: 'ADD_MESSAGE',
      payload: { conversationId: message.conversationId, message: { ...message, isOptimistic: false, retryCount: 0 } },
    });
  }, []);

  const updateMessageStatus = useCallback((messageId: string, status: MessageStatus) => {
    dispatch({ type: 'UPDATE_MESSAGE_STATUS', payload: { messageId, status } });
  }, []);

  const loadConversationHistory = useCallback(
    async (conversationId: string, page: number = 1) => {
      const conversation = conversations.get(conversationId);
      if (!conversation || conversation.isLoadingMessages) return;

      try {
        dispatch({ type: 'UPDATE_CONVERSATION', payload: { id: conversationId, updates: { isLoadingMessages: true } } });
        const response = await chatApi.getMessages(conversationId, { conversationId, page, limit: 50 });

        const messages = response.messages.map(msg => ({
          ...msg,
          conversationId,
          timestamp: new Date(msg.timestamp),
        }));

        if (page === 1) {
          dispatch({ type: 'SET_MESSAGES', payload: { conversationId, messages, hasMore: response.hasMore } });
        } else {
          dispatch({ type: 'PREPEND_MESSAGES', payload: { conversationId, messages, hasMore: response.hasMore } });
        }
      } catch (error) {
        handleChatError(error, { action: 'load messages', conversationId, retryAction: () => loadConversationHistory(conversationId, page) });
        throw error;
      } finally {
        dispatch({ type: 'UPDATE_CONVERSATION', payload: { id: conversationId, updates: { isLoadingMessages: false } } });
      }
    },
    [conversations]
  );

  const markMessagesAsRead = useCallback((conversationId: string, messageIds: string[]) => { }, []);

  const retryFailedMessage = useCallback(
    async (messageId: string) => {
      let foundMessage: UIMessage | undefined;
      let convId: string | undefined;

      for (const [id, conversation] of conversations.entries()) {
        const msg = conversation.messages.find(m => m._id === messageId);
        if (msg) {
          foundMessage = msg;
          convId = id;
          break;
        }
      }

      if (!foundMessage || !convId) throw new Error('Message not found');

      dispatch({ type: 'UPDATE_MESSAGE_STATUS', payload: { messageId, status: 'sending' } });
      try {
        await sendMessage(convId, foundMessage.content);
      } catch (error) {
        dispatch({ type: 'UPDATE_MESSAGE_STATUS', payload: { messageId, status: 'failed' } });
        throw error;
      }
    },
    [conversations, sendMessage]
  );

  const setTypingStatus = useCallback((conversationId: string, isTyping: boolean) => { }, []);

  const updateParticipantOnlineStatus = useCallback((participantId: string, isOnline: boolean) => {
    dispatch({ type: 'UPDATE_PARTICIPANT_STATUS', payload: { participantId, isOnline } });
  }, []);

  const getOrCreateConversation = useCallback(
    async (id: string, name: string, role: ParticipantRole, avatar?: string): Promise<string> => {
      try {
        const response = await chatApi.getOrCreateConversation(id);
        if (!response?.conversation) throw new Error('Invalid server response');

        const conversation: Conversation = {
          _id: response.conversation.sessionId || response.conversation._id || '',
          participantId: id,
          participantName: name,
          participantAvatar: avatar,
          participantRole: role,
          isOnline: false,
          unreadCount: 0,
          createdAt: response.conversation.createdAt ? new Date(response.conversation.createdAt) : new Date(),
          updatedAt: response.conversation.lastMessageAt ? new Date(response.conversation.lastMessageAt) : new Date(),
        };

        dispatch({ type: 'ADD_CONVERSATION', payload: conversation });
        return conversation._id;
      } catch (error) {
        handleChatError(error, { action: 'create conversation' });
        throw error;
      }
    },
    []
  );

  const clearUnreadCount = useCallback((conversationId: string) => {
    dispatch({ type: 'CLEAR_UNREAD_COUNT', payload: { conversationId } });
  }, []);

  const setActiveConversation = useCallback(
    (conversationId: string) => {
      setActiveConversationId(conversationId);
      clearUnreadCount(conversationId);
    },
    [clearUnreadCount]
  );

  const ensureJoined = useCallback((sessionId: string) => {
    if (!isConnected || !sessionId) return;
    if (joinedSessionsRef.current.has(sessionId)) return;
    joinChat(sessionId);
    joinedSessionsRef.current.add(sessionId);
  }, [isConnected]);

  const getConversation = useCallback((id: string) => conversations.get(id), [conversations]);

  const getActiveConversation = useCallback(() => {
    return activeConversationId ? conversations.get(activeConversationId) : undefined;
  }, [activeConversationId, conversations]);

  const getTotalUnreadCount = useCallback(() => {
    let total = 0;
    conversations.forEach(c => total += c.unreadCount);
    return total;
  }, [conversations]);

  const getConversationList = useCallback(() => {
    return Array.from(conversations.values()).sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [conversations]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const loadConversations = async () => {
      try {
        const response = await chatApi.getConversations();
        if (response?.conversations) {
          dispatch({ type: 'SET_CONVERSATIONS', payload: response.conversations });
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    };

    loadConversations();
  }, [isAuthenticated, user]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    const onNewMessage = (payload: NewMessageEvent) => {
      const msg: ChatMessage = {
        ...payload.message,
        conversationId: payload.sessionId,
      };
      addMessage(msg);
      if (activeConversationId !== payload.sessionId) {
        dispatch({ type: 'INCREMENT_UNREAD_COUNT', payload: { conversationId: payload.sessionId } });
      }
    };

    const onMessageDelivered = (payload: MessageDeliveredEvent) => {
      updateMessageStatus(payload.messageId, 'delivered');
    };

    const onMessageStatusChanged = (payload: MessageStatusChangedEvent) => {
      updateMessageStatus(payload.messageId, payload.status);
    };

    const onUserOnline = (payload: UserOnlineEvent) => {
      updateParticipantOnlineStatus(payload.userId, true);
    };

    const onUserOffline = (payload: UserOfflineEvent) => {
      updateParticipantOnlineStatus(payload.userId, false);
    };

    const onMissedMessages = (payload: MissedMessagesEvent) => {
      payload.messages.forEach(msg => {
        addMessage({ ...msg, conversationId: payload.sessionId });
      });
    };

    const onReconnectionComplete = (payload: ReconnectionCompleteEvent) => {
      setIsConnected(true);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('new_message', onNewMessage);
    socket.on('message_delivered', onMessageDelivered);
    socket.on('message_status_changed', onMessageStatusChanged);
    socket.on('user_online', onUserOnline);
    socket.on('user_offline', onUserOffline);
    socket.on('missed_messages', onMissedMessages);
    socket.on('reconnection_complete', onReconnectionComplete);

    if (socket.connected) setIsConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new_message', onNewMessage);
      socket.off('message_delivered', onMessageDelivered);
      socket.off('message_status_changed', onMessageStatusChanged);
      socket.off('user_online', onUserOnline);
      socket.off('user_offline', onUserOffline);
      socket.off('missed_messages', onMissedMessages);
      socket.off('reconnection_complete', onReconnectionComplete);
    };
  }, [addMessage, updateMessageStatus, updateParticipantOnlineStatus, activeConversationId]);

  useEffect(() => {
    if (activeConversationId) {
      ensureJoined(activeConversationId);
    }
  }, [activeConversationId, ensureJoined]);

  const value: ChatContextValue = {
    conversations,
    activeConversationId,
    isConnected,
    setActiveConversation,
    sendMessage,
    loadConversationHistory,
    markMessagesAsRead,
    updateMessageStatus,
    addMessage,
    retryFailedMessage,
    setTypingStatus,
    updateParticipantOnlineStatus,
    getOrCreateConversation,
    clearUnreadCount,
    getConversation,
    getActiveConversation,
    getTotalUnreadCount,
    getConversationList,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

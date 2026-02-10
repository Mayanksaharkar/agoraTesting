/**
 * Chat API service layer
 * Handles HTTP requests for conversations, messages, and file uploads
 */

import { config } from '@/config';
import type {
  Conversation,
  GetConversationsParams,
  GetConversationsResponse,
  GetOrCreateConversationResponse,
  GetMessagesParams,
  GetMessagesResponse,
  UploadAttachmentResponse,
  GetUnreadCountResponse,
  ParticipantRole,
} from '@/types/chat';

const BASE_URL = config.api.baseURL;

type RawSession = {
  sessionId?: string;
  _id?: string;
  userId?: any;
  astrologerId?: any;
  status?: string;
  createdAt?: string | Date;
  lastMessageAt?: string | Date;
  lastMessage?: {
    content: string;
    timestamp: string | Date;
    senderId: string;
    senderType: ParticipantRole;
  } | null;
  unreadCount?: number;
};

function getStoredRole(): ParticipantRole | null {
  const stored = localStorage.getItem('auth_role');
  if (stored === 'user' || stored === 'astrologer') {
    return stored;
  }
  return null;
}

function normalizeParticipant(participant: any) {
  if (!participant) {
    console.warn('[chatApi] normalizeParticipant: participant is null/undefined');
    return { id: '', name: 'Participant', avatar: undefined as string | undefined };
  }

  if (typeof participant === 'string') {
    console.warn('[chatApi] normalizeParticipant: participant is a string:', participant);
    return { id: participant, name: 'Participant', avatar: undefined as string | undefined };
  }

  console.log('[chatApi] normalizeParticipant: participant object:', participant);
  
  // Handle both user format (fullName, profilePhoto) and astrologer format (personalDetails.name, personalDetails.profileImage)
  const name = participant.fullName || 
               participant.name || 
               participant.personalDetails?.name || 
               'Participant';
  
  const avatar = participant.profilePhoto || 
                 participant.avatar || 
                 participant.profileImage ||
                 participant.personalDetails?.profileImage;
  
  return {
    id: participant._id || participant.id || '',
    name,
    avatar,
  };
}

function mapSessionToConversation(session: RawSession, role: ParticipantRole): Conversation {
  const participantSource = role === 'user' ? session.astrologerId : session.userId;
  const participant = normalizeParticipant(participantSource);
  const conversationId = session.sessionId || session._id || '';
  const createdAt = session.createdAt ? new Date(session.createdAt) : new Date();
  const updatedAt = session.lastMessageAt ? new Date(session.lastMessageAt) : createdAt;

  return {
    _id: conversationId,
    participantId: participant.id,
    participantName: participant.name,
    participantAvatar: participant.avatar,
    participantRole: role === 'user' ? 'astrologer' : 'user',
    isOnline: false,
    lastMessage: session.lastMessage
      ? {
          content: session.lastMessage.content,
          timestamp: new Date(session.lastMessage.timestamp),
          senderId: session.lastMessage.senderId,
          senderType: session.lastMessage.senderType,
        }
      : undefined,
    unreadCount: session.unreadCount || 0,
    createdAt,
    updatedAt,
  };
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const responseData = await res.json();
  if (!res.ok) throw new Error(responseData.message || 'Request failed');
  
  // Unwrap the data property if it exists (backend wraps responses in {success, message, data})
  if (responseData && typeof responseData === 'object' && 'data' in responseData) {
    return responseData.data as T;
  }
  
  return responseData as T;
}

/**
 * Chat API endpoints
 */
export const chatApi = {
  /**
   * Get list of conversations for the current user
   * @param params - Pagination parameters
   * @returns Paginated list of conversations
   */
  getConversations: async (params?: GetConversationsParams): Promise<GetConversationsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/api/chat/sessions${queryString ? `?${queryString}` : ''}`;
    
    // Backend returns {sessions: [], pagination: {...}}
    // We need to transform it to match our GetConversationsResponse type
    const response = await request<{
      sessions: RawSession[];
      pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
        hasMore: boolean;
      };
    }>(endpoint);

    const role = getStoredRole() || 'user';
    
    // Debug: Log the first session to see what data we're getting
    if (response.sessions && response.sessions.length > 0) {
      console.log('[chatApi] First raw session:', response.sessions[0]);
      console.log('[chatApi] Current role:', role);
    }
    
    const conversations = (response.sessions || []).map((session) =>
      mapSessionToConversation(session, role)
    );
    
    // Debug: Log the first mapped conversation
    if (conversations.length > 0) {
      console.log('[chatApi] First mapped conversation:', conversations[0]);
    }

    return {
      conversations,
      total: response.pagination?.totalCount || conversations.length,
      page: response.pagination?.page || 1,
      totalPages: response.pagination?.totalPages || 1,
    };
  },

  /**
   * Get or create a conversation with a specific participant
   * @param participantId - ID of the user to chat with (astrologerId)
   * @returns Conversation object
   */
  getOrCreateConversation: async (participantId: string): Promise<GetOrCreateConversationResponse> => {
    // Backend returns {sessionId, userId, astrologerId, status, createdAt, lastMessageAt}
    // The request function already unwraps the 'data' property
    const response = await request<{
      sessionId: string;
      userId: string;
      astrologerId: string;
      status: string;
      createdAt: string;
      lastMessageAt?: string;
    }>('/api/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ astrologerId: participantId }),
    });
    
    // Transform to expected format
    // Map backend response to Conversation type
    return {
      conversation: {
        _id: response.sessionId,
        sessionId: response.sessionId,
        userId: response.userId,
        astrologerId: response.astrologerId,
        status: response.status,
        createdAt: response.createdAt,
        lastMessageAt: response.lastMessageAt,
      } as any, // Use 'as any' since backend returns minimal data
      isNew: !response.lastMessageAt, // If no lastMessageAt, it's a new conversation
    };
  },

  /**
   * Get message history for a conversation
   * @param conversationId - ID of the conversation (sessionId)
   * @param params - Pagination parameters
   * @returns List of messages with pagination info
   */
  getMessages: async (conversationId: string, params?: GetMessagesParams): Promise<GetMessagesResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.before) queryParams.append('before', params.before);
    if (params?.markAsRead !== undefined) queryParams.append('markAsRead', 'true');
    
    const queryString = queryParams.toString();
    const endpoint = `/api/chat/sessions/${conversationId}/messages${queryString ? `?${queryString}` : ''}`;
    
    const response = await request<{
      messages: GetMessagesResponse['messages'];
      pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
        hasMore: boolean;
      };
    }>(endpoint);

    return {
      messages: response.messages || [],
      hasMore: response.pagination?.hasMore ?? false,
      total: response.pagination?.totalCount || 0,
    };
  },

  /**
   * Upload a file attachment
   * @param file - File to upload
   * @param onProgress - Optional callback for upload progress
   * @returns Attachment metadata with URL
   */
  uploadAttachment: (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadAttachmentResponse> => {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (err) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            reject(new Error(data.message || 'Upload failed'));
          } catch {
            reject(new Error('Upload failed'));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', `${BASE_URL}/api/chat/attachments`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  },

  /**
   * Mark a conversation as read
   * @param conversationId - ID of the conversation (sessionId)
   */
  markAsRead: (conversationId: string): Promise<void> => {
    // Mark as read is handled via socket.io emit('mark_read', { sessionId })
    // This is a no-op for REST API compatibility
    return Promise.resolve();
  },

  /**
   * Get unread message count
   * @returns Total unread count and per-conversation breakdown
   */
  getUnreadCount: (): Promise<GetUnreadCountResponse> => {
    // Unread count is tracked in the conversation list response
    // This is a no-op for REST API compatibility
    return Promise.resolve({ total: 0, byConversation: {} });
  },
};

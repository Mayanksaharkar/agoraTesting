export const config = {
  api: {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    socketURL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
    timeout: 30000,
  },
  agora: {
    appId: import.meta.env.VITE_AGORA_APP_ID || '',
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Astrology Live',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  },
  features: {
    devTools: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true',
  },
  chat: {
    maxMessageLength: 2000, // Maximum characters per message (Requirement 1.3)
    messageLoadLimit: 50, // Number of messages to load per page (Requirement 2.1, 2.2)
    maxFileSize: 10 * 1024 * 1024, // 10MB max file size (Requirement 5.1)
    allowedFileTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ], // Allowed MIME types (Requirement 5.1)
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'], // Allowed file extensions
    typingDebounceMs: 300, // Delay before emitting typing event (Requirement 4.1)
    typingTimeoutMs: 3000, // Time before clearing typing indicator (Requirement 4.3)
    reconnectionAttempts: 5, // Number of reconnection attempts
    reconnectionDelayMs: 2000, // Delay between reconnection attempts
    cacheTTL: {
      conversations: 24 * 60 * 60 * 1000, // 24 hours
      messages: 60 * 60 * 1000, // 1 hour
    },
  },
  video: {
    defaultCodec: 'vp8' as const,
  },
};

export const TOPICS = [
  'All', 'General', 'Vedic', 'Tarot', 'Numerology',
  'Palmistry', 'Vastu', 'Horoscope', 'Relationship',
  'Career', 'Health', 'Other',
] as const;

export type Topic = typeof TOPICS[number];

export const TOPIC_COLORS: Record<string, string> = {
  General: 'bg-muted',
  Vedic: 'bg-accent/20 text-accent',
  Tarot: 'bg-primary/20 text-primary',
  Numerology: 'bg-success/20 text-success',
  Palmistry: 'bg-warning/20 text-warning',
  Vastu: 'bg-accent/20 text-accent',
  Horoscope: 'bg-primary/20 text-primary',
  Relationship: 'bg-live/20 text-live',
  Career: 'bg-success/20 text-success',
  Health: 'bg-warning/20 text-warning',
  Other: 'bg-muted',
};

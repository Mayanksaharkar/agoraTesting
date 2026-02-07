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
    maxMessageLength: 500,
    messageLoadLimit: 100,
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

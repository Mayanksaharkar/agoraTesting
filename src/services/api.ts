import { config } from '@/config';

const BASE_URL = config.api.baseURL;

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

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// Auth
export const authApi = {
  loginAstrologer: (email: string, password: string) =>
    request<any>('/api/v1/astrologer/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  loginUser: (email: string, password: string) =>
    request<any>('/api/v1/user/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

// Astrologer
export const astrologerApi = {
  getSessions: (status: string, page = 1, limit = 20) =>
    request<any>(`/api/v1/astrologer/live/my-sessions?status=${status}&page=${page}&limit=${limit}`),

  createSession: (data: any) =>
    request<any>('/api/v1/astrologer/live/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getSession: (sessionId: string) =>
    request<any>(`/api/v1/astrologer/live/session/${sessionId}`),

  updateSession: (sessionId: string, data: any) =>
    request<any>(`/api/v1/astrologer/live/session/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  cancelSession: (sessionId: string) =>
    request<any>(`/api/v1/astrologer/live/session/${sessionId}`, {
      method: 'DELETE',
    }),

  getStats: (period = 'today') =>
    request<any>(`/api/v1/astrologer/live/stats?period=${period}`),
};

// User
export const userApi = {
  getActiveSessions: (topic = 'All', page = 1, limit = 20) =>
    request<any>(`/api/v1/user/live/active?topic=${topic}&page=${page}&limit=${limit}`),

  getSession: (sessionId: string) =>
    request<any>(`/api/v1/user/live/session/${sessionId}`),
};

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
    request<any>('/api/v1/astrologer/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  loginUser: (email: string, password: string) =>
    request<any>('/api/v1/user/login', {
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

  // Call management
  acceptCall: (callId: string) =>
    request<any>(`/api/v1/astrologer/calls/${callId}/accept`, {
      method: 'POST',
    }),

  rejectCall: (callId: string) =>
    request<any>(`/api/v1/astrologer/calls/${callId}/reject`, {
      method: 'POST',
    }),

  endCall: (callId: string) =>
    request<any>(`/api/v1/astrologer/calls/${callId}/end`, {
      method: 'POST',
    }),

  confirmConnection: (callId: string) =>
    request<any>(`/api/v1/astrologer/calls/${callId}/connected`, {
      method: 'POST',
    }),

  getActiveCall: () =>
    request<any>('/api/v1/astrologer/calls/active'),

  getCallDetails: (callId: string) =>
    request<any>(`/api/v1/astrologer/calls/${callId}`),

  updateAvailability: (status: 'online' | 'offline') =>
    request<any>('/api/v1/astrologer/calls/availability', {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  getCallHistory: (params?: { page?: number; limit?: number; startDate?: string; endDate?: string; status?: string }) =>
    request<any>(`/api/v1/astrologer/calls/history?${new URLSearchParams(params as any).toString()}`),

  getEarnings: (period: 'all' | 'daily' | 'weekly' | 'monthly' = 'all') =>
    request<any>(`/api/v1/astrologer/calls/earnings?period=${period}`),

  getWalletSummary: () =>
    request<any>('/api/v1/astrologer/wallet'),

  requestWithdrawal: (data: { amount: number; accountDetails: { bankName: string; accountNumber: string; ifscCode: string; accountHolderName: string } }) =>
    request<any>('/api/v1/astrologer/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<any>('/api/v1/astrologer/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Package management
  getPackages: () =>
    request<any>('/api/v1/astrologer/packages'),

  createPackage: (data: { duration: number; price: number }) =>
    request<any>('/api/v1/astrologer/packages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePackage: (packageId: string, data: { duration: number; price: number }) =>
    request<any>(`/api/v1/astrologer/packages/${packageId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deletePackage: (packageId: string) =>
    request<any>(`/api/v1/astrologer/packages/${packageId}`, {
      method: 'DELETE',
    }),

  // Course live
  getCourseLiveToken: (courseId: string) =>
    request<any>(`/api/v1/astrologer/course/${courseId}/live-token`),

  // Courses
  getCourses: () =>
    request<any>('/api/v1/astrologer/courses'),

  createCourse: (data: any) =>
    request<any>('/api/v1/astrologer/course', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateCourse: (courseId: string, data: any) =>
    request<any>(`/api/v1/astrologer/course/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteCourse: (courseId: string) =>
    request<any>(`/api/v1/astrologer/course/${courseId}`, {
      method: 'DELETE'
    }),

  uploadCourseVideo: (formData: FormData) => {
    const token = localStorage.getItem('auth_token');
    return fetch(`${BASE_URL}/api/v1/astrologer/course/upload-video`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(res => res.json());
  },
  getMyBlogs: (page = 1, limit = 10) =>
    request<any>(`/api/v1/astrologer/blogs?page=${page}&limit=${limit}`),
  createBlog: (formData: FormData) => {
    const token = localStorage.getItem('auth_token');
    return fetch(`${BASE_URL}/api/v1/astrologer/blog`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(res => res.json());
  },
  updateBlog: (blogId: string, formData: FormData) => {
    const token = localStorage.getItem('auth_token');
    return fetch(`${BASE_URL}/api/v1/astrologer/blog/${blogId}`, {
      method: 'PUT',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(res => res.json());
  },
  deleteBlog: (blogId: string) =>
    request<any>(`/api/v1/astrologer/blog/${blogId}`, {
      method: 'DELETE',
    }),
};

// User
export const userApi = {
  getActiveSessions: (topic = 'All', page = 1, limit = 20) =>
    request<any>(`/api/v1/user/live/active?topic=${topic}&page=${page}&limit=${limit}`),

  getSession: (sessionId: string) =>
    request<any>(`/api/v1/user/live/session/${sessionId}`),

  getProfile: () =>
    request<any>('/api/v1/user/profile'),

  getAllAstrologers: (params?: { isOnline?: boolean; skills?: string; languages?: string; sortBy?: string }) =>
    request<any>(`/api/v1/astrologer?${new URLSearchParams(params as any).toString()}`),

  getAstrologerProfile: (astrologerId: string) =>
    request<any>(`/api/v1/astrologer/${astrologerId}`),

  getAstrologerPackages: (astrologerId: string) =>
    request<any>(`/api/v1/user/calls/astrologers/${astrologerId}/packages`),

  initiateCall: (data: any) =>
    request<any>('/api/v1/user/calls/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  cancelCall: (callId: string) =>
    request<any>(`/api/v1/user/calls/${callId}/cancel`, {
      method: 'POST',
    }),

  confirmConnection: (callId: string) =>
    request<any>(`/api/v1/user/calls/${callId}/connected`, {
      method: 'POST',
    }),

  endCall: (callId: string) =>
    request<any>(`/api/v1/user/calls/${callId}/end`, {
      method: 'POST',
    }),

  getCallDetails: (callId: string) =>
    request<any>(`/api/v1/user/calls/${callId}`),

  rateCall: (callId: string, data: { stars: number; review?: string }) =>
    request<any>(`/api/v1/user/calls/${callId}/rate`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  reportCall: (callId: string, data: { reason: string }) =>
    request<any>(`/api/v1/user/calls/${callId}/report`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCallHistory: (params?: { page?: number; limit?: number; startDate?: string; endDate?: string; status?: string }) =>
    request<any>(`/api/v1/user/calls/history?${new URLSearchParams(params as any).toString()}`),

  getActiveCall: () =>
    request<any>('/api/v1/user/calls/active'),

  addMoneyToWallet: (data: { amount: number; paymentGatewayId?: string; description?: string }) =>
    request<any>('/api/v1/user/wallet/add-money', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Courses
  getAllCourses: (params?: { search?: string; level?: string; isFree?: boolean; courseType?: string; page?: number; limit?: number }) =>
    request<any>(`/api/v1/user/courses/courses?${new URLSearchParams(params as any).toString()}`),

  getCourseById: (courseId: string, type: 'admin' | 'astrologer') =>
    request<any>(`/api/v1/user/courses/courses/${courseId}?type=${type}`),

  enrollInCourse: (courseId: string, type: 'admin' | 'astrologer') =>
    request<any>(`/api/v1/user/courses/courses/${courseId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ type })
    }),

  getMyCourses: (params?: { status?: string; page?: number; limit?: number }) =>
    request<any>(`/api/v1/user/courses/my-courses?${new URLSearchParams(params as any).toString()}`),

  getCourseJoinInfo: (courseId: string, type: 'admin' | 'astrologer') =>
    request<any>(`/api/v1/user/courses/courses/${courseId}/join?type=${type}`),

  getCourseRecording: (courseId: string, type: 'admin' | 'astrologer') =>
    request<any>(`/api/v1/user/courses/courses/${courseId}/recording?type=${type}`),

  updateCourseProgress: (enrollmentId: string, moduleId: string, completed: boolean) =>
    request<any>(`/api/v1/user/courses/enrollments/${enrollmentId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ moduleId, completed })
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<any>('/api/v1/user/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  getBlogs: (params?: { search?: string; page?: number; limit?: number }) =>
    request<any>(`/api/v1/user/blogs?${new URLSearchParams(params as any).toString()}`),
  getBlogById: (id: string) =>
    request<any>(`/api/v1/user/blogs/${id}`),
};

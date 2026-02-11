import { config } from '@/config';
import { 
  Remedy, 
  AstrologerRemedyService, 
  RemedyBooking, 
  CreateBookingRequest,
  APIResponse,
  PaginatedResponse
} from '@/types/remedy';

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

async function requestFormData<T>(
  endpoint: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    body: formData,
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// Remedy API Methods
export const remedyApi = {
  // Browse Remedies (Public)
  getAllRemedies: (category?: string) => {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    return request<APIResponse<Remedy[]>>(`/api/v1/user/remedies${params}`);
  },

  getRemedyCategories: () =>
    request<APIResponse<string[]>>('/api/v1/user/remedies/categories'),

  getRemedyById: (remedyId: string) =>
    request<APIResponse<Remedy>>(`/api/v1/user/remedies/${remedyId}`),

  // Find Astrologers
  getAstrologersForRemedy: (
    remedyId: string, 
    options?: { 
      sortBy?: 'rating' | 'price' | 'experience';
      page?: number;
      limit?: number;
    }
  ) => {
    const params = new URLSearchParams();
    if (options?.sortBy) params.append('sortBy', options.sortBy);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<APIResponse<{
      astrologers: AstrologerRemedyService[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>>(`/api/v1/user/remedies/${remedyId}/astrologers${query}`);
  },

  // Booking Management (Requires Auth)
  createBooking: (bookingData: CreateBookingRequest) =>
    request<APIResponse<RemedyBooking>>('/api/v1/user/remedies/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    }),

  getUserBookings: (options?: { status?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<APIResponse<{
      bookings: RemedyBooking[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>>(`/api/v1/user/remedies/bookings/my-bookings${query}`);
  },

  getBookingById: (bookingId: string) =>
    request<APIResponse<RemedyBooking>>(`/api/v1/user/remedies/bookings/${bookingId}`),

  updateBookingStatus: (
    bookingId: string,
    updates: {
      status?: string;
      payment_id?: string;
      transaction_id?: string;
    }
  ) =>
    request<APIResponse<RemedyBooking>>(`/api/v1/user/remedies/bookings/${bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  // Review & Rating
  submitReview: (
    bookingId: string,
    review: {
      rating: number;
      comment: string;
    }
  ) =>
    request<APIResponse<RemedyBooking>>(`/api/v1/user/remedies/bookings/${bookingId}/review`, {
      method: 'POST',
      body: JSON.stringify(review),
    }),

  // Astrologer Services (Requires Auth)
  getAvailableRemediesForAstrologer: () =>
    request<APIResponse<Remedy[]>>('/api/v1/astrologer/remedies/available-remedies'),

  setupAstrologerService: (payload: {
    remedy_id: string;
    custom_pricing: {
      specialization_name: string;
      my_price: number;
      my_duration: number;
      is_available: boolean;
    }[];
    availability: {
      is_active: boolean;
      days_available: string[];
      time_slots: { start_time: string; end_time: string; timezone: string }[];
      advance_booking_days?: number;
      buffer_time_minutes?: number;
    };
    experience?: {
      years_experience?: number;
      specialization_description?: string;
    };
    portfolio?: Record<string, unknown>;
    service_settings?: Record<string, unknown>;
  }) =>
    request<APIResponse<AstrologerRemedyService>>('/api/v1/astrologer/remedies/setup-service', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createAstrologerRemedy: (payload: {
    title: string;
    description: string;
    category: Remedy['category'];
    image: string;
    base_price: number;
    duration_minutes: number;
    delivery_type: Remedy['delivery_type'];
    tags?: string[];
    requirements?: Remedy['requirements'];
    specializations?: Remedy['specializations'];
    custom_pricing?: {
      specialization_name: string;
      my_price: number;
      my_duration: number;
      is_available: boolean;
    }[];
  }) =>
    request<APIResponse<Remedy>>('/api/v1/astrologer/remedy', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMyAstrologerServices: () =>
    request<APIResponse<AstrologerRemedyService[]>>('/api/v1/astrologer/remedies/my-services'),

  toggleAstrologerService: (serviceId: string, is_active: boolean) =>
    request<APIResponse<AstrologerRemedyService>>(`/api/v1/astrologer/remedies/services/${serviceId}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active }),
    }),

  getAstrologerBookings: (options?: { status?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return request<APIResponse<{
      bookings: RemedyBooking[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>>(`/api/v1/astrologer/remedies/bookings${query}`);
  },

  updateAstrologerBookingStatus: (
    bookingId: string,
    updates: {
      status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
      delivery_content?: {
        video_url?: string;
        report_content?: string;
        call_session_id?: string;
        delivery_notes?: string;
      };
      astrologer_notes?: string;
    }
  ) =>
    request<APIResponse<RemedyBooking>>(`/api/v1/astrologer/remedies/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  submitAstrologerResponse: (
    bookingId: string,
    payload: {
      response_type: 'video' | 'pdf' | 'text';
      text_content?: string;
      delivery_notes?: string;
      responseFile?: File | null;
    }
  ) => {
    const formData = new FormData();
    formData.append('response_type', payload.response_type);
    if (payload.text_content) formData.append('text_content', payload.text_content);
    if (payload.delivery_notes) formData.append('delivery_notes', payload.delivery_notes);
    if (payload.responseFile) formData.append('responseFile', payload.responseFile);
    return requestFormData<APIResponse<RemedyBooking>>(
      `/api/v1/astrologer/remedies/bookings/${bookingId}/response`,
      formData
    );
  },

  getBookingResponse: (bookingId: string) =>
    request<APIResponse<Pick<RemedyBooking, 'delivery' | 'status'>>>(
      `/api/v1/user/remedies/bookings/${bookingId}/response`
    ),
};
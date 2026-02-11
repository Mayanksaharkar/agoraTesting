// Types for Remedy Booking Flow

export interface Remedy {
  _id: string;
  title: string;
  description: string;
  category: 'VIP E-Pooja' | 'Palmistry' | 'Career' | 'Name Correction' | 'Face Reading' | 'Problem Solving' | 'Remedy Combos';
  image: string;
  base_price: number;
  duration_minutes: number;
  specializations: RemedySpecialization[];
  requirements: RemedyRequirement[];
  delivery_type: 'live_video' | 'recorded_video' | 'report' | 'consultation' | 'physical_item';
  tags: string[];
  is_featured: boolean;
  status: string;
}

export interface RemedySpecialization {
  name: string;
  price: number;
  duration_minutes: number;
  description?: string;
}

export interface RemedyRequirement {
  field_name: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'file';
  is_required: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
  validation?: {
    min_length?: number;
    max_length?: number;
    pattern?: string;
  };
}

export interface AstrologerRemedyService {
  _id: string;
  astrologer_id: {
    _id: string;
    personalDetails: {
      name: string;
      profileImage?: string;
      experience?: number;
    };
    systemStatus?: {
      isOnline: boolean;
    };
  };
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
    time_slots: {
      start_time: string;
      end_time: string;
      timezone: string;
    }[];
  };
  experience: {
    years_experience: number;
    total_bookings: number;
    success_rate: number;
    specialization_description?: string;
  };
  metrics: {
    average_rating: number;
    total_reviews: number;
    completion_rate: number;
    response_time_hours: number;
  };
}

export interface RemedyBooking {
  _id: string;
  user_id: string | {
    _id: string;
    fullName?: string;
    profileImage?: string;
    phoneNumber?: string;
    email?: string;
  };
  astrologer_id: {
    _id: string;
    personalDetails: {
      name: string;
      profileImage?: string;
    };
  };
  remedy_id: {
    _id: string;
    title: string;
    category: string;
    image: string;
  };
  astrologer_service_id: string;
  selected_service: {
    specialization_name: string;
    price: number;
    duration_minutes: number;
  };
  user_requirements: {
    field_name: string;
    field_value: any;
    field_type: string;
  }[];
  booking_details: {
    total_amount: number;
    booking_date: string;
    scheduled_start_time: string;
    scheduled_end_time: string;
    timezone: string;
  };
  payment_details: {
    payment_method: 'wallet' | 'razorpay' | 'paytm' | 'upi';
    payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
    payment_id?: string;
    transaction_id?: string;
    payment_date?: string;
  };
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  delivery: {
    type: 'live_video' | 'recorded_video' | 'report' | 'consultation' | 'physical_item';
    status: 'pending' | 'delivered' | 'completed';
    content?: {
      video_url?: string;
      report_content?: string;
      response_type?: 'video' | 'pdf' | 'text';
      file_url?: string;
      file_name?: string;
      file_mime?: string;
      text_content?: string;
      call_session_id?: string;
      delivery_notes?: string;
    };
    delivered_at?: string;
  };
  messages: {
    sender: 'user' | 'astrologer';
    message: string;
    timestamp: string;
    type: 'text' | 'image' | 'video' | 'file';
  }[];
  review?: {
    rating: number;
    comment: string;
    review_date: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  astrologer_service_id: string;
  selected_service: {
    specialization_name: string;
    price: number;
    duration_minutes: number;
  };
  user_requirements: {
    field_name: string;
    field_value: any;
    field_type: string;
  }[];
  scheduled_start_time: string;
  payment_method?: 'wallet' | 'razorpay' | 'paytm' | 'upi';
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
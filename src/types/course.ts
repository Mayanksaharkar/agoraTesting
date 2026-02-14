export type CourseType = 'recorded' | 'live' | 'webinar';

export interface LiveSchedule {
  startTime?: string;
  durationMinutes?: number;
  timezone?: string;
}

export interface CourseRecording {
  enabled?: boolean;
  availabilityDays?: number;
  recordingUrl?: string;
  availableUntil?: string;
}

export interface CourseZoom {
  meetingId?: string;
  webinarId?: string;
  joinUrl?: string;
  startUrl?: string;
  password?: string;
}

export interface BaseCourse {
  _id: string;
  title: string;
  description: string;
  price: number;
  isFree?: boolean;
  courseType?: CourseType;
  liveSchedule?: LiveSchedule;
  recording?: CourseRecording;
  zoom?: CourseZoom;
}

export interface AdminCourse extends BaseCourse {
  instructor?: string;
  thumbnail?: string;
  level?: string;
  tags?: string[];
}

export interface AstrologerCourse extends BaseCourse {
  astrologer?: {
    name?: string;
    email?: string;
    profilePhoto?: string;
  };
}

export interface Enrollment {
  _id: string;
  course?: AdminCourse;
  astrologerCourse?: AstrologerCourse;
  status: 'Active' | 'Completed' | 'Dropped';
  recordingAccessUntil?: string;
  progress?: {
    percentage?: number;
  };
}

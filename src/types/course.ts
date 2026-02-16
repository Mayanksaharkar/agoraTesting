export type CourseType = 'recorded' | 'live' | 'webinar';

export interface LiveSchedule {
  startDate?: string;
  endDate?: string;
  startTime?: string; // "18:00"
  daysOfWeek?: string[]; // ['Monday', 'Tuesday', ...]
  durationMinutes?: number;
  timezone?: string;
  frequency?: 'once' | 'daily' | 'weekly';
}

export interface CourseRecording {
  enabled?: boolean;
  availabilityDays?: number;
  recordingUrl?: string;
  availableUntil?: string;
}

export interface CourseModule {
  _id?: string;
  title: string;
  description: string;
  duration: number;
  videoUrl: string;
}

export interface CourseAgora {
  channelName?: string;
  recordingEnabled?: boolean;
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
  agora?: CourseAgora;
  modules?: CourseModule[];
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
  status?: 'Pending' | 'Approved' | 'Rejected';
}

export interface Enrollment {
  _id: string;
  course?: AdminCourse;
  astrologerCourse?: AstrologerCourse;
  status: 'Active' | 'Completed' | 'Dropped';
  recordingAccessUntil?: string;
  progress?: {
    percentage?: number;
    completedModules?: Array<{
      moduleId: string;
      completedAt: string;
    }>;
  };
}

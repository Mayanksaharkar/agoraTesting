import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, ExternalLink, Video, Radio, ArrowLeft, Clock, Play } from 'lucide-react';
import { userApi } from '@/services/api';
import type { AdminCourse, AstrologerCourse } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function UserCourseDetail() {
  const { courseId, type } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [course, setCourse] = useState<AdminCourse | AstrologerCourse | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isRecordingLoading, setIsRecordingLoading] = useState(false);

  const loadCourse = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await userApi.getCourseById(courseId as string, type as 'admin' | 'astrologer');
      setCourse(response.data.course);
      setIsEnrolled(response.data.isEnrolled);
      setEnrollment(response.data.enrollment);
    } catch (error: unknown) {
      toast({
        title: 'Failed to load course',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [courseId, type, toast]);

  useEffect(() => {
    if (!courseId || !type) return;
    loadCourse();
  }, [courseId, type, loadCourse]);

  const handleEnroll = async () => {
    try {
      const response = await userApi.enrollInCourse(courseId as string, type as 'admin' | 'astrologer');
      setIsEnrolled(true);
      setEnrollment(response.data);
      toast({
        title: 'Enrolled',
        description: response.message || 'You are enrolled in this course.'
      });
    } catch (error: unknown) {
      toast({
        title: 'Enrollment failed',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive'
      });
    }
  };

  const handleJoin = async () => {
    try {
      setIsJoining(true);
      const response = await userApi.getCourseJoinInfo(courseId as string, type as 'admin' | 'astrologer');
      if (!response.data?.canJoin) {
        toast({
          title: 'Join unavailable',
          description: response.data?.message || 'Join window has not opened yet.'
        });
        return;
      }
      if (!response.data?.agora) {
        toast({
          title: 'Join unavailable',
          description: 'Live session configuration is missing.'
        });
        return;
      }
      navigate(`/user/live-course/${courseId}`, {
        state: {
          agora: response.data.agora,
          channelName: response.data.channelName,
          courseInfo: response.data.courseInfo,
          courseSource: type
        }
      });
    } catch (error: unknown) {
      toast({
        title: 'Unable to join',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive'
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleRecording = async () => {
    try {
      setIsRecordingLoading(true);
      const response = await userApi.getCourseRecording(courseId as string, type as 'admin' | 'astrologer');
      if (response.data?.recordingUrl) {
        window.open(response.data.recordingUrl, '_blank');
      } else {
        toast({
          title: 'Recording unavailable',
          description: 'Recording link is not ready yet.'
        });
      }
    } catch (error: unknown) {
      toast({
        title: 'Unable to open recording',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive'
      });
    } finally {
      setIsRecordingLoading(false);
    }
  };

  const handleWatchModule = (module: any) => {
    if (!isEnrolled) return;
    navigate(`/user/recorded-course/${courseId}`, {
      state: {
        courseInfo: course,
        activeModule: module,
        enrollment: enrollment
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Course not found.</p>
      </div>
    );
  }

  const courseType = course.courseType || 'recorded';
  const startTime = course.liveSchedule?.startTime ? new Date(course.liveSchedule.startTime) : null;
  const isLiveCourse = courseType === 'live' || courseType === 'webinar';

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-amber-50 to-emerald-50">
      <header className="border-b border-amber-100 bg-white/90 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/user/courses')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-semibold text-gray-900">{course.title}</h1>
            <p className="text-xs text-muted-foreground">{courseType.toUpperCase()}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card className="bg-white/90 border-amber-100">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{courseType === 'webinar' ? 'Webinar Live' : courseType === 'live' ? 'Live Course' : 'Recorded'}</Badge>
              <Badge variant="outline">{course.isFree || course.price === 0 ? 'Free' : `₹${course.price}`}</Badge>
            </div>
            <p className="text-gray-700">{course.description}</p>
            {course.liveSchedule && isLiveCourse && (
              <div className="space-y-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="flex items-center gap-2 text-amber-900 font-semibold">
                  <Calendar className="w-4 h-4" />
                  <span>Class Schedule</span>
                </div>
                <div className="grid gap-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Period:</span>
                    <span className="font-medium">
                      {course.liveSchedule.startDate ? new Date(course.liveSchedule.startDate).toLocaleDateString() : 'N/A'} - {course.liveSchedule.endDate ? new Date(course.liveSchedule.endDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {course.liveSchedule.startTime || 'N/A'} ({course.liveSchedule.durationMinutes} mins)
                    </span>
                  </div>
                  {course.liveSchedule.daysOfWeek && course.liveSchedule.daysOfWeek.length > 0 && (
                    <div className="flex items-start justify-between">
                      <span className="text-muted-foreground">Days:</span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                        {course.liveSchedule.daysOfWeek.map(day => (
                          <Badge key={day} variant="secondary" className="text-[10px] h-4 px-1 bg-white border-amber-200 text-amber-900">{day.substring(0, 3)}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Frequency:</span>
                    <Badge variant="outline" className="capitalize text-[10px] h-4">{course.liveSchedule.frequency || 'once'}</Badge>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {!isEnrolled ? (
                <Button onClick={handleEnroll} className="bg-amber-500 hover:bg-amber-600">Enroll</Button>
              ) : (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">Enrolled</Badge>
              )}

              {isEnrolled && isLiveCourse && (
                <Button onClick={handleJoin} disabled={isJoining} className="bg-emerald-600 hover:bg-emerald-700">
                  <Radio className="w-4 h-4 mr-2" />
                  {isJoining ? 'Checking...' : 'Join Live'}
                </Button>
              )}

              {isEnrolled && course.recording?.enabled && (
                <Button variant="outline" onClick={handleRecording} disabled={isRecordingLoading}>
                  <Video className="w-4 h-4 mr-2" />
                  {isRecordingLoading ? 'Loading...' : 'View Recording'}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              )}

              {isEnrolled && courseType === 'recorded' && course.modules && course.modules.length > 0 && (
                <Button onClick={() => handleWatchModule(course.modules![0])} className="bg-emerald-600 hover:bg-emerald-700">
                  <Play className="w-4 h-4 mr-2" />
                  Start Course
                </Button>
              )}
            </div>

            {course.modules && course.modules.length > 0 && (
              <div className="pt-6 border-t border-amber-100">
                <h3 className="font-semibold text-gray-900 mb-4">Course Content</h3>
                <div className="space-y-3">
                  {course.modules.map((module, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-xl border ${isEnrolled ? 'bg-white border-amber-50 cursor-pointer hover:border-amber-200 transition-colors' : 'bg-gray-50 border-gray-100 opacity-80'}`}
                      onClick={() => isEnrolled && handleWatchModule(module)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-display font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{module.title}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {module.duration} mins</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isEnrolled && enrollment?.progress?.completedModules?.some((m: any) => m.moduleId === (module._id || module.title)) && (
                          <Badge className="bg-emerald-500 text-white border-none text-[10px] h-5">Completed</Badge>
                        )}
                        {!isEnrolled && (
                          <Badge variant="outline" className="text-[10px] h-5 bg-gray-50">Locked</Badge>
                        )}
                        {isEnrolled ? (
                          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
                            <Play className="w-5 h-5 fill-current" />
                          </div>
                        ) : (
                          <Video className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

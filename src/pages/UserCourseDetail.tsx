import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, ExternalLink, Video, Radio, ArrowLeft } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isRecordingLoading, setIsRecordingLoading] = useState(false);

  const loadCourse = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await userApi.getCourseById(courseId as string, type as 'admin' | 'astrologer');
      setCourse(response.data.course);
      setIsEnrolled(response.data.isEnrolled);
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
      if (!response.data?.joinUrl) {
        toast({
          title: 'Join unavailable',
          description: response.data?.canJoin ? 'Join link not ready.' : 'Join window has not opened yet.'
        });
        return;
      }
      window.open(response.data.joinUrl, '_blank');
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
            {startTime && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{startTime.toLocaleString()}</span>
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
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

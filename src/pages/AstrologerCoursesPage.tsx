import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Pencil, Radio, RefreshCw, Trash2 } from 'lucide-react';
import { astrologerApi } from '@/services/api';
import type { AstrologerCourse } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function AstrologerCoursesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<AstrologerCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await astrologerApi.getCourses();
      setCourses(response?.courses || []);
    } catch (error: unknown) {
      toast({
        title: 'Failed to load courses',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const canGoLive = (course: AstrologerCourse) => {
    if (!course.liveSchedule?.startTime || !course.liveSchedule?.durationMinutes) return false;
    const start = new Date(course.liveSchedule.startTime).getTime();
    const end = start + (course.liveSchedule.durationMinutes || 0) * 60000;
    const now = Date.now();
    const canJoinFrom = start - 15 * 60000;
    return now >= canJoinFrom && now <= end;
  };

  const handleGoLive = async (course: AstrologerCourse) => {
    try {
      const response = await astrologerApi.getCourseLiveToken(course._id);
      navigate(`/astrologer/live-course/${course._id}`, {
        state: {
          agora: response.data?.agora,
          channelName: response.data?.channelName,
          courseInfo: response.data?.courseInfo
        }
      });
    } catch (error: unknown) {
      toast({
        title: 'Unable to start live course',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-amber-50 to-emerald-50">
      <header className="border-b border-amber-100 bg-white/90 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-gray-900">My Courses</h1>
            <p className="text-xs text-muted-foreground">Manage your live and recorded courses</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/astrologer/courses/new')} className="gap-2">
              Create Course
            </Button>
            <Button variant="outline" onClick={loadCourses} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-white/60 animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No courses yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const startTime = course.liveSchedule?.startTime ? new Date(course.liveSchedule.startTime) : null;
              const isLiveCourse = course.courseType === 'live' || course.courseType === 'webinar';

              return (
                <Card key={course._id} className="border-emerald-100 bg-white/90">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{course.title}</h3>
                      <Badge variant="outline">{course.courseType || 'recorded'}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                    {startTime && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {startTime.toLocaleString()}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{course.status || 'Pending'}</Badge>
                      <Badge variant="outline">{course.isFree || course.price === 0 ? 'Free' : `₹${course.price}`}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isLiveCourse && (
                        <Button
                          onClick={() => handleGoLive(course)}
                          disabled={!canGoLive(course)}
                          className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                        >
                          <Radio className="w-4 h-4" />
                          {canGoLive(course) ? 'Go Live' : 'Not Live Yet'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/astrologer/courses/${course._id}/edit`)}
                        className="gap-2"
                      >
                        <Pencil className="w-4 h-4" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          const confirmed = window.confirm('Delete this course?');
                          if (!confirmed) return;
                          try {
                            await astrologerApi.deleteCourse(course._id);
                            toast({ title: 'Course deleted' });
                            loadCourses();
                          } catch (error: unknown) {
                            toast({
                              title: 'Failed to delete course',
                              description: error instanceof Error ? error.message : 'Please try again later',
                              variant: 'destructive'
                            });
                          }
                        }}
                        className="gap-2 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Pencil, Radio, RefreshCw, Trash2, Play } from 'lucide-react';
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
    const { liveSchedule } = course;
    if (!liveSchedule || !liveSchedule.durationMinutes) return false;

    const now = new Date();

    // One-time session
    if (liveSchedule.frequency === 'once' || !liveSchedule.startTime?.includes(':')) {
      if (!liveSchedule.startTime) return false;
      const start = new Date(liveSchedule.startTime).getTime();
      const end = start + (liveSchedule.durationMinutes || 0) * 60000;
      const canJoinFrom = start - 15 * 60000;
      return now.getTime() >= canJoinFrom && now.getTime() <= end;
    }

    // Recurring schedule - Normalize dates to midnight for comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (liveSchedule.startDate) {
      const start = new Date(liveSchedule.startDate);
      const normalizedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      if (today < normalizedStart) return false;
    }
    
    if (liveSchedule.endDate) {
      const end = new Date(liveSchedule.endDate);
      const normalizedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      if (today > normalizedEnd) return false;
    }

    if (liveSchedule.frequency === 'weekly' && liveSchedule.daysOfWeek) {
      const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDay = DAYS[now.getDay()];
      if (!liveSchedule.daysOfWeek.includes(currentDay)) return false;
    }

    const [hours, minutes] = liveSchedule.startTime.split(':').map(Number);
    const start = new Date(now);
    start.setHours(hours, minutes, 0, 0);

    const end = start.getTime() + (liveSchedule.durationMinutes || 0) * 60000;
    const canJoinFrom = start.getTime() - 15 * 60000;

    return now.getTime() >= canJoinFrom && now.getTime() <= end;
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-foreground">My Courses</h1>
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
                <Card key={course._id} className="border-border bg-card">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground line-clamp-1">{course.title}</h3>
                      <Badge variant="outline">{course.courseType || 'recorded'}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                    {course.liveSchedule && isLiveCourse && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {course.liveSchedule.frequency === 'once' ? (
                              course.liveSchedule.startDate ? new Date(course.liveSchedule.startDate).toLocaleDateString() : 'N/A'
                            ) : (
                              `${course.liveSchedule.startTime || 'N/A'} (${course.liveSchedule.frequency || 'recurring'})`
                            )}
                          </span>
                        </div>
                        {course.liveSchedule.daysOfWeek && course.liveSchedule.daysOfWeek.length > 0 && course.liveSchedule.frequency === 'weekly' && (
                          <div className="flex flex-wrap gap-1">
                            {course.liveSchedule.daysOfWeek.map(d => (
                              <Badge key={d} variant="secondary" className="text-[8px] h-3.5 px-1">
                                {d.substring(0, 3)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{course.status || 'Pending'}</Badge>
                      <Badge variant="outline">{course.isFree || course.price === 0 ? 'Free' : `₹${course.price}`}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isLiveCourse ? (
                        <Button
                          onClick={() => handleGoLive(course)}
                          disabled={!canGoLive(course)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 flex-1 sm:flex-none"
                        >
                          <Radio className="w-4 h-4" />
                          {canGoLive(course) ? 'Go Live' : 'Not Live Yet'}
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => navigate(`/astrologer/course-preview/${course._id}`, { state: { course } })}
                          className="gap-2 flex-1 sm:flex-none"
                        >
                          <Play className="w-4 h-4" /> View Content
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/astrologer/courses/${course._id}/edit`)}
                        className="gap-2 flex-1 sm:flex-none"
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

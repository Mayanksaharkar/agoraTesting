import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { userApi } from '@/services/api';
import type { Enrollment } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function UserMyCoursesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEnrollments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await userApi.getMyCourses({ limit: 50 });
      setEnrollments(response?.data?.enrollments || []);
    } catch (error: unknown) {
      toast({
        title: 'Failed to load enrollments',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-emerald-50 to-amber-50">
      <header className="border-b border-emerald-100 bg-white/90 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/user/courses')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-semibold text-gray-900">My Courses</h1>
            <p className="text-xs text-muted-foreground">Your enrolled live and recorded sessions</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 rounded-xl bg-white/60 animate-pulse" />
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">No enrollments yet</h2>
            <p className="text-muted-foreground">Browse courses to start learning.</p>
            <Button onClick={() => navigate('/user/courses')} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
              Browse Courses
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => {
              const course = enrollment.course || enrollment.astrologerCourse;
              if (!course) return null;
              const type = enrollment.course ? 'admin' : 'astrologer';

              return (
                <Card key={enrollment._id} className="border-emerald-100 bg-white/90">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{course.title}</h3>
                      <Badge variant="outline">{course.courseType || 'recorded'}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>

                    {course.courseType === 'recorded' && (
                      <div className="pt-2 space-y-1.5">
                        <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                          <span>Progress</span>
                          <span>{enrollment.progress?.percentage || 0}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${enrollment.progress?.percentage || 0}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <Badge variant="secondary" className={enrollment.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : ''}>
                        {enrollment.status}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/user/courses/${type}/${course._id}`)}>
                        Open
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

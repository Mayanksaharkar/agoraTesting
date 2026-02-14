import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Layers, Sparkles } from 'lucide-react';
import { userApi } from '@/services/api';
import type { AdminCourse, AstrologerCourse } from '@/types/course';
import CourseCard from '@/components/CourseCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function UserCoursesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [adminCourses, setAdminCourses] = useState<AdminCourse[]>([]);
  const [astrologerCourses, setAstrologerCourses] = useState<AstrologerCourse[]>([]);

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await userApi.getAllCourses({ search, limit: 20 });
      setAdminCourses(data?.data?.adminCourses?.courses || []);
      setAstrologerCourses(data?.data?.astrologerCourses?.courses || []);
    } catch (error: unknown) {
      toast({
        title: 'Failed to load courses',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const filteredAdmin = adminCourses.filter((course) =>
    course.title.toLowerCase().includes(search.toLowerCase())
  );
  const filteredAstrologer = astrologerCourses.filter((course) =>
    course.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-emerald-50">
      <header className="sticky top-0 z-40 border-b border-amber-100 bg-white/90 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Learning Hub</h1>
              <p className="text-xs text-muted-foreground">Live courses and webinars</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/user/my-courses')}>
            My Courses
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search courses or webinars"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-amber-100"
            />
          </div>
          <Button onClick={loadCourses} className="bg-amber-500 hover:bg-amber-600">
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 rounded-xl bg-white/60 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h2 className="text-lg font-semibold text-gray-900">Platform Courses</h2>
              </div>
              {filteredAdmin.length === 0 ? (
                <p className="text-sm text-muted-foreground">No platform courses available yet.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredAdmin.map((course) => (
                    <CourseCard
                      key={course._id}
                      course={course}
                      onClick={() => navigate(`/user/courses/admin/${course._id}`)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-amber-600" />
                <h2 className="text-lg font-semibold text-gray-900">Astrologer Courses</h2>
              </div>
              {filteredAstrologer.length === 0 ? (
                <p className="text-sm text-muted-foreground">No astrologer courses available yet.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredAstrologer.map((course) => (
                    <CourseCard
                      key={course._id}
                      course={course}
                      onClick={() => navigate(`/user/courses/astrologer/${course._id}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Calendar, Video, Radio, Users } from 'lucide-react';
import type { AdminCourse, AstrologerCourse } from '@/types/course';

interface CourseCardProps {
  course: AdminCourse | AstrologerCourse;
  onClick: () => void;
}

const typeLabelMap: Record<string, string> = {
  recorded: 'Recorded',
  live: 'Live Course',
  webinar: 'Webinar Live'
};

export default function CourseCard({ course, onClick }: CourseCardProps) {
  const courseType = course.courseType || 'recorded';
  const isFree = course.isFree || course.price === 0;
  const startTime = course.liveSchedule?.startTime ? new Date(course.liveSchedule.startTime) : null;

  return (
    <Card
      className="group cursor-pointer overflow-hidden border-border/60 bg-white/90 hover:shadow-lg hover:-translate-y-0.5 transition"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-700 transition">
              {course.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {typeLabelMap[courseType] || 'Course'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            {courseType === 'recorded' ? <Video className="w-3.5 h-3.5" /> : <Radio className="w-3.5 h-3.5" />}
            {courseType === 'recorded' ? 'Self paced' : 'Live session'}
          </span>
          {startTime && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {startTime.toLocaleString()}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {isFree ? 'Free' : `₹${course.price}`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

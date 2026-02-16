import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, Plus, Trash2, Video, Clock, Play, ArrowLeft } from "lucide-react";
import { astrologerApi } from "@/services/api";
import type { AstrologerCourse, CourseType, CourseModule } from "@/types/course";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type FormState = {
  title: string;
  description: string;
  courseType: CourseType;
  price: string;
  isFree: boolean;
  liveStartDate: string;
  liveEndDate: string;
  liveDailyTime: string;
  liveDaysOfWeek: string[];
  liveFrequency: 'once' | 'daily' | 'weekly';
  liveDurationMinutes: string;
  liveTimezone: string;
  recordingEnabled: boolean;
  recordingAvailabilityDays: string;
  modules: any[];
};

const pad = (num: number) => num.toString().padStart(2, "0");

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_FORM: FormState = {
  title: "",
  description: "",
  courseType: "recorded",
  price: "",
  isFree: false,
  liveStartDate: "",
  liveEndDate: "",
  liveDailyTime: "18:00",
  liveDaysOfWeek: [],
  liveFrequency: "once",
  liveDurationMinutes: "60",
  liveTimezone: "Asia/Kolkata",
  recordingEnabled: false,
  recordingAvailabilityDays: "",
  modules: [],
};

export default function AstrologerCourseFormPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(courseId));

  const isEditing = useMemo(() => Boolean(courseId), [courseId]);

  useEffect(() => {
    if (!courseId) return;
    let isMounted = true;
    const loadCourse = async () => {
      setIsLoading(true);
      try {
        const response = await astrologerApi.getCourses();
        const course = (response?.courses || []).find((item: AstrologerCourse) => item._id === courseId);
        if (!course) {
          toast({
            title: "Course not found",
            description: "Returning to courses list.",
            variant: "destructive",
          });
          navigate("/astrologer/courses", { replace: true });
          return;
        }
        if (!isMounted) return;
        setForm({
          title: course.title || "",
          description: course.description || "",
          courseType: course.courseType || "recorded",
          price: course.isFree ? "" : String(course.price ?? ""),
          isFree: Boolean(course.isFree || course.price === 0),
          liveStartDate: course.liveSchedule?.startDate ? new Date(course.liveSchedule.startDate).toISOString().split('T')[0] : "",
          liveEndDate: course.liveSchedule?.endDate ? new Date(course.liveSchedule.endDate).toISOString().split('T')[0] : "",
          liveDailyTime: course.liveSchedule?.startTime || "18:00",
          liveDaysOfWeek: course.liveSchedule?.daysOfWeek || [],
          liveFrequency: course.liveSchedule?.frequency || "once",
          liveDurationMinutes: course.liveSchedule?.durationMinutes
            ? String(course.liveSchedule.durationMinutes)
            : "",
          liveTimezone: course.liveSchedule?.timezone || "Asia/Kolkata",
          recordingEnabled: Boolean(course.recording?.enabled),
          recordingAvailabilityDays: course.recording?.availabilityDays
            ? String(course.recording.availabilityDays)
            : "",
          modules: (course.modules || []).map((m: any) => ({
            title: m.title || "",
            description: m.description || "",
            duration: m.duration || 0,
            videoUrl: m.videoUrl || "",
          })),
        });
      } catch (error: unknown) {
        toast({
          title: "Failed to load course",
          description: error instanceof Error ? error.message : "Please try again later",
          variant: "destructive",
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCourse();
    return () => {
      isMounted = false;
    };
  }, [courseId, navigate, toast]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addModule = () => {
    updateField("modules", [
      ...form.modules,
      { title: "", description: "", duration: 0, videoUrl: "" },
    ]);
  };

  const updateModule = (index: number, field: keyof CourseModule, value: any) => {
    const nextModules = [...form.modules];
    nextModules[index] = { ...nextModules[index], [field]: value };
    updateField("modules", nextModules);
  };

  const removeModule = (index: number) => {
    updateField(
      "modules",
      form.modules.filter((_, i) => i !== index),
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        title: form.title.trim(),
        description: form.description.trim(),
        courseType: form.courseType,
        isFree: form.isFree,
        price: form.isFree ? 0 : Number(form.price || 0),
        modules: form.modules,
      };

      if (form.courseType !== "recorded") {
        payload.liveSchedule = {
          startDate: form.liveStartDate || undefined,
          endDate: form.liveEndDate || undefined,
          startTime: form.liveDailyTime || undefined,
          daysOfWeek: form.liveDaysOfWeek,
          frequency: form.liveFrequency,
          durationMinutes: form.liveDurationMinutes ? Number(form.liveDurationMinutes) : undefined,
          timezone: form.liveTimezone || "Asia/Kolkata",
        };
      }

      if (form.recordingEnabled) {
        payload.recording = {
          enabled: true,
          availabilityDays: form.recordingAvailabilityDays
            ? Number(form.recordingAvailabilityDays)
            : undefined,
        };
      }

      if (isEditing && courseId) {
        await astrologerApi.updateCourse(courseId, payload);
        toast({ title: "Course updated" });
      } else {
        await astrologerApi.createCourse(payload);
        toast({ title: "Course created" });
      }

      navigate("/astrologer/courses");
    } catch (error: unknown) {
      toast({
        title: "Failed to save course",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-amber-50 to-emerald-50">
      <header className="border-b border-amber-100 bg-white/90 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/astrologer/courses")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="font-semibold text-gray-900">{isEditing ? "Edit Course" : "Create Course"}</h1>
              <p className="text-xs text-muted-foreground">Set the details for your course</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card className="border-emerald-100 bg-white/90">
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-48 rounded-xl bg-white/60 animate-pulse" />
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      placeholder="Enter course title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="courseType">Course Type</Label>
                    <Select
                      value={form.courseType}
                      onValueChange={(value) => updateField("courseType", value as CourseType)}
                    >
                      <SelectTrigger id="courseType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recorded">Recorded</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="webinar">Webinar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Describe what learners will get"
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="1"
                      value={form.price}
                      onChange={(e) => updateField("price", e.target.value)}
                      placeholder="Enter price"
                      disabled={form.isFree}
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-8">
                    <Switch
                      checked={form.isFree}
                      onCheckedChange={(checked) => updateField("isFree", checked)}
                    />
                    <span className="text-sm text-muted-foreground">Mark as free</span>
                  </div>
                </div>

                {form.courseType !== "recorded" && (
                  <div className="space-y-6 pt-6 border-t border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-sm font-semibold">Live Schedule</h3>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="liveStartDate">Start Date</Label>
                        <Input
                          id="liveStartDate"
                          type="date"
                          value={form.liveStartDate}
                          onChange={(e) => updateField("liveStartDate", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="liveEndDate">End Date</Label>
                        <Input
                          id="liveEndDate"
                          type="date"
                          value={form.liveEndDate}
                          onChange={(e) => updateField("liveEndDate", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="liveDailyTime">Class Time</Label>
                        <Input
                          id="liveDailyTime"
                          type="time"
                          value={form.liveDailyTime}
                          onChange={(e) => updateField("liveDailyTime", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="liveFrequency">Frequency</Label>
                        <Select
                          value={form.liveFrequency}
                          onValueChange={(value) => updateField("liveFrequency", value as any)}
                        >
                          <SelectTrigger id="liveFrequency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="once">One-time Session</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly Recurring</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="liveDuration">Duration (minutes)</Label>
                        <Input
                          id="liveDuration"
                          type="number"
                          min="0"
                          value={form.liveDurationMinutes}
                          onChange={(e) => updateField("liveDurationMinutes", e.target.value)}
                          placeholder="60"
                        />
                      </div>
                    </div>

                    {form.liveFrequency === 'weekly' && (
                      <div className="space-y-3">
                        <Label>Repeats On</Label>
                        <div className="flex flex-wrap gap-2">
                          {DAYS.map(day => {
                            const isSelected = form.liveDaysOfWeek.includes(day);
                            return (
                              <Button
                                key={day}
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                className={`text-[10px] h-8 px-3 ${isSelected ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                                onClick={() => {
                                  const next = isSelected
                                    ? form.liveDaysOfWeek.filter(d => d !== day)
                                    : [...form.liveDaysOfWeek, day];
                                  updateField("liveDaysOfWeek", next);
                                }}
                              >
                                {day.substring(0, 3)}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="liveTimezone">Timezone</Label>
                      <Input
                        id="liveTimezone"
                        value={form.liveTimezone}
                        onChange={(e) => updateField("liveTimezone", e.target.value)}
                        placeholder="Asia/Kolkata"
                      />
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      checked={form.recordingEnabled}
                      onCheckedChange={(checked) => updateField("recordingEnabled", checked)}
                    />
                    <span className="text-sm text-muted-foreground">Enable recording access</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recordingDays">Recording availability (days)</Label>
                    <Input
                      id="recordingDays"
                      type="number"
                      min="0"
                      value={form.recordingAvailabilityDays}
                      onChange={(e) => updateField("recordingAvailabilityDays", e.target.value)}
                      disabled={!form.recordingEnabled}
                      placeholder="30"
                    />
                  </div>
                </div>

                {/* Modules Section */}
                <div className="space-y-4 pt-4 border-t border-amber-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Course Modules</h3>
                      <p className="text-sm text-muted-foreground">Add video lessons for recorded courses</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addModule} className="gap-2">
                      <Plus className="w-4 h-4" /> Add Module
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {form.modules.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                        <Video className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No modules added yet.</p>
                      </div>
                    ) : (
                      form.modules.map((module, index) => (
                        <Card key={index} className="border-amber-50 bg-white shadow-sm overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex-1 space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label>Module Title</Label>
                                    <Input
                                      value={module.title}
                                      onChange={(e) => updateModule(index, "title", e.target.value)}
                                      placeholder="Lesson 1: Introduction"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Video URL</Label>
                                    <Input
                                      value={module.videoUrl}
                                      onChange={(e) => updateModule(index, "videoUrl", e.target.value)}
                                      placeholder="https://..."
                                    />
                                  </div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label>Description (Optional)</Label>
                                    <Textarea
                                      value={module.description}
                                      onChange={(e) => updateModule(index, "description", e.target.value)}
                                      placeholder="What will students learn?"
                                      rows={2}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Duration (minutes)</Label>
                                    <Input
                                      type="number"
                                      value={module.duration}
                                      onChange={(e) => updateModule(index, "duration", Number(e.target.value))}
                                      placeholder="15"
                                    />
                                  </div>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeModule(index)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-amber-100">
                  <Button type="button" variant="outline" onClick={() => navigate("/astrologer/courses")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                    {isSubmitting ? "Saving..." : isEditing ? "Update Course" : "Create Course"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div >
  );
}
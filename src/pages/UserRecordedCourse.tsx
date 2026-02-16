import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Play, CheckCircle, Clock, ArrowLeft, Menu, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { BaseCourse, CourseModule } from '@/types/course';
import { getYouTubeEmbedUrl } from '@/utils/video';
import { userApi } from '@/services/api';

interface LocationState {
    courseInfo: BaseCourse;
    activeModule: CourseModule;
    enrollment: any;
}

export default function UserRecordedCourse() {
    const { courseId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as LocationState;

    const [course, setCourse] = useState<BaseCourse | null>(state?.courseInfo || null);
    const [activeModule, setActiveModule] = useState<CourseModule | null>(state?.activeModule || null);
    const [enrollment, setEnrollment] = useState<any>(state?.enrollment || null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (!state?.courseInfo && courseId) {
            navigate(`/user/courses/astrologer/${courseId}`);
        }
    }, [state, courseId, navigate]);

    const isModuleCompleted = (moduleId: string) => {
        return enrollment?.progress?.completedModules?.some((m: any) => m.moduleId === moduleId);
    };

    const toggleModuleCompletion = async (moduleId: string) => {
        if (!enrollment?._id || !moduleId || isUpdating) return;

        const currentlyCompleted = isModuleCompleted(moduleId);
        setIsUpdating(true);
        try {
            const res = await userApi.updateCourseProgress(enrollment._id, moduleId, !currentlyCompleted);
            if (res.success) {
                setEnrollment(res.data);
            }
        } catch (error) {
            console.error('Failed to update progress:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    if (!course || !activeModule) return null;

    return (
        <div className="h-screen bg-background flex flex-col overflow-hidden">
            {/* Header */}
            <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0 z-20">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="min-w-0 flex-1">
                    <h1 className="font-display font-semibold text-foreground text-sm truncate">
                        {course.title}
                    </h1>
                    <p className="text-xs text-muted-foreground truncate">{activeModule.title}</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </Button>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Content: Video Player */}
                <main className="flex-1 flex flex-col bg-black relative">
                    <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
                        <div className="w-full max-w-5xl aspect-video bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl relative group">
                            {activeModule.videoUrl ? (
                                <iframe
                                    src={getYouTubeEmbedUrl(activeModule.videoUrl)}
                                    className="w-full h-full"
                                    allowFullScreen
                                    title={activeModule.title}
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-4">
                                    <Play className="w-16 h-16 opacity-20" />
                                    <p className="font-display">Video URL not available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-card border-t border-border p-6 overflow-y-auto">
                        <div className="max-w-5xl mx-auto">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-700">Lesson {course.modules?.indexOf(activeModule)! + 1}</Badge>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Clock className="w-3.5 h-3.5" />
                                        {activeModule.duration} minutes
                                    </div>
                                </div>
                                <Button
                                    variant={isModuleCompleted(activeModule._id || activeModule.title) ? "secondary" : "default"}
                                    size="sm"
                                    onClick={() => toggleModuleCompletion(activeModule._id || activeModule.title)}
                                    disabled={isUpdating}
                                    className={isModuleCompleted(activeModule._id || activeModule.title) ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200" : "bg-emerald-600 hover:bg-emerald-700"}
                                >
                                    {isModuleCompleted(activeModule._id || activeModule.title) ? (
                                        <><CheckCircle className="w-4 h-4 mr-2" /> Completed</>
                                    ) : (
                                        "Mark as Completed"
                                    )}
                                </Button>
                            </div>
                            <h2 className="text-xl font-display font-bold text-foreground mb-2">
                                {activeModule.title}
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                {activeModule.description || course.description}
                            </p>
                        </div>
                    </div>
                </main>

                {/* Sidebar: Module List */}
                <aside
                    className={`fixed inset-y-0 right-0 w-80 bg-card border-l border-border transform transition-transform duration-300 ease-in-out z-10 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'
                        }`}
                >
                    <div className="h-full flex flex-col">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h3 className="font-display font-bold text-foreground">Course Content</h3>
                            <Badge variant="outline">{course.modules?.length} Lessons</Badge>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-2 space-y-1">
                                {course.modules?.map((module, index) => {
                                    const mId = module._id || module.title;
                                    const isActive = activeModule.title === module.title;
                                    const completed = isModuleCompleted(mId);
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setActiveModule(module)}
                                            className={`w-full text-left p-3 rounded-xl transition-all group ${isActive
                                                ? 'bg-amber-50 border-amber-100 text-amber-900'
                                                : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border font-display text-[10px] font-bold ${isActive
                                                    ? 'bg-amber-500 border-amber-500 text-white'
                                                    : completed
                                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                                        : 'border-border group-hover:border-primary group-hover:text-primary transition-colors'
                                                    }`}>
                                                    {completed ? <CheckCircle className="w-3 h-3" /> : index + 1}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-amber-900' : 'text-foreground'}`}>
                                                        {module.title}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1 opacity-60">
                                                        <span className="flex items-center gap-1 text-[10px]"><Clock className="w-3 h-3" /> {module.duration}m</span>
                                                        {isActive && <Badge variant="secondary" className="h-4 text-[9px] px-1 bg-amber-200">Playing</Badge>}
                                                        {completed && !isActive && <span className="text-[10px] text-emerald-600 font-medium">Finished</span>}
                                                    </div>
                                                </div>
                                                {isActive && <Play className="w-4 h-4 text-amber-500 fill-current" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                </aside>
            </div>
        </div>
    );
}

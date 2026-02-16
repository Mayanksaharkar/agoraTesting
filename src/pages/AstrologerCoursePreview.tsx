import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Play, Clock, ArrowLeft, Menu, X, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { AstrologerCourse, CourseModule } from '@/types/course';
import { getYouTubeEmbedUrl } from '@/utils/video';

interface LocationState {
    course: AstrologerCourse;
}

export default function AstrologerCoursePreview() {
    const { courseId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as LocationState;

    const [course] = useState<AstrologerCourse | null>(state?.course || null);
    const [activeModule, setActiveModule] = useState<CourseModule | null>(
        course?.modules && course.modules.length > 0 ? course.modules[0] : null
    );
    const [sidebarOpen, setSidebarOpen] = useState(true);

    if (!course) {
        return (
            <div className="h-screen flex items-center justify-center flex-col gap-4">
                <p className="text-muted-foreground">Course data missing. Please go back.</p>
                <Button onClick={() => navigate('/astrologer/courses')}>Back to Courses</Button>
            </div>
        );
    }

    return (
        <div className="h-screen bg-background flex flex-col overflow-hidden">
            {/* Header */}
            <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0 z-20">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="font-display font-semibold text-foreground text-sm truncate">
                            {course.title}
                        </h1>
                        <Badge variant="outline" className="text-[10px] h-4">Astrologer Preview</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                        {activeModule ? activeModule.title : 'No modules added yet'}
                    </p>
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
                            {activeModule?.videoUrl ? (
                                <iframe
                                    src={getYouTubeEmbedUrl(activeModule.videoUrl)}
                                    className="w-full h-full"
                                    allowFullScreen
                                    title={activeModule.title}
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-4">
                                    <Video className="w-16 h-16 opacity-20" />
                                    <p className="font-display">
                                        {course.modules && course.modules.length > 0
                                            ? 'Select a module to preview'
                                            : 'Add modules to your course to see them here'}
                                    </p>
                                    <Button variant="outline" size="sm" onClick={() => navigate(`/astrologer/courses/${course._id}/edit`)}>
                                        Go to Editor
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-card border-t border-border p-6 overflow-y-auto shrink-0">
                        <div className="max-w-5xl mx-auto text-center lg:text-left">
                            {activeModule ? (
                                <>
                                    <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                                            Module {course.modules?.indexOf(activeModule)! + 1}
                                        </Badge>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Clock className="w-3.5 h-3.5" />
                                            {activeModule.duration} minutes
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-display font-bold text-foreground mb-2">
                                        {activeModule.title}
                                    </h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {activeModule.description || course.description}
                                    </p>
                                </>
                            ) : (
                                <div className="py-6">
                                    <p className="text-muted-foreground">Your course description will appear here when modules are selected.</p>
                                </div>
                            )}
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
                            <h3 className="font-display font-bold text-foreground text-sm">Modules</h3>
                            <Badge variant="outline" className="text-[10px]">{course.modules?.length || 0}</Badge>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-2 space-y-1">
                                {!course.modules || course.modules.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Video className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground">No modules yet.</p>
                                    </div>
                                ) : (
                                    course.modules.map((module, index) => {
                                        const isActive = activeModule?.title === module.title;
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
                                                        : 'border-border group-hover:border-primary group-hover:text-primary transition-colors'
                                                        }`}>
                                                        {index + 1}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className={`text-sm font-semibold truncate ${isActive ? 'text-amber-900' : 'text-foreground'}`}>
                                                            {module.title}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1 opacity-60">
                                                            <span className="flex items-center gap-1 text-[10px]"><Clock className="w-2.5 h-2.5" /> {module.duration}m</span>
                                                        </div>
                                                    </div>
                                                    {isActive && <Play className="w-3.5 h-3.5 text-amber-500 fill-current" />}
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </ScrollArea>
                        <div className="p-4 border-t border-border">
                            <Button
                                variant="outline"
                                className="w-full text-xs h-9 gap-2"
                                onClick={() => navigate(`/astrologer/courses/${course._id}/edit`)}
                            >
                                <Video className="w-3.5 h-3.5" /> Manage Modules
                            </Button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Mic, MicOff, PhoneOff, Video, VideoOff, MessageCircle, Users, Share2 } from 'lucide-react';
import { useAgora, type VideoConfig } from '@/hooks/useAgora';
import { useScreenShare } from '@/hooks/useScreenShare';
import { astrologerApi } from '@/services/api';
import { getSocket } from '@/services/socket';
import { Button } from '@/components/ui/button';
import ChatPanel from '@/components/ChatPanel';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  _id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  message: string;
  timestamp: string;
  isDeleted?: boolean;
}

interface LocationState {
  agora?: {
    appId: string;
    token?: string;
    channelName?: string;
    uid?: number;
    role?: string;
  };
  channelName?: string;
  courseInfo?: {
    title?: string;
    students?: number;
  };
}

export default function AstrologerLiveCourse() {
  const { courseId } = useParams<{ courseId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isStarting, setIsStarting] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [courseTitle, setCourseTitle] = useState<string>('Live Course');

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const socket = getSocket();

  const {
    isJoined,
    isAudioOn,
    isVideoOn,
    joinAsHost,
    toggleAudio,
    toggleVideo,
    leave,
    getClient,
    getLocalTracks,
  } = useAgora();

  const client = getClient();
  const localTracks = useMemo(() => getLocalTracks(), [getLocalTracks, isJoined]);
  const { isSharing, startScreenShare, stopScreenShare } = useScreenShare(client, localTracks);

  const state = location.state as LocationState | undefined;

  const toVideoConfig = useCallback((agora: LocationState['agora']): VideoConfig => {
    return {
      appId: agora?.appId || '',
      channelName: agora?.channelName || state?.channelName || `course_${courseId}`,
      token: agora?.token || null,
      uid: agora?.uid || 0,
      role: agora?.role === 'publisher' ? 'host' : 'host'
    };
  }, [courseId, state?.channelName]);

  useEffect(() => {
    if (state?.courseInfo?.title) {
      setCourseTitle(state.courseInfo.title);
    }
  }, [state?.courseInfo?.title]);

  useEffect(() => {
    if (!courseId) return;

    const init = async () => {
      try {
        setIsStarting(true);

        let agoraConfig = state?.agora;
        let courseInfo = state?.courseInfo;

        if (!agoraConfig) {
          const response = await astrologerApi.getCourseLiveToken(courseId);
          agoraConfig = response.data?.agora;
          courseInfo = response.data?.courseInfo;
        }

        if (!agoraConfig?.appId) {
          throw new Error('Agora configuration missing');
        }

        if (courseInfo?.title) {
          setCourseTitle(courseInfo.title);
        }

        const videoConfig = toVideoConfig(agoraConfig);
        await joinAsHost(videoConfig, 'course-local-video');

        socket?.emit('start_course_live', {
          courseId,
          astrologerId: user?._id
        });

        setIsLive(true);
      } catch (error: unknown) {
        toast({
          title: 'Failed to start live course',
          description: error instanceof Error ? error.message : 'Please try again later',
          variant: 'destructive'
        });
      } finally {
        setIsStarting(false);
      }
    };

    init();
  }, [courseId, joinAsHost, socket, state?.agora, state?.courseInfo, toVideoConfig, toast, user?._id]);

  useEffect(() => {
    if (!socket) return;

    const normalizeMessage = (payload: any): ChatMessage | null => {
      const msg = payload?.message || payload;
      if (!msg) return null;
      return {
        _id: msg._id || `${msg.userId}-${msg.timestamp || Date.now()}`,
        userId: msg.userId,
        userName: msg.name || msg.userName || 'User',
        userPhoto: msg.photo || msg.userPhoto,
        message: msg.message,
        timestamp: msg.timestamp || new Date().toISOString(),
        isDeleted: msg.isDeleted,
      };
    };

    const onMessage = (data: any) => {
      const msg = normalizeMessage(data);
      if (!msg) return;
      setMessages((prev) => [...prev, msg]);
    };

    const onStudentJoined = () => {
      setParticipantCount((count) => count + 1);
    };

    const onParticipantLeft = () => {
      setParticipantCount((count) => Math.max(0, count - 1));
    };

    socket.on('course_chat_message', onMessage);
    socket.on('student_joined', onStudentJoined);
    socket.on('participant_left', onParticipantLeft);

    return () => {
      socket.off('course_chat_message', onMessage);
      socket.off('student_joined', onStudentJoined);
      socket.off('participant_left', onParticipantLeft);
    };
  }, [socket]);

  const handleSendMessage = useCallback((message: string) => {
    if (!courseId || !user?._id) return;
    socket?.emit('course_message', { courseId, userId: user._id, message });
  }, [courseId, socket, user?._id]);

  const handleToggleScreenShare = useCallback(async () => {
    if (!courseId || !user?._id) return;
    const nextSharing = !isSharing;
    const success = nextSharing ? await startScreenShare() : await stopScreenShare();
    if (success) {
      socket?.emit('course_screen_share', {
        courseId,
        astrologerId: user._id,
        isSharing: nextSharing
      });
    }
  }, [courseId, isSharing, startScreenShare, stopScreenShare, socket, user?._id]);

  const handleEndLive = useCallback(async () => {
    if (courseId) {
      socket?.emit('leave_course_live', { courseId });
    }
    await leave();
    navigate('/astrologer');
  }, [courseId, leave, navigate, socket]);

  const statusLabel = useMemo(() => {
    if (isStarting) return 'Starting live course...';
    if (!isJoined) return 'Connecting...';
    return 'Live';
  }, [isJoined, isStarting]);

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="h-14 border-b border-border glass flex items-center px-4 gap-4 shrink-0">
        <div className="flex items-center gap-2">
          {isLive && <span className="w-3 h-3 rounded-full bg-live animate-pulse-live" />}
          <h1 className="font-display font-semibold text-foreground truncate">{courseTitle}</h1>
        </div>
        <div className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="w-4 h-4" />{participantCount}</span>
          <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" />{messages.length}</span>
          <span className="text-live font-medium">{statusLabel}</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative bg-secondary/20 flex items-center justify-center">
            <div id="course-local-video" ref={videoContainerRef} className="w-full h-full" />
            {isStarting && (
              <div className="absolute inset-0 flex items-center justify-center bg-card/80">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-foreground font-display">Starting course...</p>
                </div>
              </div>
            )}
          </div>

          {isLive && (
            <div className="h-16 border-t border-border flex items-center justify-center gap-4 bg-card">
              <Button
                variant={isVideoOn ? 'secondary' : 'destructive'}
                size="icon"
                onClick={toggleVideo}
                className="rounded-full w-12 h-12"
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>
              <Button
                variant={isAudioOn ? 'secondary' : 'destructive'}
                size="icon"
                onClick={toggleAudio}
                className="rounded-full w-12 h-12"
              >
                {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>
              <Button
                variant={isSharing ? 'secondary' : 'outline'}
                size="icon"
                onClick={handleToggleScreenShare}
                className="rounded-full w-12 h-12"
              >
                <Share2 className="w-5 h-5" />
              </Button>
              <Button onClick={handleEndLive} variant="destructive" className="rounded-full px-6 h-12 gap-2">
                <PhoneOff className="w-5 h-5" /> End Live
              </Button>
            </div>
          )}
        </div>

        <div className="w-80 lg:w-96 border-l border-border flex flex-col bg-card/50 hidden md:flex">
          <ChatPanel messages={messages} onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}

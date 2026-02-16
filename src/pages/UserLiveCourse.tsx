import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Eye, Clock, Loader2, LogOut, MessageCircle } from 'lucide-react';
import { useAgora, type VideoConfig } from '@/hooks/useAgora';
import { getSocket } from '@/services/socket';
import { userApi } from '@/services/api';
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
    instructor?: string;
  };
  courseSource?: 'admin' | 'astrologer';
}

export default function UserLiveCourse() {
  const { courseId } = useParams<{ courseId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [courseInfo, setCourseInfo] = useState<LocationState['courseInfo']>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [duration, setDuration] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  const socket = getSocket();

  const { isJoined, remoteUsers, joinAsViewer, leave } = useAgora();

  const state = location.state as LocationState | undefined;

  const toVideoConfig = useCallback((agora: LocationState['agora']): VideoConfig => {
    return {
      appId: agora?.appId || '',
      channelName: agora?.channelName || state?.channelName || `course_${courseId}`,
      token: agora?.token || null,
      uid: agora?.uid || 0,
      role: agora?.role === 'subscriber' ? 'audience' : 'audience'
    };
  }, [courseId, state?.channelName]);

  useEffect(() => {
    if (!courseId) return;

    const init = async () => {
      try {
        setIsConnecting(true);

        let agoraConfig = state?.agora;
        let info = state?.courseInfo;
        const courseSource = state?.courseSource || 'astrologer';

        if (!agoraConfig) {
          const response = await userApi.getCourseJoinInfo(courseId, courseSource);
          agoraConfig = response.data?.agora;
          info = response.data?.courseInfo;
        }

        if (!agoraConfig?.appId) {
          throw new Error('Agora configuration missing');
        }

        if (info) {
          setCourseInfo(info);
        }

        const videoConfig = toVideoConfig(agoraConfig);
        await joinAsViewer(videoConfig);

        socket?.emit('join_course_live', {
          courseId,
          userId: user?._id
        });

        setIsConnecting(false);
      } catch (error: unknown) {
        toast({
          title: 'Failed to join live course',
          description: error instanceof Error ? error.message : 'Please try again later',
          variant: 'destructive'
        });
        setIsConnecting(false);
      }
    };

    init();
  }, [courseId, joinAsViewer, socket, state?.agora, state?.courseInfo, state?.courseSource, toVideoConfig, toast, user?._id]);

  useEffect(() => {
    if (isJoined) {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isJoined]);

  useEffect(() => {
    if (remoteUsers.length > 0) {
      // Logic to distinguish camera and screen share:
      // When both are present, they will have a 1000 UID difference.
      // The higher one is the screen share.
      const sortedUsers = [...remoteUsers].sort((a, b) => Number(a.uid) - Number(b.uid));

      let cameraUser = sortedUsers[0];
      let screenUser = null;

      if (sortedUsers.length > 1) {
        // If we have two related UIDs (difference around 1000), the larger one is screen share
        if (Math.abs(Number(sortedUsers[1].uid) - Number(sortedUsers[0].uid)) === 1000) {
          cameraUser = sortedUsers[0];
          screenUser = sortedUsers[1];
        }
      }

      // Play Screen Share in main panel if available
      if (screenUser && remoteVideoRef.current) {
        screenUser.videoTrack?.play(remoteVideoRef.current);
      } else if (cameraUser && remoteVideoRef.current) {
        cameraUser.videoTrack?.play(remoteVideoRef.current);
      }

      // If both are available, show camera in the overlay
      if (screenUser && cameraUser) {
        setTimeout(() => {
          const overlayEl = document.getElementById('remote-video-overlay');
          if (overlayEl) {
            cameraUser.videoTrack?.play(overlayEl);
          }
        }, 1000);
      }
    }
  }, [remoteUsers]);

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

    const onScreenShare = (data: any) => {
      setIsScreenSharing(!!data?.isSharing);
    };

    socket.on('course_chat_message', onMessage);
    socket.on('instructor_screen_share', onScreenShare);

    return () => {
      socket.off('course_chat_message', onMessage);
      socket.off('instructor_screen_share', onScreenShare);
    };
  }, [socket]);

  const handleSendMessage = useCallback((message: string) => {
    if (!courseId || !user?._id) return;
    socket?.emit('course_message', { courseId, userId: user._id, message });
  }, [courseId, socket, user?._id]);

  const handleLeave = useCallback(async () => {
    if (courseId) {
      socket?.emit('leave_course_live', { courseId });
    }
    await leave();
    navigate('/user');
  }, [courseId, leave, navigate, socket]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="h-14 border-b border-border glass flex items-center px-4 gap-3 shrink-0">
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-foreground text-sm truncate">
            {courseInfo?.title || 'Live Course'}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-live animate-pulse-live" />
              LIVE
            </span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(duration)}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{remoteUsers.length}</span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleLeave} className="gap-2">
          <LogOut className="w-4 h-4" /> Leave
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative bg-secondary/20 flex items-center justify-center">
            <div ref={remoteVideoRef} className="w-full h-full" />

            {/* Camera Overlay for Student */}
            {remoteUsers.length > 1 && (
              <div
                id="remote-video-overlay"
                className="absolute bottom-4 right-4 w-48 h-36 bg-black rounded-lg border-2 border-primary overflow-hidden shadow-2xl z-10"
              />
            )}

            {isConnecting && (
              <div className="absolute inset-0 flex items-center justify-center bg-card/80">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                  <p className="text-foreground font-display">Connecting to live course...</p>
                </div>
              </div>
            )}

            {!isConnecting && remoteUsers.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground">Waiting for instructor video...</p>
              </div>
            )}

            {isScreenSharing && (
              <div className="absolute top-4 left-4 bg-card/80 text-foreground text-xs px-3 py-1 rounded-full flex items-center gap-2">
                <MessageCircle className="w-3 h-3" /> Screen sharing
              </div>
            )}
          </div>
        </div>

        <div className="w-80 lg:w-96 border-l border-border flex flex-col bg-card/50 hidden md:flex">
          <ChatPanel messages={messages} onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}

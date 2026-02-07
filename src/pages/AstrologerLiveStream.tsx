import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Eye, Heart, MessageCircle, Clock } from 'lucide-react';
import { useAgora, VideoConfig } from '@/hooks/useAgora';
import { getSocket } from '@/services/socket';
import { astrologerApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import ChatPanel from '@/components/ChatPanel';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  _id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  message: string;
  timestamp: string;
  isDeleted?: boolean;
}

export default function AstrologerLiveStream() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isJoined, isAudioOn, isVideoOn, joinAsHost, toggleAudio, toggleVideo, leave } = useAgora();

  const [isLive, setIsLive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stats, setStats] = useState({ currentViewers: 0, totalViewers: 0, totalMessages: 0, totalLikes: 0, peakViewers: 0 });
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const session = location.state?.session;

  // Duration timer
  useEffect(() => {
    if (isLive) {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isLive]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onViewerJoined = (data: any) => {
      setStats((s) => ({ ...s, currentViewers: data.currentViewerCount }));
      toast({ title: `${data.userName} joined!`, duration: 2000 });
    };

    const onViewerLeft = (data: any) => {
      setStats((s) => ({ ...s, currentViewers: data.currentViewerCount }));
    };

    const onMessage = (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
      setStats((s) => ({ ...s, totalMessages: s.totalMessages + 1 }));
    };

    const onLike = (data: any) => {
      setStats((s) => ({ ...s, totalLikes: data.totalLikes }));
    };

    const onStatsUpdate = (data: any) => {
      setStats((s) => ({ ...s, ...data }));
    };

    const onLiveStarted = (data: any) => {
      setIsLive(true);
      setIsStarting(false);
      toast({ title: 'You are LIVE!', description: 'Viewers can now join your stream' });
    };

    const onLiveEnded = () => {
      setIsLive(false);
      clearInterval(timerRef.current);
    };

    socket.on('viewer_joined', onViewerJoined);
    socket.on('viewer_left', onViewerLeft);
    socket.on('live_message', onMessage);
    socket.on('live_like', onLike);
    socket.on('stats_update', onStatsUpdate);
    socket.on('live_started', onLiveStarted);
    socket.on('live_ended', onLiveEnded);

    return () => {
      socket.off('viewer_joined', onViewerJoined);
      socket.off('viewer_left', onViewerLeft);
      socket.off('live_message', onMessage);
      socket.off('live_like', onLike);
      socket.off('stats_update', onStatsUpdate);
      socket.off('live_started', onLiveStarted);
      socket.off('live_ended', onLiveEnded);
    };
  }, [toast]);

  const handleStartLive = useCallback(async () => {
    if (!sessionId) return;
    setIsStarting(true);

    try {
      // Fetch session details for video config
      const data = await astrologerApi.getSession(sessionId);
      const videoConfig: VideoConfig = data.videoConfig || data.session?.agora;

      if (videoConfig) {
        await joinAsHost(videoConfig, 'local-video');
      }

      const socket = getSocket();
      socket?.emit('start_live', { sessionId });
    } catch (err: any) {
      toast({ title: 'Failed to start', description: err.message, variant: 'destructive' });
      setIsStarting(false);
    }
  }, [sessionId, joinAsHost, toast]);

  const handleEndLive = useCallback(async () => {
    const socket = getSocket();
    socket?.emit('end_live', { sessionId, reason: 'Session completed' });
    await leave();
    setIsLive(false);
    clearInterval(timerRef.current);
    navigate('/astrologer');
  }, [sessionId, leave, navigate]);

  const handleDeleteMessage = useCallback((messageId: string) => {
    const socket = getSocket();
    socket?.emit('delete_message', { sessionId, messageId });
    setMessages((prev) => prev.filter((m) => m._id !== messageId));
  }, [sessionId]);

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="h-14 border-b border-border glass flex items-center px-4 gap-4 shrink-0">
        <div className="flex items-center gap-2">
          {isLive && <span className="w-3 h-3 rounded-full bg-live animate-pulse-live" />}
          <h1 className="font-display font-semibold text-foreground truncate">{session?.title || 'Live Stream'}</h1>
        </div>
        <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{stats.currentViewers}</span>
          <span className="flex items-center gap-1"><Heart className="w-4 h-4 text-live" />{stats.totalLikes}</span>
          <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" />{stats.totalMessages}</span>
          {isLive && <span className="flex items-center gap-1 text-live"><Clock className="w-4 h-4" />{formatDuration(duration)}</span>}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative bg-secondary/30 flex items-center justify-center">
            <div id="local-video" ref={videoContainerRef} className="w-full h-full" />
            {!isLive && !isStarting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80">
                <Video className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="font-display text-xl text-foreground mb-2">Ready to go live?</h2>
                <p className="text-muted-foreground text-sm mb-6">Your camera will turn on when you start</p>
                <Button onClick={handleStartLive} className="gold-gradient text-primary-foreground px-8 h-12 text-lg gap-2">
                  <Video className="w-5 h-5" /> Go Live
                </Button>
              </div>
            )}
            {isStarting && (
              <div className="absolute inset-0 flex items-center justify-center bg-card/80">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-foreground font-display">Starting stream...</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
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
              <Button onClick={handleEndLive} variant="destructive" className="rounded-full px-6 h-12 gap-2">
                <PhoneOff className="w-5 h-5" /> End Live
              </Button>
            </div>
          )}
        </div>

        {/* Chat sidebar */}
        <div className="w-80 lg:w-96 border-l border-border flex flex-col bg-card/50 hidden md:flex">
          <ChatPanel
            messages={messages}
            canDelete
            onDeleteMessage={handleDeleteMessage}
            onSendMessage={() => {}}
            isHost
          />
        </div>
      </div>
    </div>
  );
}

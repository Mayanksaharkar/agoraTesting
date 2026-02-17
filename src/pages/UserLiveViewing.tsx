import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Share2, LogOut as LeaveIcon, Eye, Clock, Loader2 } from 'lucide-react';
import { useAgora, VideoConfig } from '@/hooks/useAgora';
import { getSocket } from '@/services/socket';
import { userApi } from '@/services/api';
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

export default function UserLiveViewing() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isJoined, remoteUsers, joinAsViewer, leave } = useAgora();

  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [likes, setLikes] = useState(0);
  const [currentViewers, setCurrentViewers] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isEnded, setIsEnded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  // Duration timer
  useEffect(() => {
    if (isJoined && !isEnded) {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isJoined, isEnded]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Fetch session and join
  useEffect(() => {
    if (!sessionId) return;

    const init = async () => {
      try {
        const data = await userApi.getSession(sessionId);
        console.log('User session data:', data);

        setSession(data.session);
        setMessages(data.session?.messages || []);
        setLikes(data.session?.stats?.totalLikes || 0);
        setCurrentViewers(data.session?.currentViewers || 0);

        // Join via socket
        const socket = getSocket();
        socket?.emit('join_live', { sessionId });

        // Join Agora as viewer
        if (data.videoConfig) {
          console.log('Viewer video config:', data.videoConfig);
          if (!data.videoConfig.appId) {
            throw new Error('Agora App ID is missing from backend');
          }
          await joinAsViewer(data.videoConfig as VideoConfig);
        } else {
          console.warn('No video config available, continuing without video');
        }

        setIsConnecting(false);
      } catch (err: any) {
        console.error('Failed to join session:', err);
        toast({ title: 'Failed to join', description: err.message, variant: 'destructive' });
        setIsConnecting(false);
      }
    };

    init();
  }, [sessionId, joinAsViewer, toast]);

  // Play remote video when user publishes
  useEffect(() => {
    if (remoteUsers.length > 0 && remoteVideoRef.current) {
      const user = remoteUsers[0];
      user.videoTrack?.play(remoteVideoRef.current);
    }
  }, [remoteUsers]);

  // Socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const normalizeMessage = (payload: any): ChatMessage | null => {
      const msg = payload?.message || payload;
      if (!msg) return null;
      return {
        _id: msg._id || msg.id || `${msg.userId}-${msg.timestamp || Date.now()}`,
        userId: msg.userId,
        userName: msg.userName || 'Anonymous',
        userPhoto: msg.userPhoto,
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

    const onLike = (data: any) => {
      setLikes((prev) => data.totalLikes ?? prev);
    };

    const onViewerJoined = (data: any) => {
      const count = data.currentViewers ?? data.currentViewerCount ?? 0;
      setCurrentViewers(count);
    };

    const onViewerLeft = (data: any) => {
      const count = data.currentViewers ?? data.currentViewerCount ?? 0;
      setCurrentViewers(count);
    };

    const onEnded = (data: any) => {
      setIsEnded(true);
      clearInterval(timerRef.current);
      toast({ title: 'Stream ended', description: 'The astrologer has ended the session' });
    };

    const onMessageDeleted = (data: any) => {
      setMessages((prev) => prev.filter((m) => m._id !== data.messageId));
    };

    socket.on('live_message', onMessage);
    socket.on('live_chat_message', onMessage);
    socket.on('live_like', onLike);
    socket.on('live_liked', onLike);
    socket.on('viewer_joined', onViewerJoined);
    socket.on('viewer_left', onViewerLeft);
    socket.on('live_ended', onEnded);
    socket.on('message_deleted', onMessageDeleted);

    return () => {
      socket.off('live_message', onMessage);
      socket.off('live_chat_message', onMessage);
      socket.off('live_like', onLike);
      socket.off('live_liked', onLike);
      socket.off('viewer_joined', onViewerJoined);
      socket.off('viewer_left', onViewerLeft);
      socket.off('live_ended', onEnded);
      socket.off('message_deleted', onMessageDeleted);
    };
  }, [toast]);

  const handleSendMessage = useCallback((message: string) => {
    const socket = getSocket();
    socket?.emit('live_message', { sessionId, message });
  }, [sessionId]);

  const handleLike = useCallback(() => {
    const socket = getSocket();
    socket?.emit('live_like', { sessionId });
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 300);
  }, [sessionId]);

  const handleLeave = useCallback(async () => {
    const socket = getSocket();
    socket?.emit('leave_live', { sessionId });
    await leave();
    navigate('/user');
  }, [sessionId, leave, navigate]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: 'Link copied!' });
  };

  const astrologer = session?.astrologerId;

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="h-14 border-b border-border glass flex items-center px-4 gap-3 shrink-0">
        <button
          onClick={() => astrologer?._id && navigate(`/user/astrologer/${astrologer._id}`)}
          className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
        >
          {astrologer?.personalDetails?.profileImage && (
            <img src={astrologer.personalDetails.profileImage} alt="" className="w-8 h-8 rounded-full object-cover border border-border" />
          )}
          <div className="min-w-0 flex-1 text-left">
            <p className="font-display font-semibold text-foreground text-sm truncate">
              {astrologer?.personalDetails?.pseudonym || astrologer?.personalDetails?.name || 'Astrologer'} — {session?.title || 'Live Session'}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-live animate-pulse-live" />
                LIVE
              </span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{currentViewers}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(duration)}</span>
              <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-live" />{likes}</span>
            </div>
          </div>
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Video */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative bg-secondary/20 flex items-center justify-center">
            {session?.streamSettings?.streamPlatform === 'youtube' && session?.youtube?.broadcastId ? (
              <div className="w-full h-full">
                <iframe
                  src={`https://www.youtube.com/embed/${session.youtube.broadcastId}?autoplay=1&mute=0&rel=0`}
                  title="YouTube Live Stream"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full aspect-video"
                />
              </div>
            ) : (
              <div ref={remoteVideoRef} className="w-full h-full" />
            )}

            {isConnecting && (
              <div className="absolute inset-0 flex items-center justify-center bg-card/80">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                  <p className="text-foreground font-display">Connecting to stream...</p>
                </div>
              </div>
            )}

            {isEnded && !(session?.youtube?.broadcastId && session?.status === 'ended') && (
              <div className="absolute inset-0 flex items-center justify-center bg-card/90">
                <div className="text-center">
                  <p className="text-2xl font-display text-foreground mb-2">Stream Ended</p>
                  <p className="text-muted-foreground mb-4">Thanks for watching!</p>
                  <Button onClick={() => navigate('/user')} className="gold-gradient text-primary-foreground">
                    Back to Sessions
                  </Button>
                </div>
              </div>
            )}

            {/* Show recording available message for ended YouTube sessions */}
            {session?.status === 'ended' && session?.youtube?.broadcastId && (
              <div className="absolute top-4 left-4 right-4 bg-emerald-600/90 text-white px-4 py-2 rounded-lg shadow-lg">
                <p className="text-sm font-medium">📹 This session has ended. You're watching the recording.</p>
              </div>
            )}

            {!isConnecting && !isEnded && session?.streamSettings?.streamPlatform === 'agora' && remoteUsers.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground">Waiting for astrologer's video...</p>
              </div>
            )}

            {!isConnecting && !isEnded && session?.streamSettings?.streamPlatform === 'youtube' && !session?.youtube?.broadcastId && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground">YouTube Live not initialized yet...</p>
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="h-14 border-t border-border flex items-center justify-center gap-3 px-4 bg-card">
            <Button
              onClick={handleLike}
              variant="ghost"
              className={`gap-2 text-live hover:text-live ${likeAnimating ? 'animate-counter-bump' : ''}`}
            >
              <Heart className={`w-5 h-5 ${likeAnimating ? 'fill-current' : ''}`} />
              {likes}
            </Button>
            <Button onClick={handleShare} variant="ghost" className="gap-2 text-muted-foreground">
              <Share2 className="w-5 h-5" /> Share
            </Button>
            <Button onClick={handleLeave} variant="ghost" className="gap-2 text-destructive">
              <LeaveIcon className="w-5 h-5" /> Leave
            </Button>
          </div>
        </div>

        {/* Chat */}
        <div className="w-80 lg:w-96 border-l border-border flex-col bg-card/50 hidden md:flex">
          <ChatPanel messages={messages} onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}

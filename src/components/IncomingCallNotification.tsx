import { useState, useEffect } from 'react';
import { Phone, PhoneOff, Video, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface IncomingCallNotificationProps {
  callId: string;
  userName: string;
  userPhoto?: string;
  callType: 'audio' | 'video';
  onAccept: () => void;
  onReject: () => void;
  timeout?: number; // in seconds, default 30
}

export default function IncomingCallNotification({
  callId,
  userName,
  userPhoto,
  callType,
  onAccept,
  onReject,
  timeout = 30,
}: IncomingCallNotificationProps) {
  const [timeLeft, setTimeLeft] = useState(timeout);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAutoDismiss = () => {
    setIsVisible(false);
    // Auto-reject after timeout
    setTimeout(() => {
      onReject();
    }, 300);
  };

  const handleAccept = () => {
    setIsVisible(false);
    setTimeout(() => {
      onAccept();
    }, 300);
  };

  const handleReject = () => {
    setIsVisible(false);
    setTimeout(() => {
      onReject();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in-0">
      <div
        className={cn(
          'bg-card border-2 border-primary rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4',
          'animate-in zoom-in-95 slide-in-from-top-10 duration-300'
        )}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-pulse">
            {callType === 'video' ? (
              <Video className="w-8 h-8 text-primary" />
            ) : (
              <Mic className="w-8 h-8 text-primary" />
            )}
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-1">
            Incoming {callType === 'video' ? 'Video' : 'Audio'} Call
          </h2>
          <p className="text-sm text-muted-foreground">
            Answer within {timeLeft}s
          </p>
        </div>

        {/* User Info */}
        <div className="flex flex-col items-center mb-8">
          <Avatar className="w-24 h-24 mb-4 ring-4 ring-primary/20">
            <AvatarImage src={userPhoto} alt={userName} />
            <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-xl font-semibold text-foreground">{userName}</h3>
          <p className="text-sm text-muted-foreground">wants to consult with you</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-linear"
              style={{ width: `${(timeLeft / timeout) * 100}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handleReject}
            variant="outline"
            size="lg"
            className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground gap-2"
          >
            <PhoneOff className="w-5 h-5" />
            Reject
          </Button>
          <Button
            onClick={handleAccept}
            size="lg"
            className="flex-1 gold-gradient text-primary-foreground gap-2 animate-pulse"
          >
            <Phone className="w-5 h-5" />
            Accept
          </Button>
        </div>

        {/* Call ID (for debugging) */}
        <p className="text-xs text-muted-foreground text-center mt-4 opacity-50">
          Call ID: {callId.slice(0, 8)}...
        </p>
      </div>
    </div>
  );
}

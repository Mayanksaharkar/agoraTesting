import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, PhoneOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { userApi } from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import { getSocket } from '@/services/socket';

interface CallSession {
  _id: string;
  astrologerId: {
    _id: string;
    personalDetails: {
      pseudonym?: string;
      profileImage?: string;
    };
  };
  callType: 'audio' | 'video';
  status: string;
}

const CALL_TIMEOUT_MS = 30000; // 30 seconds

export default function CallRinging() {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Fetch call session details
  useEffect(() => {
    if (!callId) {
      setError('Invalid call ID');
      setIsLoading(false);
      return;
    }

    const fetchCallSession = async () => {
      try {
        // TODO: Replace with actual API endpoint when available
        // For now, we'll simulate the call session data
        // const response = await userApi.getCallSession(callId);
        // setCallSession(response.callSession);
        
        // Simulated data for development
        console.log('Fetching call session:', callId);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load call session');
        setIsLoading(false);
      }
    };

    fetchCallSession();
  }, [callId]);

  // Handle 30-second timeout
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTimeoutReached(true);
      toast({
        title: 'Call Timeout',
        description: 'The astrologer did not answer your call.',
        variant: 'destructive',
      });
      
      // Auto-navigate back after showing the message
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    }, CALL_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, [navigate]);

  // Listen for Socket.io events
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !callId) return;

    console.log('Setting up socket listeners for call:', callId);

    // Call accepted by astrologer
    const handleCallAccepted = (data: any) => {
      console.log('Call accepted event received:', data);
      if (data.callId === callId) {
        // Store Agora credentials from the event
        if (data.agora) {
          console.log('Storing Agora credentials:', data.agora);
          localStorage.setItem(`agora_${callId}`, JSON.stringify(data.agora));
        }
        
        toast({
          title: 'Call Accepted',
          description: 'Connecting to the call...',
        });
        // Navigate to the in-call UI
        navigate(`/user/call/${callId}`);
      }
    };

    // Call rejected by astrologer
    const handleCallRejected = (data: any) => {
      console.log('Call rejected event received:', data);
      if (data.callId === callId) {
        toast({
          title: 'Call Rejected',
          description: 'The astrologer is unavailable.',
          variant: 'destructive',
        });
        setTimeout(() => {
          navigate(-1);
        }, 2000);
      }
    };

    // Call timeout (no answer)
    const handleCallTimeout = (data: any) => {
      console.log('Call timeout event received:', data);
      if (data.callId === callId) {
        setTimeoutReached(true);
        toast({
          title: 'No Answer',
          description: 'The astrologer did not answer your call.',
          variant: 'destructive',
        });
        setTimeout(() => {
          navigate(-1);
        }, 2000);
      }
    };

    // Register event listeners
    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_rejected', handleCallRejected);
    socket.on('call_timeout', handleCallTimeout);

    // Cleanup
    return () => {
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_timeout', handleCallTimeout);
    };
  }, [callId, navigate]);

  // Handle cancel call
  const handleCancelCall = useCallback(async () => {
    if (!callId || isCancelling) return;

    setIsCancelling(true);
    try {
      await userApi.cancelCall(callId);
      toast({
        title: 'Call Cancelled',
        description: 'Your call has been cancelled.',
      });
      navigate(-1);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to cancel call',
        variant: 'destructive',
      });
      setIsCancelling(false);
    }
  }, [callId, isCancelling, navigate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Get astrologer info from localStorage (passed from previous page)
  const astrologerInfo = localStorage.getItem('calling_astrologer');
  const astrologer = astrologerInfo ? JSON.parse(astrologerInfo) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Calling Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          {/* Astrologer Profile */}
          <div className="flex flex-col items-center mb-8">
            {/* Profile Image with Pulse Animation */}
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse" />
              {astrologer?.profileImage ? (
                <img
                  src={astrologer.profileImage}
                  alt={astrologer.name || 'Astrologer'}
                  className="relative w-32 h-32 rounded-full object-cover border-4 border-primary/50 shadow-lg"
                />
              ) : (
                <div className="relative w-32 h-32 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-4xl border-4 border-primary/50 shadow-lg">
                  {(astrologer?.name || 'A').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Astrologer Name */}
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              {astrologer?.name || 'Astrologer'}
            </h2>

            {/* Calling Status */}
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Calling...</span>
            </div>

            {/* Timeout Warning */}
            {timeoutReached && (
              <p className="text-sm text-destructive mt-2">
                No answer - redirecting...
              </p>
            )}
          </div>

          {/* Call Type Indicator */}
          <div className="flex justify-center mb-8">
            <div className="px-4 py-2 rounded-full bg-secondary border border-border">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground capitalize">
                  {astrologer?.callType || 'Video'} Call
                </span>
              </div>
            </div>
          </div>

          {/* Cancel Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              variant="destructive"
              className="rounded-full w-16 h-16 p-0"
              onClick={handleCancelCall}
              disabled={isCancelling || timeoutReached}
            >
              {isCancelling ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <PhoneOff className="w-6 h-6" />
              )}
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {isCancelling ? 'Cancelling...' : 'Tap to cancel'}
          </p>
        </div>

        {/* Helper Text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Waiting for astrologer to accept your call...
        </p>
      </div>
    </div>
  );
}

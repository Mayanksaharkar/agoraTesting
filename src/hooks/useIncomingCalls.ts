import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '@/services/socket';
import { astrologerApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface IncomingCall {
  callId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  callType: 'audio' | 'video';
  timestamp: string;
}

export function useIncomingCalls() {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Listen for incoming call events
    const handleIncomingCall = (data: any) => {
      console.log('[IncomingCall] Received:', data);
      setIncomingCall({
        callId: data.callId,
        userId: data.user?._id || data.userId,
        userName: data.user?.fullName || data.userName || 'Unknown User',
        userPhoto: data.user?.profileImage || data.userPhoto,
        callType: data.callType || 'video',
        timestamp: new Date().toISOString(),
      });

      // Play notification sound (optional)
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {
          // Ignore if audio fails
        });
      } catch {
        // Ignore audio errors
      }
    };

    // Listen for call timeout
    const handleCallTimeout = (data: any) => {
      console.log('[IncomingCall] Timeout:', data);
      if (incomingCall?.callId === data.callId) {
        setIncomingCall(null);
        toast({
          title: 'Call Missed',
          description: 'The incoming call timed out',
          variant: 'destructive',
        });
      }
    };

    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_timeout', handleCallTimeout);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_timeout', handleCallTimeout);
    };
  }, [incomingCall, toast]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall || isProcessing) return;

    setIsProcessing(true);
    try {
      const response = await astrologerApi.acceptCall(incomingCall.callId);
      console.log('[IncomingCall] Accepted:', response);
      
      toast({
        title: 'Call Accepted',
        description: 'Connecting to the call...',
      });

      // Clear the incoming call
      setIncomingCall(null);

      // Return the call data for navigation
      return response;
    } catch (error: any) {
      console.error('[IncomingCall] Accept failed:', error);
      toast({
        title: 'Failed to Accept Call',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
      setIncomingCall(null);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [incomingCall, isProcessing, toast]);

  const rejectCall = useCallback(async () => {
    if (!incomingCall || isProcessing) return;

    setIsProcessing(true);
    try {
      await astrologerApi.rejectCall(incomingCall.callId);
      console.log('[IncomingCall] Rejected:', incomingCall.callId);
      
      toast({
        title: 'Call Rejected',
        description: 'The call has been declined',
      });

      // Clear the incoming call
      setIncomingCall(null);
    } catch (error: any) {
      console.error('[IncomingCall] Reject failed:', error);
      toast({
        title: 'Failed to Reject Call',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
      setIncomingCall(null);
    } finally {
      setIsProcessing(false);
    }
  }, [incomingCall, isProcessing, toast]);

  return {
    incomingCall,
    isProcessing,
    acceptCall,
    rejectCall,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '@/services/socket';
import { astrologerApi } from '@/services/api';

type AvailabilityStatus = 'online' | 'offline' | 'busy';

export function useAvailability() {
  const [status, setStatus] = useState<AvailabilityStatus>('offline');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial availability status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await astrologerApi.getActiveCall();
        // If there's an active call, set status to busy
        if (response.call) {
          setStatus('busy');
        } else {
          // Otherwise, assume online (can be enhanced to fetch from profile)
          setStatus('online');
        }
      } catch (error) {
        console.error('[Availability] Failed to fetch status:', error);
        setStatus('offline');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, []);

  // Listen for socket events that affect availability
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // When a call is accepted, set status to busy
    const handleCallAccepted = () => {
      setStatus('busy');
    };

    // When a call ends, set status back to online
    const handleCallEnded = () => {
      setStatus('online');
    };

    socket.on('call_accepted', handleCallAccepted);
    socket.on('live_started', handleCallAccepted); // For live sessions
    socket.on('call_ended', handleCallEnded);
    socket.on('live_ended', handleCallEnded); // For live sessions

    return () => {
      socket.off('call_accepted', handleCallAccepted);
      socket.off('live_started', handleCallAccepted);
      socket.off('call_ended', handleCallEnded);
      socket.off('live_ended', handleCallEnded);
    };
  }, []);

  const updateStatus = useCallback((newStatus: AvailabilityStatus) => {
    setStatus(newStatus);
  }, []);

  return {
    status,
    isLoading,
    updateStatus,
  };
}

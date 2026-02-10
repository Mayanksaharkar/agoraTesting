import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PhoneOff, 
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useOneToOneCall } from '@/hooks/useOneToOneCall';
import { getSocket } from '@/services/socket';
import { userApi, astrologerApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import CallControls from '@/components/CallControls';
import CallTimerBilling from '@/components/CallTimerBilling';
import NetworkQualityIndicator from '@/components/NetworkQualityIndicator';
import ReconnectionOverlay from '@/components/ReconnectionOverlay';

interface CallSession {
  _id: string;
  userId: string;
  astrologerId: string;
  callType: 'audio' | 'video';
  billingType: 'per_minute' | 'package';
  status: string;
  ratePerMinute?: number;
  package?: {
    duration: number;
    price: number;
  };
  agora: {
    channelName: string;
    appId: string;
    token?: string;  // Token for the current user (sent via Socket.io)
    uid?: number;    // UID for the current user (sent via Socket.io)
    userToken?: string;      // Stored in DB
    astrologerToken?: string; // Stored in DB
    userUid?: number;         // Stored in DB
    astrologerUid?: number;   // Stored in DB
  };
  connectedAt?: string;
  astrologer?: {
    personalDetails: {
      name: string;
      pseudonym: string;
      profileImage: string;
    };
  };
  user?: {
    fullName: string;
    profileImage: string;
  };
}

export default function InCallUI() {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const socket = getSocket();

  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentCharges, setCurrentCharges] = useState(0);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [freeMinutesRemaining, setFreeMinutesRemaining] = useState<number | null>(null);
  const [showLowBalanceWarning, setShowLowBalanceWarning] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectCountdown, setReconnectCountdown] = useState(60);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isJoined,
    isConnecting,
    isAudioOn,
    isVideoOn,
    isAudioOnly,
    remoteUser,
    connectionState,
    networkQuality,
    joinCall,
    toggleAudio,
    toggleVideo,
    switchToAudioOnly,
    switchCamera,
    leave,
  } = useOneToOneCall();

  // Fetch call session details
  useEffect(() => {
    const fetchCallSession = async () => {
      if (!callId) return;

      try {
        setLoading(true);
        const response = role === 'user' 
          ? await userApi.getCallDetails(callId)
          : await astrologerApi.getCallDetails(callId);
        
        // Backend returns different structures:
        // User: { data: { call, billingBreakdown } }
        // Astrologer: { data: { call, earnings } } or similar
        const session = response.data?.call || response.data?.session || response.session;
        
        if (!session) {
          throw new Error('Call session data not found in response');
        }
        
        setCallSession(session);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching call session:', err);
        setError(err.message || 'Failed to load call session');
        setLoading(false);
        toast({
          title: 'Error',
          description: 'Failed to load call session',
          variant: 'destructive',
        });
      }
    };

    fetchCallSession();
  }, [callId, role]);

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      if (!callSession) return;
      
      try {
        const constraints = callSession.callType === 'audio' 
          ? { audio: true }
          : { audio: true, video: true };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Stop the tracks immediately - we just needed to check permissions
        stream.getTracks().forEach(track => track.stop());
        
        setPermissionGranted(true);
        setCheckingPermissions(false);
      } catch (err) {
        console.error('Permission check failed:', err);
        setCheckingPermissions(false);
        // Don't set permissionGranted to true - user will need to grant manually
      }
    };

    checkPermissions();
  }, [callSession]);

  // Join Agora call when session is loaded and permissions granted
  useEffect(() => {
    if (!callSession || isJoined || !permissionGranted) return;

    const isAudioCall = callSession.callType === 'audio';
    if (!isAudioCall && !localVideoRef.current) return;

    const initializeCall = async () => {
      try {
        // Get Agora credentials from call session or localStorage
        let agoraConfig = callSession.agora;
        
        // If agora config exists but has userToken/astrologerToken instead of token
        // (from API response), extract the correct one based on role
        if (agoraConfig && !agoraConfig.token && (agoraConfig.userToken || agoraConfig.astrologerToken)) {
          console.log('Converting DB format to Socket.io format');
          agoraConfig = {
            appId: agoraConfig.appId,
            channelName: agoraConfig.channelName,
            token: role === 'user' ? agoraConfig.userToken : agoraConfig.astrologerToken,
            uid: role === 'user' ? agoraConfig.userUid : agoraConfig.astrologerUid
          };
        }
        
        if (!agoraConfig || !agoraConfig.appId) {
          // Try to get from localStorage (stored when call was accepted)
          const storedAgora = localStorage.getItem(`agora_${callId}`);
          if (storedAgora) {
            console.log('Retrieved Agora credentials from localStorage');
            agoraConfig = JSON.parse(storedAgora);
          }
        }

        if (!agoraConfig || !agoraConfig.appId) {
          console.error('No Agora config found. callSession.agora:', callSession.agora);
          console.error('localStorage agora:', localStorage.getItem(`agora_${callId}`));
          throw new Error('No Agora credentials available. Please try reconnecting.');
        }

        // Backend sends token and uid directly (not userToken/astrologerToken)
        const token = agoraConfig.token;
        const uid = agoraConfig.uid;

        console.log('Agora config:', { 
          hasAppId: !!agoraConfig.appId, 
          hasToken: !!token, 
          hasUid: !!uid,
          channelName: agoraConfig.channelName 
        });

        if (!token) {
          console.error('No token in agoraConfig:', agoraConfig);
          throw new Error('No Agora token available');
        }

        const videoConfig = {
          appId: agoraConfig.appId,
          channelName: agoraConfig.channelName,
          token,
          uid,
        };

        console.log('Joining Agora with config:', { ...videoConfig, token: '***' });

        const audioOnly = callSession.callType === 'audio';
        await joinCall(videoConfig, 'local-video', audioOnly);

        // Notify server that we've connected (both user and astrologer)
        console.log('[InCallUI] Confirming connection to server...');
        if (role === 'user') {
          await userApi.confirmConnection(callId!);
        } else {
          await astrologerApi.confirmConnection(callId!);
        }
        console.log('[InCallUI] Connection confirmed successfully');

        // Clean up localStorage after successful join
        localStorage.removeItem(`agora_${callId}`);

        toast({
          title: 'Connected',
          description: 'You are now connected to the call',
        });
      } catch (err: any) {
        console.error('Error joining call:', err);
        
        // Show user-friendly error message
        const errorMessage = err.message?.includes('permission') || err.message?.includes('Permission')
          ? err.message
          : 'Failed to join call. Please check your camera/microphone permissions and try again.';
        
        toast({
          title: 'Connection Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        
        // If permission denied, navigate back after a delay
        if (err.message?.includes('permission') || err.message?.includes('Permission')) {
          setTimeout(() => {
            navigate(role === 'user' ? '/user/dashboard' : '/astrologer/dashboard');
          }, 3000);
        }
      }
    };

    initializeCall();
  }, [callSession, isJoined, joinCall, role, callId, permissionGranted]);

  // Render remote video when remote user joins
  useEffect(() => {
    console.log('[InCallUI] Remote user state changed:', { 
      hasRemoteUser: !!remoteUser, 
      hasVideoTrack: !!remoteUser?.videoTrack,
      remoteUserId: remoteUser?.uid 
    });
    
    if (remoteUser && remoteUser.videoTrack && remoteVideoRef.current) {
      console.log('[InCallUI] Playing remote video track');
      remoteUser.videoTrack.play('remote-video');
    }
  }, [remoteUser]);

  // Timer for elapsed time and billing
  useEffect(() => {
    if (!isJoined || !callSession) return;

    timerIntervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);

      // Calculate charges for per-minute billing
      if (callSession.billingType === 'per_minute' && callSession.ratePerMinute) {
        const minutes = Math.ceil((elapsedTime + 1) / 60);
        setCurrentCharges(minutes * callSession.ratePerMinute);
      }

      // Calculate remaining time for package billing
      if (callSession.billingType === 'package' && callSession.package) {
        const remaining = callSession.package.duration * 60 - (elapsedTime + 1);
        setRemainingTime(Math.max(0, remaining));
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isJoined, callSession, elapsedTime]);

  // Monitor Agora connection state for auto-reconnection
  useEffect(() => {
    if (connectionState === 'DISCONNECTED' && isJoined) {
      // Connection lost, attempt to reconnect
      setIsReconnecting(true);
      
      toast({
        title: 'Connection Lost',
        description: 'Attempting to reconnect...',
        variant: 'destructive',
      });
    } else if (connectionState === 'CONNECTED' && isReconnecting) {
      // Reconnected successfully
      setIsReconnecting(false);
      setReconnectCountdown(60);
      
      if (reconnectTimerRef.current) {
        clearInterval(reconnectTimerRef.current);
      }
      
      toast({
        title: 'Reconnected',
        description: 'Connection restored successfully',
      });
    }
  }, [connectionState, isJoined, isReconnecting]);

  // Cleanup reconnect timer on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        clearInterval(reconnectTimerRef.current);
      }
    };
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !callId) return;

    // Low balance warning
    socket.on('low_balance_warning', (data: any) => {
      if (data.callId === callId) {
        setShowLowBalanceWarning(true);
        toast({
          title: 'Low Balance',
          description: `Your balance is running low. Remaining: ₹${data.remainingBalance}`,
          variant: 'destructive',
        });
      }
    });

    // Call ended by other party
    socket.on('call_ended', (data: any) => {
      if (data.callId === callId) {
        handleCallEnd(data);
      }
    });

    // Participant left (disconnection)
    socket.on('participant_left', (data: any) => {
      if (data.callId === callId) {
        handleParticipantLeft(data);
      }
    });

    // Participant rejoined
    socket.on('participant_joined', (data: any) => {
      if (data.callId === callId && isReconnecting) {
        setIsReconnecting(false);
        setReconnectCountdown(60);
        if (reconnectTimerRef.current) {
          clearInterval(reconnectTimerRef.current);
        }
        toast({
          title: 'Reconnected',
          description: 'The other participant has reconnected',
        });
      }
    });

    // Network quality warning
    socket.on('network_quality_warning', (data: any) => {
      if (data.callId === callId) {
        toast({
          title: 'Poor Connection',
          description: 'Your network quality is poor. Consider switching to audio-only mode.',
          variant: 'destructive',
        });
      }
    });

    return () => {
      socket.off('low_balance_warning');
      socket.off('call_ended');
      socket.off('participant_left');
      socket.off('participant_joined');
      socket.off('network_quality_warning');
    };
  }, [socket, callId, isReconnecting]);

  const handleParticipantLeft = (data: any) => {
    setIsReconnecting(true);
    setReconnectCountdown(60);

    // Start 60-second countdown
    reconnectTimerRef.current = setInterval(() => {
      setReconnectCountdown((prev) => {
        if (prev <= 1) {
          // Time's up, end call
          if (reconnectTimerRef.current) {
            clearInterval(reconnectTimerRef.current);
          }
          handleEndCall();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    toast({
      title: 'Participant Disconnected',
      description: 'Waiting for reconnection...',
      variant: 'destructive',
    });
  };

  const handleCallEnd = async (data: any) => {
    await leave();
    
    const formatTime = (seconds: number): string => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    toast({
      title: 'Call Ended',
      description: `Duration: ${formatTime(data.duration || elapsedTime)}`,
    });

    // Navigate to call summary or dashboard
    navigate(role === 'user' ? '/user/dashboard' : '/astrologer/dashboard');
  };

  const handleEndCall = async () => {
    try {
      await leave();
      
      if (role === 'user') {
        await userApi.endCall(callId!);
      } else {
        await astrologerApi.endCall(callId!);
      }

      toast({
        title: 'Call Ended',
        description: 'The call has been ended successfully',
      });

      navigate(role === 'user' ? '/user/dashboard' : '/astrologer/dashboard');
    } catch (err: any) {
      console.error('Error ending call:', err);
      toast({
        title: 'Error',
        description: 'Failed to end call properly',
        variant: 'destructive',
      });
    }
  };

  const handleToggleAudio = async () => {
    try {
      await toggleAudio();
      socket?.emit('toggle_audio', { callId, enabled: !isAudioOn });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to toggle audio',
        variant: 'destructive',
      });
    }
  };

  const handleToggleVideo = async () => {
    try {
      await toggleVideo();
      socket?.emit('toggle_video', { callId, enabled: !isVideoOn });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to toggle video',
        variant: 'destructive',
      });
    }
  };

  const handleSwitchToAudioOnly = async () => {
    try {
      await switchToAudioOnly();
      toast({
        title: 'Switched to Audio Only',
        description: 'Video has been disabled to improve connection',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to switch to audio-only mode',
        variant: 'destructive',
      });
    }
  };

  if (loading || checkingPermissions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-gray-400">
          {checkingPermissions ? 'Checking camera and microphone permissions...' : 'Loading call...'}
        </p>
      </div>
    );
  }

  if (!permissionGranted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Permission Required</h2>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          This call requires access to your {callSession?.callType === 'audio' ? 'microphone' : 'camera and microphone'}. 
          Please allow access when prompted by your browser.
        </p>
        <Button 
          onClick={async () => {
            setCheckingPermissions(true);
            try {
              const constraints = callSession?.callType === 'audio' 
                ? { audio: true }
                : { audio: true, video: true };
              
              const stream = await navigator.mediaDevices.getUserMedia(constraints);
              stream.getTracks().forEach(track => track.stop());
              
              setPermissionGranted(true);
              setCheckingPermissions(false);
              
              toast({
                title: 'Permissions Granted',
                description: 'Connecting to call...',
              });
            } catch (err: any) {
              setCheckingPermissions(false);
              toast({
                title: 'Permission Denied',
                description: 'Please allow camera/microphone access in your browser settings.',
                variant: 'destructive',
              });
            }
          }}
          disabled={checkingPermissions}
        >
          {checkingPermissions ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Checking...
            </>
          ) : (
            'Grant Permissions'
          )}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => navigate(role === 'user' ? '/user/dashboard' : '/astrologer/dashboard')}
          className="mt-4"
        >
          Cancel Call
        </Button>
      </div>
    );
  }

  if (error || !callSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Call Not Found</h2>
        <p className="text-gray-400 mb-4">{error || 'Unable to load call session'}</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const otherParty = role === 'user' ? callSession.astrologer : callSession.user;
  const displayName = role === 'user' 
    ? callSession.astrologer?.personalDetails?.pseudonym || callSession.astrologer?.personalDetails?.name
    : callSession.user?.fullName;
  const profileImage = role === 'user'
    ? callSession.astrologer?.personalDetails?.profileImage
    : callSession.user?.profileImage;
  const isAudioCall = callSession.callType === 'audio';

  // Audio Call UI
  if (isAudioCall) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              {displayName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold text-sm text-white/80">Voice Call</h2>
              <CallTimerBilling
                elapsedTime={elapsedTime}
                billingType={callSession.billingType}
                currentCharges={currentCharges}
                remainingTime={remainingTime}
                freeMinutesRemaining={freeMinutesRemaining}
                showLowBalanceWarning={showLowBalanceWarning}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <NetworkQualityIndicator
              uplinkQuality={networkQuality.uplinkNetworkQuality}
              downlinkQuality={networkQuality.downlinkNetworkQuality}
              onSwitchToAudioOnly={handleSwitchToAudioOnly}
              showSwitchButton={false}
            />
          </div>
        </div>

        {/* Main Content - Profile Display */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Profile Image with Pulse Animation */}
          <div className="relative mb-8">
            {/* Animated rings */}
            {remoteUser && (
              <>
                <div className="absolute inset-0 rounded-full bg-white/10 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-0 rounded-full bg-white/5 animate-pulse" style={{ animationDuration: '3s' }} />
              </>
            )}
            
            {/* Profile Picture */}
            {profileImage ? (
              <img
                src={profileImage}
                alt={displayName || 'User'}
                className="relative w-48 h-48 rounded-full object-cover border-4 border-white/30 shadow-2xl"
              />
            ) : (
              <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-6xl border-4 border-white/30 shadow-2xl">
                {displayName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name */}
          <h1 className="text-4xl font-bold mb-2 text-center">{displayName}</h1>

          {/* Status */}
          <div className="flex items-center space-x-2 mb-8">
            {!remoteUser ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-white/60" />
                <p className="text-white/60 text-lg">Connecting...</p>
              </>
            ) : (
              <>
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                <p className="text-white/80 text-lg">Connected</p>
              </>
            )}
          </div>

          {/* Call Info Cards */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            {/* Duration Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/20">
              <p className="text-white/60 text-sm mb-1">Duration</p>
              <p className="text-2xl font-bold">
                {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
              </p>
            </div>

            {/* Charges/Package Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/20">
              <p className="text-white/60 text-sm mb-1">
                {callSession.billingType === 'per_minute' ? 'Charges' : 'Remaining'}
              </p>
              <p className="text-2xl font-bold">
                {callSession.billingType === 'per_minute' 
                  ? `₹${currentCharges}`
                  : remainingTime !== null 
                    ? `${Math.floor(remainingTime / 60)}:${(remainingTime % 60).toString().padStart(2, '0')}`
                    : '--:--'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Reconnecting Overlay */}
        <ReconnectionOverlay
          isReconnecting={isReconnecting}
          participantName={displayName || 'participant'}
          countdown={reconnectCountdown}
        />

        {/* Low Balance Warning */}
        {showLowBalanceWarning && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg animate-bounce">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">Low Balance! Call will end soon.</span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="p-8 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-center space-x-6">
            {/* Mute Button */}
            <button
              onClick={handleToggleAudio}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all transform hover:scale-110 ${
                isAudioOn 
                  ? 'bg-white/20 hover:bg-white/30' 
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {isAudioOn ? (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all transform hover:scale-110 shadow-2xl"
            >
              <PhoneOff className="w-8 h-8" />
            </button>

            {/* Speaker Button (placeholder) */}
            <button
              className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all transform hover:scale-110"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <p className="text-center text-white/40 text-sm mt-4">
            {isAudioOn ? 'Microphone On' : 'Microphone Muted'}
          </p>
        </div>
      </div>
    );
  }

  // Video Call UI (existing code)
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
            {displayName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold">{displayName}</h2>
            <CallTimerBilling
              elapsedTime={elapsedTime}
              billingType={callSession.billingType}
              currentCharges={currentCharges}
              remainingTime={remainingTime}
              freeMinutesRemaining={freeMinutesRemaining}
              showLowBalanceWarning={showLowBalanceWarning}
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Network Quality */}
          <NetworkQualityIndicator
            uplinkQuality={networkQuality.uplinkNetworkQuality}
            downlinkQuality={networkQuality.downlinkNetworkQuality}
            onSwitchToAudioOnly={handleSwitchToAudioOnly}
            showSwitchButton={false}
          />
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-black">
        {/* Remote Video (Full Screen) */}
        <div 
          id="remote-video" 
          ref={remoteVideoRef}
          className="absolute inset-0 w-full h-full"
        >
          {!remoteUser && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mx-auto mb-4" />
                <p className="text-gray-400">Waiting for {displayName} to join...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        {!isAudioOnly && (
          <div 
            id="local-video" 
            ref={localVideoRef}
            className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-gray-700"
          />
        )}

        {/* Reconnecting Overlay */}
        <ReconnectionOverlay
          isReconnecting={isReconnecting}
          participantName={displayName || 'participant'}
          countdown={reconnectCountdown}
        />

        {/* Low Balance Warning */}
        {showLowBalanceWarning && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">Low Balance! Call will end soon.</span>
            </div>
          </div>
        )}

        {/* Poor Network Warning */}
        <NetworkQualityIndicator
          uplinkQuality={networkQuality.uplinkNetworkQuality}
          downlinkQuality={networkQuality.downlinkNetworkQuality}
          onSwitchToAudioOnly={handleSwitchToAudioOnly}
          showSwitchButton={true}
        />
      </div>

      {/* Controls */}
      <CallControls
        isAudioOn={isAudioOn}
        isVideoOn={isVideoOn}
        callType={callSession.callType}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        onSwitchCamera={switchCamera}
        onEndCall={handleEndCall}
        showSwitchCamera={true}
      />
    </div>
  );
}

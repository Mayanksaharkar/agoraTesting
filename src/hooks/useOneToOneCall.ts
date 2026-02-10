import { useState, useCallback, useRef, useEffect } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
  IAgoraRTCRemoteUser,
  NetworkQuality,
} from 'agora-rtc-sdk-ng';

export interface CallVideoConfig {
  appId: string;
  channelName: string;
  token: string;
  uid: number;
}

export interface NetworkQualityStats {
  uplinkNetworkQuality: number;
  downlinkNetworkQuality: number;
}

export function useOneToOneCall() {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null);
  
  const [isJoined, setIsJoined] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [remoteUser, setRemoteUser] = useState<IAgoraRTCRemoteUser | null>(null);
  const [connectionState, setConnectionState] = useState<string>('DISCONNECTED');
  const [networkQuality, setNetworkQuality] = useState<NetworkQualityStats>({
    uplinkNetworkQuality: 0,
    downlinkNetworkQuality: 0,
  });
  const [isAudioOnly, setIsAudioOnly] = useState(false);

  const initClient = useCallback(() => {
    if (!clientRef.current) {
      // Create client in RTC mode for one-to-one calls
      clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      // Handle remote user published
      clientRef.current.on('user-published', async (user, mediaType) => {
        if (!clientRef.current) return;
        
        try {
          console.log(`Remote user published ${mediaType}:`, user.uid);
          await clientRef.current.subscribe(user, mediaType);
          
          // Set remote user for both audio and video
          setRemoteUser(user);
          
          if (mediaType === 'audio') {
            console.log('Playing remote audio');
            user.audioTrack?.play();
          }
          
          if (mediaType === 'video') {
            console.log('Remote video track available');
          }
        } catch (error) {
          console.error('Error subscribing to remote user:', error);
        }
      });

      // Handle remote user unpublished
      clientRef.current.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          setRemoteUser((prev) => (prev?.uid === user.uid ? null : prev));
        }
      });

      // Handle remote user left
      clientRef.current.on('user-left', (user) => {
        setRemoteUser((prev) => (prev?.uid === user.uid ? null : prev));
      });

      // Handle connection state changes
      clientRef.current.on('connection-state-change', (curState, prevState) => {
        console.log(`Connection state changed from ${prevState} to ${curState}`);
        setConnectionState(curState);
      });

      // Handle network quality
      clientRef.current.on('network-quality', (stats) => {
        setNetworkQuality({
          uplinkNetworkQuality: stats.uplinkNetworkQuality,
          downlinkNetworkQuality: stats.downlinkNetworkQuality,
        });
      });
    }
    return clientRef.current;
  }, []);

  const joinCall = useCallback(async (
    videoConfig: CallVideoConfig,
    localVideoEl: string,
    audioOnly: boolean = false
  ) => {
    try {
      setIsConnecting(true);
      setIsAudioOnly(audioOnly);
      
      // Request permissions first
      try {
        const constraints = audioOnly 
          ? { audio: true }
          : { audio: true, video: true };
        
        await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Permissions granted');
      } catch (permError: any) {
        console.error('Permission denied:', permError);
        setIsConnecting(false);
        throw new Error('Camera/Microphone permission denied. Please allow access and try again.');
      }
      
      const client = initClient();
      
      console.log('Joining Agora channel:', {
        appId: videoConfig.appId,
        channelName: videoConfig.channelName,
        uid: videoConfig.uid,
        audioOnly
      });
      
      // Join channel
      await client.join(
        videoConfig.appId,
        videoConfig.channelName,
        videoConfig.token,
        videoConfig.uid
      );
      
      console.log('Successfully joined channel');

      // Create and publish tracks
      if (audioOnly) {
        // Audio-only mode
        console.log('Creating audio track...');
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        audioTrackRef.current = audioTrack;
        console.log('Publishing audio track...');
        await client.publish([audioTrack]);
        console.log('Audio track published successfully');
        setIsVideoOn(false);
      } else {
        // Video + audio mode
        console.log('Creating audio and video tracks...');
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        audioTrackRef.current = audioTrack;
        videoTrackRef.current = videoTrack;
        
        console.log('Publishing audio and video tracks...');
        await client.publish([audioTrack, videoTrack]);
        videoTrack.play(localVideoEl);
        console.log('Tracks published successfully');
        setIsVideoOn(true);
      }

      setIsJoined(true);
      setIsAudioOn(true);
      setIsConnecting(false);
    } catch (error: any) {
      console.error('Error joining call:', error);
      setIsConnecting(false);
      
      // Provide user-friendly error messages
      if (error.message?.includes('permission')) {
        throw error;
      } else if (error.code === 'PERMISSION_DENIED' || error.name === 'NotAllowedError') {
        throw new Error('Camera/Microphone permission denied. Please allow access in your browser settings and try again.');
      } else {
        throw new Error(error.message || 'Failed to join call. Please check your connection and try again.');
      }
    }
  }, [initClient]);

  const toggleAudio = useCallback(async () => {
    if (audioTrackRef.current) {
      await audioTrackRef.current.setEnabled(!isAudioOn);
      setIsAudioOn(!isAudioOn);
    }
  }, [isAudioOn]);

  const toggleVideo = useCallback(async () => {
    if (!clientRef.current) return;

    try {
      if (isVideoOn && videoTrackRef.current) {
        // Turn off video
        await videoTrackRef.current.setEnabled(false);
        setIsVideoOn(false);
      } else if (!isVideoOn && videoTrackRef.current) {
        // Turn on video
        await videoTrackRef.current.setEnabled(true);
        setIsVideoOn(true);
      } else if (!isVideoOn && !videoTrackRef.current && !isAudioOnly) {
        // Create video track if it doesn't exist (switching from audio-only)
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        videoTrackRef.current = videoTrack;
        await clientRef.current.publish([videoTrack]);
        setIsVideoOn(true);
      }
    } catch (error) {
      console.error('Error toggling video:', error);
      throw error;
    }
  }, [isVideoOn, isAudioOnly]);

  const switchToAudioOnly = useCallback(async () => {
    if (videoTrackRef.current && clientRef.current) {
      try {
        await clientRef.current.unpublish([videoTrackRef.current]);
        videoTrackRef.current.close();
        videoTrackRef.current = null;
        setIsVideoOn(false);
        setIsAudioOnly(true);
      } catch (error) {
        console.error('Error switching to audio-only:', error);
        throw error;
      }
    }
  }, []);

  const switchCamera = useCallback(async () => {
    if (videoTrackRef.current) {
      try {
        await videoTrackRef.current.setDevice(
          await AgoraRTC.getCameras().then(devices => 
            devices.find(d => d.deviceId !== videoTrackRef.current?.getTrackLabel())?.deviceId || devices[0].deviceId
          )
        );
      } catch (error) {
        console.error('Error switching camera:', error);
        throw error;
      }
    }
  }, []);

  const leave = useCallback(async () => {
    try {
      // Close tracks
      audioTrackRef.current?.close();
      videoTrackRef.current?.close();
      audioTrackRef.current = null;
      videoTrackRef.current = null;

      // Leave channel
      if (clientRef.current) {
        await clientRef.current.leave();
      }

      // Reset state
      setRemoteUser(null);
      setIsJoined(false);
      setIsConnecting(false);
      setIsAudioOn(true);
      setIsVideoOn(true);
      setIsAudioOnly(false);
      setConnectionState('DISCONNECTED');
    } catch (error) {
      console.error('Error leaving call:', error);
      throw error;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioTrackRef.current?.close();
      videoTrackRef.current?.close();
      clientRef.current?.leave();
    };
  }, []);

  return {
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
  };
}

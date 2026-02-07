import { useState, useCallback, useRef, useEffect } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
  IAgoraRTCRemoteUser,
  ClientRole,
} from 'agora-rtc-sdk-ng';

export interface VideoConfig {
  appId: string;
  channelName: string;
  token: string;
  uid: number;
  role: 'host' | 'audience';
}

export function useAgora() {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [connectionState, setConnectionState] = useState<string>('DISCONNECTED');

  const initClient = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });

      clientRef.current.on('user-published', async (user, mediaType) => {
        if (!clientRef.current) return;
        await clientRef.current.subscribe(user, mediaType);
        if (mediaType === 'video') {
          setRemoteUsers((prev) => [...prev.filter((u) => u.uid !== user.uid), user]);
        }
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      });

      clientRef.current.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        }
      });

      clientRef.current.on('user-left', (user) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });

      clientRef.current.on('connection-state-change', (curState) => {
        setConnectionState(curState);
      });
    }
    return clientRef.current;
  }, []);

  const joinAsHost = useCallback(async (videoConfig: VideoConfig, localVideoEl: string) => {
    const client = initClient();
    await client.setClientRole('host');
    await client.join(videoConfig.appId, videoConfig.channelName, videoConfig.token, videoConfig.uid);

    const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
    audioTrackRef.current = audioTrack;
    videoTrackRef.current = videoTrack;

    await client.publish([audioTrack, videoTrack]);
    videoTrack.play(localVideoEl);

    setIsJoined(true);
    setIsAudioOn(true);
    setIsVideoOn(true);
  }, [initClient]);

  const joinAsViewer = useCallback(async (videoConfig: VideoConfig) => {
    const client = initClient();
    await client.setClientRole('audience');
    await client.join(videoConfig.appId, videoConfig.channelName, videoConfig.token, videoConfig.uid || 0);
    setIsJoined(true);
  }, [initClient]);

  const toggleAudio = useCallback(async () => {
    if (audioTrackRef.current) {
      await audioTrackRef.current.setEnabled(!isAudioOn);
      setIsAudioOn(!isAudioOn);
    }
  }, [isAudioOn]);

  const toggleVideo = useCallback(async () => {
    if (videoTrackRef.current) {
      await videoTrackRef.current.setEnabled(!isVideoOn);
      setIsVideoOn(!isVideoOn);
    }
  }, [isVideoOn]);

  const leave = useCallback(async () => {
    audioTrackRef.current?.close();
    videoTrackRef.current?.close();
    audioTrackRef.current = null;
    videoTrackRef.current = null;
    if (clientRef.current) {
      await clientRef.current.leave();
    }
    setRemoteUsers([]);
    setIsJoined(false);
    setIsAudioOn(true);
    setIsVideoOn(true);
  }, []);

  useEffect(() => {
    return () => {
      audioTrackRef.current?.close();
      videoTrackRef.current?.close();
      clientRef.current?.leave();
    };
  }, []);

  return {
    isJoined,
    isAudioOn,
    isVideoOn,
    remoteUsers,
    connectionState,
    joinAsHost,
    joinAsViewer,
    toggleAudio,
    toggleVideo,
    leave,
  };
}

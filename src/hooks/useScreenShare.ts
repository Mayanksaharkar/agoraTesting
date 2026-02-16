import { useCallback, useState, useRef } from 'react';
import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type ILocalVideoTrack
} from 'agora-rtc-sdk-ng';

interface LocalTracks {
  videoTrack: ICameraVideoTrack | null;
  audioTrack: IMicrophoneAudioTrack | null;
}

interface ScreenShareConfig {
  appId: string;
  channelName: string;
  token: string | null;
  uid: number;
}

export const useScreenShare = (mainClient: IAgoraRTCClient | null, localTracks: LocalTracks) => {
  const [isSharing, setIsSharing] = useState(false);
  const [screenTrack, setScreenTrack] = useState<ILocalVideoTrack | null>(null);
  const screenClientRef = useRef<IAgoraRTCClient | null>(null);

  const startScreenShare = useCallback(async (config: ScreenShareConfig) => {
    if (!mainClient || isSharing) return false;

    try {
      // Create a separate client for screen sharing
      const screenClient = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      screenClientRef.current = screenClient;

      // Join with a modified UID to avoid conflict - using a small offset for restricted ranges
      const screenUid = Number(config.uid) + 1000;
      await screenClient.setClientRole('host');
      await screenClient.join(config.appId, config.channelName, config.token, screenUid);

      const result = await AgoraRTC.createScreenVideoTrack(
        { encoderConfig: '1080p_1' },
        'auto'
      );

      const screenVideoTrack = Array.isArray(result) ? result[0] : result;
      
      await screenClient.publish(screenVideoTrack);
      setScreenTrack(screenVideoTrack);
      setIsSharing(true);

      // Listen for screen sharing stopped by browser
      screenVideoTrack.on('track-ended', () => {
        stopScreenShare();
      });

      return true;
    } catch (error) {
      console.error('Failed to start screen share:', error);
      if (screenClientRef.current) {
        await screenClientRef.current.leave();
        screenClientRef.current = null;
      }
      return false;
    }
  }, [mainClient, isSharing]);

  const stopScreenShare = useCallback(async () => {
    try {
      if (screenTrack) {
        screenTrack.close();
        setScreenTrack(null);
      }
      
      if (screenClientRef.current) {
        await screenClientRef.current.leave();
        screenClientRef.current = null;
      }
      
      setIsSharing(false);
      return true;
    } catch (error) {
      console.error('Failed to stop screen share:', error);
      return false;
    }
  }, [screenTrack]);

  return {
    isSharing,
    startScreenShare,
    stopScreenShare,
    screenTrack
  };
};

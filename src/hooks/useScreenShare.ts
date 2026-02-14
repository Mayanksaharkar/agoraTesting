import { useCallback, useState } from 'react';
import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack
} from 'agora-rtc-sdk-ng';

interface LocalTracks {
  videoTrack: ICameraVideoTrack | null;
  audioTrack: IMicrophoneAudioTrack | null;
}

export const useScreenShare = (client: IAgoraRTCClient | null, localTracks: LocalTracks) => {
  const [isSharing, setIsSharing] = useState(false);
  const [screenTrack, setScreenTrack] = useState<any>(null);

  const startScreenShare = useCallback(async () => {
    if (!client || isSharing) return false;

    try {
      const screenVideoTrack = await AgoraRTC.createScreenVideoTrack(
        { encoderConfig: '1080p_1' },
        'auto'
      );

      if (localTracks.videoTrack) {
        await client.unpublish(localTracks.videoTrack);
      }
      await client.publish(screenVideoTrack);

      setScreenTrack(screenVideoTrack);
      setIsSharing(true);
      return true;
    } catch (error) {
      console.error('Failed to start screen share:', error);
      return false;
    }
  }, [client, isSharing, localTracks]);

  const stopScreenShare = useCallback(async () => {
    if (!client || !screenTrack) return false;

    try {
      await client.unpublish(screenTrack);
      screenTrack.close();
      setScreenTrack(null);
      setIsSharing(false);

      if (localTracks.videoTrack) {
        await client.publish(localTracks.videoTrack);
      }
      return true;
    } catch (error) {
      console.error('Failed to stop screen share:', error);
      return false;
    }
  }, [client, screenTrack, localTracks]);

  return {
    isSharing,
    startScreenShare,
    stopScreenShare,
    screenTrack
  };
};

import { Mic, MicOff, Video, VideoOff, PhoneOff, SwitchCamera } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CallControlsProps {
  isAudioOn: boolean;
  isVideoOn: boolean;
  callType: 'audio' | 'video';
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onSwitchCamera?: () => void;
  onEndCall: () => void;
  showSwitchCamera?: boolean;
}

export default function CallControls({
  isAudioOn,
  isVideoOn,
  callType,
  onToggleAudio,
  onToggleVideo,
  onSwitchCamera,
  onEndCall,
  showSwitchCamera = false,
}: CallControlsProps) {
  return (
    <div className="p-6 bg-gray-800 border-t border-gray-700">
      <div className="flex items-center justify-center space-x-4">
        {/* Mute/Unmute Audio */}
        <Button
          size="lg"
          variant={isAudioOn ? 'default' : 'destructive'}
          onClick={onToggleAudio}
          className="rounded-full w-14 h-14"
          title={isAudioOn ? 'Mute' : 'Unmute'}
        >
          {isAudioOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
        </Button>

        {/* Toggle Video (only for video calls) */}
        {callType === 'video' && (
          <Button
            size="lg"
            variant={isVideoOn ? 'default' : 'destructive'}
            onClick={onToggleVideo}
            className="rounded-full w-14 h-14"
            title={isVideoOn ? 'Turn off video' : 'Turn on video'}
          >
            {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </Button>
        )}

        {/* Switch Camera (mobile only) */}
        {callType === 'video' && isVideoOn && showSwitchCamera && onSwitchCamera && (
          <Button
            size="lg"
            variant="outline"
            onClick={onSwitchCamera}
            className="rounded-full w-14 h-14 md:hidden"
            title="Switch camera"
          >
            <SwitchCamera className="h-6 w-6" />
          </Button>
        )}

        {/* End Call */}
        <Button
          size="lg"
          variant="destructive"
          onClick={onEndCall}
          className="rounded-full w-14 h-14"
          title="End call"
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>

      {/* Control Labels (for accessibility) */}
      <div className="flex items-center justify-center space-x-4 mt-2 text-xs text-gray-400">
        <span>{isAudioOn ? 'Mute' : 'Unmute'}</span>
        {callType === 'video' && <span>{isVideoOn ? 'Video Off' : 'Video On'}</span>}
        {callType === 'video' && isVideoOn && showSwitchCamera && <span className="md:hidden">Switch</span>}
        <span>End Call</span>
      </div>
    </div>
  );
}

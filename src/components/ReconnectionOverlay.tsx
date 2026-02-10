import { Loader2 } from 'lucide-react';

interface ReconnectionOverlayProps {
  isReconnecting: boolean;
  participantName: string;
  countdown: number;
}

export default function ReconnectionOverlay({
  isReconnecting,
  participantName,
  countdown,
}: ReconnectionOverlayProps) {
  if (!isReconnecting) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Reconnecting...</h3>
        <p className="text-gray-400">
          Waiting for {participantName} to reconnect
        </p>
        <div className="mt-4">
          <div className="text-3xl font-bold text-indigo-500">
            {countdown}s
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Call will end if not reconnected
          </p>
        </div>
      </div>
    </div>
  );
}

import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NetworkQualityIndicatorProps {
  uplinkQuality: number;
  downlinkQuality: number;
  onSwitchToAudioOnly?: () => void;
  showSwitchButton?: boolean;
}

export default function NetworkQualityIndicator({
  uplinkQuality,
  downlinkQuality,
  onSwitchToAudioOnly,
  showSwitchButton = true,
}: NetworkQualityIndicatorProps) {
  const quality = Math.min(uplinkQuality, downlinkQuality);
  
  const getQualityIcon = () => {
    if (quality === 0 || quality > 4) {
      return <WifiOff className="h-5 w-5 text-red-500" />;
    }
    if (quality >= 4) {
      return <Wifi className="h-5 w-5 text-yellow-500" />;
    }
    if (quality >= 3) {
      return <Wifi className="h-5 w-5 text-orange-500" />;
    }
    return <Wifi className="h-5 w-5 text-green-500" />;
  };

  const getQualityText = () => {
    if (quality === 0) return 'Unknown';
    if (quality === 1) return 'Excellent';
    if (quality === 2) return 'Good';
    if (quality === 3) return 'Fair';
    if (quality === 4) return 'Poor';
    return 'Very Poor';
  };

  const getQualityColor = () => {
    if (quality === 0 || quality > 4) return 'text-red-500';
    if (quality >= 4) return 'text-yellow-500';
    if (quality >= 3) return 'text-orange-500';
    return 'text-green-500';
  };

  const isPoorQuality = quality > 3;

  return (
    <div className="flex items-center space-x-2">
      {getQualityIcon()}
      <span className={`text-sm ${getQualityColor()}`}>
        {getQualityText()}
      </span>
      
      {/* Show warning and switch button for poor quality */}
      {isPoorQuality && showSwitchButton && onSwitchToAudioOnly && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">Poor Connection Quality</span>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onSwitchToAudioOnly}
              className="bg-white text-yellow-600 hover:bg-gray-100"
            >
              Switch to Audio Only
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

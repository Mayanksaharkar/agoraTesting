import { Clock, DollarSign, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CallTimerBillingProps {
  elapsedTime: number;
  billingType: 'per_minute' | 'package';
  currentCharges?: number;
  remainingTime?: number | null;
  freeMinutesRemaining?: number;
  showLowBalanceWarning?: boolean;
}

export default function CallTimerBilling({
  elapsedTime,
  billingType,
  currentCharges,
  remainingTime,
  freeMinutesRemaining,
  showLowBalanceWarning = false,
}: CallTimerBillingProps) {
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Elapsed Time */}
      <div className="flex items-center space-x-2 text-sm">
        <Clock className="h-4 w-4 text-gray-400" />
        <span className="font-mono">{formatTime(elapsedTime)}</span>
      </div>

      {/* Free Minutes Remaining */}
      {freeMinutesRemaining !== undefined && freeMinutesRemaining > 0 && (
        <Badge variant="secondary" className="bg-green-600 text-white">
          {freeMinutesRemaining} free min left
        </Badge>
      )}

      {/* Per-Minute Billing */}
      {billingType === 'per_minute' && currentCharges !== undefined && (
        <div className="flex items-center space-x-2 text-sm">
          <DollarSign className="h-4 w-4 text-gray-400" />
          <span className="font-semibold">₹{currentCharges.toFixed(2)}</span>
          {showLowBalanceWarning && (
            <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
          )}
        </div>
      )}

      {/* Package Billing */}
      {billingType === 'package' && remainingTime !== null && remainingTime !== undefined && (
        <Badge 
          variant={remainingTime < 60 ? 'destructive' : 'default'}
          className={remainingTime < 60 ? 'animate-pulse' : ''}
        >
          {formatTime(remainingTime)} left
        </Badge>
      )}
    </div>
  );
}

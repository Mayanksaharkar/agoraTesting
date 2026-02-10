import { useState, useEffect } from 'react';
import { Power, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { astrologerApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AvailabilityToggleProps {
  initialStatus?: 'online' | 'offline' | 'busy';
  onStatusChange?: (status: 'online' | 'offline') => void;
  className?: string;
}

export default function AvailabilityToggle({
  initialStatus = 'offline',
  onStatusChange,
  className,
}: AvailabilityToggleProps) {
  const [status, setStatus] = useState<'online' | 'offline' | 'busy'>(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const handleToggle = async (checked: boolean) => {
    const newStatus = checked ? 'online' : 'offline';
    
    // Prevent toggling if busy
    if (status === 'busy') {
      toast({
        title: 'Cannot Change Status',
        description: 'You are currently in a call. End the call first.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    try {
      await astrologerApi.updateAvailability(newStatus);
      setStatus(newStatus);
      
      toast({
        title: `Status Updated`,
        description: `You are now ${newStatus}`,
      });

      onStatusChange?.(newStatus);
    } catch (error: any) {
      console.error('[Availability] Update failed:', error);
      toast({
        title: 'Failed to Update Status',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const isOnline = status === 'online';
  const isBusy = status === 'busy';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex items-center gap-2">
        <Switch
          id="availability-toggle"
          checked={isOnline || isBusy}
          onCheckedChange={handleToggle}
          disabled={isUpdating || isBusy}
          className={cn(
            'data-[state=checked]:bg-green-500',
            isBusy && 'data-[state=checked]:bg-yellow-500'
          )}
        />
        <Label
          htmlFor="availability-toggle"
          className="cursor-pointer flex items-center gap-2"
        >
          {isUpdating ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <Power
              className={cn(
                'w-4 h-4',
                isOnline && 'text-green-500',
                isBusy && 'text-yellow-500',
                !isOnline && !isBusy && 'text-muted-foreground'
              )}
            />
          )}
          <span className="text-sm font-medium">
            {isBusy ? 'Busy' : isOnline ? 'Online' : 'Offline'}
          </span>
        </Label>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            isOnline && 'bg-green-500 animate-pulse',
            isBusy && 'bg-yellow-500 animate-pulse',
            !isOnline && !isBusy && 'bg-muted-foreground'
          )}
        />
        <span className="text-xs text-muted-foreground">
          {isBusy
            ? 'In a call'
            : isOnline
            ? 'Available for calls'
            : 'Not accepting calls'}
        </span>
      </div>
    </div>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock, DollarSign, CheckCircle } from 'lucide-react';

interface CallEndedSummaryModalProps {
  open: boolean;
  onClose: () => void;
  callData: {
    duration: number; // in seconds
    totalAmount?: number; // for user view
    astrologerEarnings?: number; // for astrologer view
    billingType: 'per_minute' | 'package';
    ratePerMinute?: number;
    freeMinutesUsed?: number;
  };
  userType: 'user' | 'astrologer';
}

export function CallEndedSummaryModal({
  open,
  onClose,
  callData,
  userType,
}: CallEndedSummaryModalProps) {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Call Ended
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Thank you message */}
          <div className="text-center py-2">
            <p className="text-muted-foreground">
              {userType === 'user'
                ? 'Thank you for your consultation!'
                : 'Thank you for providing your guidance!'}
            </p>
          </div>

          <Separator />

          {/* Call Summary */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Duration */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Call Duration</span>
                </div>
                <span className="text-sm font-semibold">
                  {formatDuration(callData.duration)}
                </span>
              </div>

              {/* Free Minutes Used (if applicable) */}
              {userType === 'user' && callData.freeMinutesUsed && callData.freeMinutesUsed > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Free Minutes Used</span>
                  <span className="text-sm font-medium text-green-600">
                    {callData.freeMinutesUsed} min
                  </span>
                </div>
              )}

              {/* Billing Type */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Billing Type</span>
                <span className="text-sm font-medium capitalize">
                  {callData.billingType === 'per_minute' ? 'Per Minute' : 'Package'}
                </span>
              </div>

              {/* Rate (for per-minute calls) */}
              {callData.billingType === 'per_minute' && callData.ratePerMinute && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rate</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(callData.ratePerMinute)}/min
                  </span>
                </div>
              )}

              <Separator />

              {/* Total Amount (for user) */}
              {userType === 'user' && callData.totalAmount !== undefined && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Total Charges</span>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(callData.totalAmount)}
                  </span>
                </div>
              )}

              {/* Astrologer Earnings */}
              {userType === 'astrologer' && callData.astrologerEarnings !== undefined && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Your Earnings</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(callData.astrologerEarnings)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Button */}
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

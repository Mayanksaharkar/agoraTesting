import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { userApi } from '@/services/api';

interface ReportCallDialogProps {
  open: boolean;
  onClose: () => void;
  callId: string;
  onReportSuccess?: () => void;
}

const REPORT_REASONS = [
  { value: 'inappropriate_behavior', label: 'Inappropriate Behavior' },
  { value: 'poor_quality', label: 'Poor Call Quality' },
  { value: 'technical_issues', label: 'Technical Issues' },
  { value: 'unprofessional', label: 'Unprofessional Conduct' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'fraud', label: 'Fraud or Scam' },
  { value: 'other', label: 'Other' },
];

export function ReportCallDialog({
  open,
  onClose,
  callId,
  onReportSuccess,
}: ReportCallDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [additionalDetails, setAdditionalDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();

  const handleReasonChange = (value: string) => {
    setSelectedReason(value);
  };

  const handleInitialSubmit = () => {
    if (!selectedReason) {
      toast({
        title: 'Reason Required',
        description: 'Please select a reason for reporting this call.',
        variant: 'destructive',
      });
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmedSubmit = async () => {
    setIsSubmitting(true);
    try {
      const reasonLabel = REPORT_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;
      const reportReason = additionalDetails.trim()
        ? `${reasonLabel}: ${additionalDetails.trim()}`
        : reasonLabel;

      await userApi.reportCall(callId, {
        reason: reportReason,
      });

      toast({
        title: 'Report Submitted',
        description: 'Your report has been submitted successfully. Our team will review it shortly.',
      });

      onReportSuccess?.();
      handleClose();
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit report. Please try again.',
        variant: 'destructive',
      });
      setShowConfirmation(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setAdditionalDetails('');
    setShowConfirmation(false);
    onClose();
  };

  if (showConfirmation) {
    return (
      <AlertDialog open={open} onOpenChange={handleClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Report
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to report this call? This action will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>End the call immediately if still active</li>
                <li>Process a full refund for you</li>
                <li>Flag this call for admin review</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmation(false)} disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedSubmit}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? 'Submitting...' : 'Confirm Report'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Report Call
          </AlertDialogTitle>
          <AlertDialogDescription>
            Please select a reason for reporting this call. Your report will be reviewed by our team.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason Selection */}
          <div className="space-y-3">
            <Label>Reason for Report *</Label>
            <RadioGroup value={selectedReason} onValueChange={handleReasonChange}>
              {REPORT_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label
                    htmlFor={reason.value}
                    className="font-normal cursor-pointer"
                  >
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Additional Details */}
          <div className="space-y-2">
            <Label htmlFor="details">Additional Details (Optional)</Label>
            <Textarea
              id="details"
              placeholder="Provide any additional information about the issue..."
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              rows={3}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {additionalDetails.length}/500 characters
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleInitialSubmit}
            disabled={!selectedReason}
            className="bg-destructive hover:bg-destructive/90"
          >
            Submit Report
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

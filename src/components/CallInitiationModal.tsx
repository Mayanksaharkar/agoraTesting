import { useState, useEffect } from 'react';
import { Phone, Video, Clock, Wallet, AlertCircle, CheckCircle2, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { userApi } from '@/services/api';
import { cn } from '@/lib/utils';

interface CallPackage {
  _id: string;
  duration: number;
  price: number;
  discountPercentage: number;
  isActive: boolean;
}

interface CallInitiationModalProps {
  astrologerId: string;
  astrologerName: string;
  audioCallRate: number;
  videoCallRate: number;
  acceptAudioCalls: boolean;
  acceptVideoCalls: boolean;
  packages: CallPackage[];
  onClose: () => void;
  onCallInitiated: (callId: string) => void;
}

type CallType = 'audio' | 'video';
type BillingType = 'per_minute' | 'package';

export default function CallInitiationModal({
  astrologerId,
  astrologerName,
  audioCallRate,
  videoCallRate,
  acceptAudioCalls,
  acceptVideoCalls,
  packages,
  onClose,
  onCallInitiated,
}: CallInitiationModalProps) {
  const [callType, setCallType] = useState<CallType>(() => {
    if (acceptVideoCalls) return 'video';
    if (acceptAudioCalls) return 'audio';
    return 'video';
  });
  const [billingType, setBillingType] = useState<BillingType>('per_minute');
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isAddingMoney, setIsAddingMoney] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    setIsLoadingBalance(true);
    try {
      const response = await userApi.getProfile();
      const balance = response.user?.walletBalance || 0;
      setWalletBalance(balance);
    } catch (err: any) {
      console.error('Failed to fetch wallet balance:', err);
      setWalletBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const getCurrentRate = () => {
    return callType === 'audio' ? audioCallRate : videoCallRate;
  };

  const getMinimumRequired = () => {
    if (billingType === 'package' && selectedPackageId) {
      const pkg = packages.find(p => p._id === selectedPackageId);
      return pkg?.price || 0;
    }
    // Minimum 5 minutes for per-minute billing
    return getCurrentRate() * 5;
  };

  const hasSufficientBalance = () => {
    return walletBalance >= getMinimumRequired();
  };

  const getSelectedPackage = () => {
    return packages.find(p => p._id === selectedPackageId);
  };

  const handleInitiateCall = async () => {
    if (!hasSufficientBalance()) {
      setError('Insufficient wallet balance');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: any = {
        astrologerId,
        callType,
        billingType,
      };

      if (billingType === 'package' && selectedPackageId) {
        payload.packageId = selectedPackageId;
      }

      const response = await userApi.initiateCall(payload);
      // Backend returns: { success: true, data: { callId, session } }
      const callId = response.data?.callId || response.data?.session?._id;
      if (!callId) {
        throw new Error('Call ID not received from server');
      }
      onCallInitiated(callId);
    } catch (err: any) {
      setError(err.message || 'Failed to initiate call');
      setIsLoading(false);
    }
  };

  const handleAddMoney = async () => {
    setIsAddingMoney(true);
    setError(null);
    try {
      // Add a fixed amount for testing (₹500)
      const amountToAdd = 500;
      await userApi.addMoneyToWallet({
        amount: amountToAdd,
        description: 'Test wallet recharge'
      });
      
      // Refresh wallet balance
      await fetchWalletBalance();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to add money to wallet');
    } finally {
      setIsAddingMoney(false);
    }
  };

  const activePackages = packages.filter(p => p.isActive);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Initiate Call</h2>
            <p className="text-sm text-muted-foreground mt-1">with {astrologerName}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isLoading}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Wallet Balance */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Wallet Balance</span>
              </div>
              {isLoadingBalance ? (
                <div className="w-16 h-6 bg-secondary animate-pulse rounded" />
              ) : (
                <span className="text-lg font-bold text-foreground">₹{walletBalance.toFixed(2)}</span>
              )}
            </div>
          </div>

          {/* Call Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">Select Call Type</Label>
            <RadioGroup value={callType} onValueChange={(v) => setCallType(v as CallType)}>
              <div className="grid grid-cols-2 gap-3">
                {/* Audio Call Option */}
                {acceptAudioCalls && audioCallRate > 0 && (
                  <label
                    className={cn(
                      'relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all',
                      callType === 'audio'
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-secondary hover:border-primary/50'
                    )}
                  >
                    <RadioGroupItem value="audio" className="sr-only" />
                    <Phone className={cn('w-6 h-6', callType === 'audio' ? 'text-primary' : 'text-muted-foreground')} />
                    <div className="text-center">
                      <p className="font-semibold text-sm text-foreground">Audio Call</p>
                      <p className="text-xs text-muted-foreground mt-1">₹{audioCallRate}/min</p>
                    </div>
                    {callType === 'audio' && (
                      <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-primary" />
                    )}
                  </label>
                )}

                {/* Video Call Option */}
                {acceptVideoCalls && videoCallRate > 0 && (
                  <label
                    className={cn(
                      'relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all',
                      callType === 'video'
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-secondary hover:border-primary/50'
                    )}
                  >
                    <RadioGroupItem value="video" className="sr-only" />
                    <Video className={cn('w-6 h-6', callType === 'video' ? 'text-primary' : 'text-muted-foreground')} />
                    <div className="text-center">
                      <p className="font-semibold text-sm text-foreground">Video Call</p>
                      <p className="text-xs text-muted-foreground mt-1">₹{videoCallRate}/min</p>
                    </div>
                    {callType === 'video' && (
                      <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-primary" />
                    )}
                  </label>
                )}
              </div>
            </RadioGroup>
          </div>

          {/* Billing Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">Select Billing Type</Label>
            <RadioGroup value={billingType} onValueChange={(v) => {
              setBillingType(v as BillingType);
              if (v === 'per_minute') {
                setSelectedPackageId(null);
              }
            }}>
              <div className="space-y-3">
                {/* Per-Minute Billing */}
                <label
                  className={cn(
                    'relative flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                    billingType === 'per_minute'
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-secondary hover:border-primary/50'
                  )}
                >
                  <RadioGroupItem value="per_minute" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">Pay Per Minute</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ₹{getCurrentRate()}/min • Minimum ₹{getCurrentRate() * 5} (5 mins)
                    </p>
                  </div>
                </label>

                {/* Package Billing */}
                {activePackages.length > 0 && (
                  <label
                    className={cn(
                      'relative flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                      billingType === 'package'
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-secondary hover:border-primary/50'
                    )}
                  >
                    <RadioGroupItem value="package" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">Choose Package</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Save with discounted packages
                      </p>
                    </div>
                  </label>
                )}
              </div>
            </RadioGroup>
          </div>

          {/* Package Selection */}
          {billingType === 'package' && activePackages.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground">Select Package</Label>
              <div className="grid gap-3">
                {activePackages.map((pkg) => (
                  <label
                    key={pkg._id}
                    className={cn(
                      'relative flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all',
                      selectedPackageId === pkg._id
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-secondary hover:border-primary/50'
                    )}
                  >
                    <input
                      type="radio"
                      name="package"
                      value={pkg._id}
                      checked={selectedPackageId === pkg._id}
                      onChange={() => setSelectedPackageId(pkg._id)}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold text-foreground">{pkg.duration} minutes</p>
                        <p className="text-xs text-muted-foreground">
                          Save ₹{Math.round((pkg.duration * getCurrentRate()) - pkg.price)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">₹{pkg.price}</p>
                      {pkg.discountPercentage > 0 && (
                        <p className="text-xs text-destructive font-semibold">
                          {pkg.discountPercentage}% OFF
                        </p>
                      )}
                    </div>
                    {selectedPackageId === pkg._id && (
                      <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-primary" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Cost Summary */}
          <div className="bg-secondary border border-border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Required Amount</span>
              <span className="font-semibold text-foreground">₹{getMinimumRequired().toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your Balance</span>
              <span className={cn(
                'font-semibold',
                hasSufficientBalance() ? 'text-green-500' : 'text-destructive'
              )}>
                ₹{walletBalance.toFixed(2)}
              </span>
            </div>
            {billingType === 'per_minute' && (
              <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                You'll be charged ₹{getCurrentRate()} per minute during the call
              </p>
            )}
            {billingType === 'package' && getSelectedPackage() && (
              <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                Full package amount will be deducted upfront
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Insufficient Balance Warning */}
          {!hasSufficientBalance() && !error && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
                <p className="text-sm text-warning">
                  Insufficient balance. Please recharge your wallet to continue.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAddMoney}
                disabled={isAddingMoney}
              >
                {isAddingMoney ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Adding Money...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add ₹500 to Wallet (Test)
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleInitiateCall}
              disabled={
                isLoading ||
                isLoadingBalance ||
                !hasSufficientBalance() ||
                (billingType === 'package' && !selectedPackageId)
              }
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Initiating...
                </>
              ) : (
                <>
                  {callType === 'audio' ? <Phone className="w-4 h-4 mr-2" /> : <Video className="w-4 h-4 mr-2" />}
                  Initiate Call
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

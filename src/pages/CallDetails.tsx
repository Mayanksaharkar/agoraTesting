import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Phone, Video, Clock, Calendar, ChevronLeft, DollarSign, User, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userApi, astrologerApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface CallDetails {
  _id: string;
  userId?: {
    _id: string;
    name?: string;
    email?: string;
  };
  astrologerId: {
    _id: string;
    personalDetails?: {
      name?: string;
      pseudonym?: string;
      profileImage?: string;
    };
  };
  callType: 'audio' | 'video';
  billingType: 'per_minute' | 'package';
  status: string;
  ratePerMinute: number;
  duration: number;
  billedDuration: number;
  totalAmount: number;
  freeMinutesUsed: number;
  paidAmount: number;
  platformCommission?: number;
  astrologerEarnings?: number;
  initiatedAt: string;
  acceptedAt?: string;
  connectedAt?: string;
  endedAt?: string;
  rating?: {
    stars: number;
    review?: string;
    ratedAt?: string;
  };
  package?: {
    duration: number;
    price: number;
  };
}

export default function CallDetails() {
  const { callId } = useParams<{ callId: string }>();
  const { role } = useAuth();
  const navigate = useNavigate();
  const [call, setCall] = useState<CallDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCallDetails();
  }, [callId]);

  const fetchCallDetails = async () => {
    if (!callId) return;
    setIsLoading(true);
    try {
      const data = role === 'user' 
        ? await userApi.getCallDetails(callId)
        : await astrologerApi.getCallDetails(callId);
      setCall(data.call || data);
    } catch (error) {
      console.error('Failed to fetch call details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ended':
        return 'bg-green-500/10 text-green-500';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-500/10 text-red-500';
      case 'no_answer':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'active':
        return 'bg-blue-500/10 text-blue-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!call) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Call Not Found</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Call Details</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Call Status and Type */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {call.callType === 'video' ? (
                  <Video className="h-5 w-5 text-primary" />
                ) : (
                  <Phone className="h-5 w-5 text-primary" />
                )}
                {call.callType === 'video' ? 'Video Call' : 'Audio Call'}
              </CardTitle>
              <Badge className={getStatusColor(call.status)}>
                {call.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Participant Info */}
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {role === 'user' ? 'Astrologer' : 'User'}
                  </p>
                  <p className="font-medium">
                    {role === 'user'
                      ? call.astrologerId?.personalDetails?.pseudonym || 
                        call.astrologerId?.personalDetails?.name || 
                        'Unknown'
                      : call.userId?.name || 'Unknown User'}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Initiated</p>
                    <p className="font-medium">
                      {format(new Date(call.initiatedAt), 'PPp')}
                    </p>
                  </div>
                </div>

                {call.connectedAt && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Connected</p>
                      <p className="font-medium">
                        {format(new Date(call.connectedAt), 'PPp')}
                      </p>
                    </div>
                  </div>
                )}

                {call.endedAt && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Ended</p>
                      <p className="font-medium">
                        {format(new Date(call.endedAt), 'PPp')}
                      </p>
                    </div>
                  </div>
                )}

                {call.duration > 0 && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{formatDuration(call.duration)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Breakdown */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Billing Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Billing Type</span>
                <span className="font-medium capitalize">
                  {call.billingType.replace('_', ' ')}
                </span>
              </div>

              {call.billingType === 'package' && call.package && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Package Duration</span>
                    <span className="font-medium">{call.package.duration} minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Package Price</span>
                    <span className="font-medium">₹{call.package.price}</span>
                  </div>
                </>
              )}

              {call.billingType === 'per_minute' && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Rate per Minute</span>
                  <span className="font-medium">₹{call.ratePerMinute}</span>
                </div>
              )}

              {call.billedDuration > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Billed Duration</span>
                  <span className="font-medium">{call.billedDuration} minutes</span>
                </div>
              )}

              {call.freeMinutesUsed > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center text-green-600">
                    <span>Free Minutes Used</span>
                    <span className="font-medium">{call.freeMinutesUsed} minutes</span>
                  </div>
                </>
              )}

              <Separator />

              {call.paidAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Paid Amount</span>
                  <span className="font-medium">₹{call.paidAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Amount</span>
                <span>₹{call.totalAmount.toFixed(2)}</span>
              </div>

              {/* Astrologer-specific billing info */}
              {role === 'astrologer' && (
                <>
                  <Separator />
                  {call.platformCommission !== undefined && (
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Platform Commission</span>
                      <span>₹{call.platformCommission.toFixed(2)}</span>
                    </div>
                  )}
                  {call.astrologerEarnings !== undefined && (
                    <div className="flex justify-between items-center text-lg font-semibold text-green-600">
                      <span>Your Earnings</span>
                      <span>₹{call.astrologerEarnings.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rating Section (if submitted) */}
        {call.rating && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Rating & Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= call.rating!.stars
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">{call.rating.stars} / 5</span>
                </div>

                {call.rating.review && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Review</p>
                      <p className="text-foreground">{call.rating.review}</p>
                    </div>
                  </>
                )}

                {call.rating.ratedAt && (
                  <p className="text-xs text-muted-foreground">
                    Rated on {format(new Date(call.rating.ratedAt), 'PPp')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
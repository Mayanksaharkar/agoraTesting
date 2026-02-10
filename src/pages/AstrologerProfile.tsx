import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Video, Star, Clock, Tag, CheckCircle2, MessageCircle } from 'lucide-react';
import { userApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CallInitiationModal from '@/components/CallInitiationModal';
import ChatNavLink from '@/components/ChatNavLink';

interface CallPackage {
  _id: string;
  duration: number;
  price: number;
  discountPercentage: number;
  isActive: boolean;
}

interface Astrologer {
  _id: string;
  personalDetails: {
    pseudonym?: string;
    profileImage?: string;
    about?: string;
    experience?: number;
    languages?: string[];
    skills?: string[];
  };
  ratings: {
    average: number;
    count: number;
  };
  availability: {
    status: 'online' | 'busy' | 'offline';
  };
  callSettings: {
    audioCallRate: number;
    videoCallRate: number;
    acceptAudioCalls: boolean;
    acceptVideoCalls: boolean;
  };
}

export default function AstrologerProfile() {
  const { astrologerId } = useParams<{ astrologerId: string }>();
  const navigate = useNavigate();
  const [astrologer, setAstrologer] = useState<Astrologer | null>(null);
  const [packages, setPackages] = useState<CallPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);

  useEffect(() => {
    if (astrologerId) {
      fetchAstrologerData();
    }
  }, [astrologerId]);

  const fetchAstrologerData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [astrologerData, packagesData] = await Promise.all([
        userApi.getAstrologerProfile(astrologerId!),
        userApi.getAstrologerPackages(astrologerId!).catch(() => ({ packages: [] }))
      ]);
      setAstrologer(astrologerData);
      setPackages(packagesData.packages || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load astrologer profile');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Available';
      case 'busy':
        return 'In Call';
      case 'offline':
        return 'Offline';
      default:
        return 'Offline';
    }
  };

  const isCallDisabled = () => {
    if (!astrologer) return true;
    return astrologer.availability.status === 'busy' || astrologer.availability.status === 'offline';
  };

  const handleCallInitiated = (callId: string) => {
    setShowCallModal(false);

    // Store astrologer info for the ringing page
    if (astrologer) {
      localStorage.setItem('calling_astrologer', JSON.stringify({
        name: astrologer.personalDetails.pseudonym || 'Astrologer',
        profileImage: astrologer.personalDetails.profileImage,
        callType: 'video' // This will be passed from the modal in a real implementation
      }));
    }

    // Navigate to call ringing UI
    navigate(`/user/call/${callId}/ringing`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !astrologer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'Astrologer not found'}</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border glass sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-display font-bold text-foreground">Astrologer Profile</h1>
          </div>
          <ChatNavLink />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Profile Header */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {astrologer.personalDetails.profileImage ? (
                <img
                  src={astrologer.personalDetails.profileImage}
                  alt={astrologer.personalDetails.pseudonym || 'Astrologer'}
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary/30"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-3xl">
                  {(astrologer.personalDetails.pseudonym || 'A').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                    {astrologer.personalDetails.pseudonym || 'Astrologer'}
                  </h2>
                  {astrologer.ratings.count > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-warning">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-semibold">{astrologer.ratings.average.toFixed(1)}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({astrologer.ratings.count} reviews)
                      </span>
                    </div>
                  )}
                </div>

                {/* Availability Status */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border">
                  <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(astrologer.availability.status)} ${astrologer.availability.status === 'online' ? 'animate-pulse' : ''}`} />
                  <span className="text-sm font-medium text-foreground">
                    {getStatusText(astrologer.availability.status)}
                  </span>
                </div>
              </div>

              {/* Experience & Skills */}
              <div className="flex flex-wrap gap-2 mb-3">
                {astrologer.personalDetails.experience && (
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="w-3 h-3" />
                    {astrologer.personalDetails.experience} years exp
                  </Badge>
                )}
                {astrologer.personalDetails.skills?.slice(0, 3).map((skill, idx) => (
                  <Badge key={idx} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>

              {/* Languages */}
              {astrologer.personalDetails.languages && astrologer.personalDetails.languages.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Languages: {astrologer.personalDetails.languages.join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* About */}
          {astrologer.personalDetails.about && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="font-semibold text-foreground mb-2">About</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {astrologer.personalDetails.about}
              </p>
            </div>
          )}
        </div>

        {/* Call Rates */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h3 className="font-display text-lg font-bold text-foreground mb-4">Call Rates</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Audio Call Rate */}
            {astrologer.callSettings.acceptAudioCalls && astrologer.callSettings.audioCallRate > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary border border-border">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Audio Call</p>
                  <p className="font-semibold text-foreground">
                    ₹{astrologer.callSettings.audioCallRate}/min
                  </p>
                </div>
              </div>
            )}

            {/* Video Call Rate */}
            {astrologer.callSettings.acceptVideoCalls && astrologer.callSettings.videoCallRate > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary border border-border">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Video Call</p>
                  <p className="font-semibold text-foreground">
                    ₹{astrologer.callSettings.videoCallRate}/min
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Call Packages */}
        {packages.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              Special Packages
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg._id}
                  className="relative p-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20"
                >
                  {/* Discount Badge */}
                  {pkg.discountPercentage > 0 && (
                    <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full">
                      {pkg.discountPercentage}% OFF
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">{pkg.duration} minutes</span>
                  </div>

                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-bold text-foreground">₹{pkg.price}</span>
                    {pkg.discountPercentage > 0 && (
                      <span className="text-sm text-muted-foreground line-through">
                        ₹{Math.round(pkg.price / (1 - pkg.discountPercentage / 100))}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    Save ₹{Math.round((pkg.duration * astrologer.callSettings.videoCallRate) - pkg.price)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 -mx-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex gap-3">
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={() => navigate(`/user/chat/${astrologerId}`, {
                  state: {
                    participantName: astrologer.personalDetails.pseudonym || 'Astrologer',
                    participantAvatar: astrologer.personalDetails.profileImage
                  }
                })}
              >
                <MessageCircle className="w-5 h-5" />
                Message
              </Button>
              <Button
                size="lg"
                className="flex-1"
                disabled={isCallDisabled()}
                onClick={() => setShowCallModal(true)}
              >
                {astrologer.availability.status === 'busy' ? (
                  <>Currently Busy</>
                ) : astrologer.availability.status === 'offline' ? (
                  <>Currently Offline</>
                ) : (
                  <>
                    <Phone className="w-5 h-5" />
                    Call Now
                  </>
                )}
              </Button>
            </div>
            {isCallDisabled() && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                {astrologer.availability.status === 'busy'
                  ? 'Astrologer is currently in another call'
                  : 'Astrologer is currently offline'}
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Call Initiation Modal */}
      {showCallModal && astrologer && (
        <CallInitiationModal
          astrologerId={astrologer._id}
          astrologerName={astrologer.personalDetails.pseudonym || 'Astrologer'}
          audioCallRate={astrologer.callSettings.audioCallRate}
          videoCallRate={astrologer.callSettings.videoCallRate}
          acceptAudioCalls={astrologer.callSettings.acceptAudioCalls}
          acceptVideoCalls={astrologer.callSettings.acceptVideoCalls}
          packages={packages}
          onClose={() => setShowCallModal(false)}
          onCallInitiated={handleCallInitiated}
        />
      )}
    </div>
  );
}

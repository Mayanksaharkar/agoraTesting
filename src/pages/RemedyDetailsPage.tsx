import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { remedyApi } from '@/services/remedyApi';
import { Remedy, AstrologerRemedyService } from '@/types/remedy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  IndianRupee, 
  User, 
  Video,
  FileText,
  Phone,
  Shield,
  CheckCircle,
  Circle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const RemedyDetailsPage = () => {
  const { remedyId } = useParams<{ remedyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [remedy, setRemedy] = useState<Remedy | null>(null);
  const [astrologers, setAstrologers] = useState<AstrologerRemedyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [astrologersLoading, setAstrologersLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'experience'>('rating');
  
  useEffect(() => {
    if (remedyId) {
      loadRemedyDetails();
      loadAstrologers();
    }
  }, [remedyId, sortBy]);

  const loadRemedyDetails = async () => {
    try {
      setLoading(true);
      const response = await remedyApi.getRemedyById(remedyId!);
      setRemedy(response.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load remedy details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAstrologers = async () => {
    try {
      setAstrologersLoading(true);
      const response = await remedyApi.getAstrologersForRemedy(remedyId!, { 
        sortBy, 
        limit: 20 
      });
      setAstrologers(response.data.astrologers);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load astrologers",
        variant: "destructive",
      });
    } finally {
      setAstrologersLoading(false);
    }
  };

  const handleBookAstrologer = (astrologerService: AstrologerRemedyService) => {
    navigate(`/user/remedies/${remedyId}/book/${astrologerService._id}`, {
      state: { 
        remedy, 
        astrologerService 
      }
    });
  };

  const getDeliveryIcon = (type: string) => {
    switch (type) {
      case 'live_video': return <Video className="w-4 h-4" />;
      case 'recorded_video': return <Video className="w-4 h-4" />;
      case 'report': return <FileText className="w-4 h-4" />;
      case 'consultation': return <Phone className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!remedy) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-600">Remedy not found</h2>
          <Button onClick={() => navigate('/user/remedies')} className="mt-4">
            Browse Remedies
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-7xl mx-auto p-4">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/user/remedies')}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Remedies
        </Button>

        {/* Remedy Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Remedy Info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className="mb-2 bg-green-100 text-green-800">
                      {remedy.category}
                    </Badge>
                    <CardTitle className="text-2xl mb-2">{remedy.title}</CardTitle>
                    <p className="text-gray-600">{remedy.description}</p>
                  </div>
                  <img 
                    src={remedy.image || '/placeholder-remedy.jpg'} 
                    alt={remedy.title}
                    className="w-24 h-24 object-cover rounded-lg ml-4"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/100x100?text=' + encodeURIComponent(remedy.title);
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {/* Service Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="font-semibold">{remedy.duration_minutes} mins+</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <IndianRupee className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <div className="text-sm text-gray-600">Starting Price</div>
                    <div className="font-semibold">₹{remedy.base_price}+</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    {getDeliveryIcon(remedy.delivery_type)}
                    <div className="text-sm text-gray-600 mt-2">Delivery</div>
                    <div className="font-semibold text-xs">{remedy.delivery_type.replace('_', ' ')}</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <User className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                    <div className="text-sm text-gray-600">Astrologers</div>
                    <div className="font-semibold">{astrologers.length}</div>
                  </div>
                </div>

                {/* Specializations */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Available Services</h3>
                  <div className="space-y-2">
                    {remedy.specializations.map((spec, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{spec.name}</div>
                          {spec.description && (
                            <div className="text-sm text-gray-600">{spec.description}</div>
                          )}
                          <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {spec.duration_minutes} minutes
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600 flex items-center">
                            <IndianRupee className="w-4 h-4" />
                            {spec.price}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requirements Preview */}
                <div>
                  <h3 className="font-semibold mb-3">Information Required</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {remedy.requirements.slice(0, 6).map((req, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {req.is_required ? (
                          <CheckCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-400" />
                        )}
                        <span className={req.is_required ? 'font-medium' : 'text-gray-600'}>
                          {req.field_name}
                        </span>
                        {req.is_required && <span className="text-red-500">*</span>}
                      </div>
                    ))}
                    {remedy.requirements.length > 6 && (
                      <div className="text-sm text-gray-500 col-span-2">
                        +{remedy.requirements.length - 6} more fields
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Why Choose This Remedy?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium">Verified Astrologers</div>
                      <div className="text-sm text-gray-600">All experts are verified</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium">100% Authentic</div>
                      <div className="text-sm text-gray-600">Traditional rituals</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="font-medium">Live Streaming</div>
                      <div className="text-sm text-gray-600">Watch it happen</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-800 font-medium">Sacred & Delivered to Your Home</div>
                  <div className="text-xs text-green-600 mt-1">Prasad delivery included</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Available Astrologers */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Available Astrologers ({astrologers.length})</h2>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Sort by Rating</SelectItem>
                <SelectItem value="price">Sort by Price</SelectItem>
                <SelectItem value="experience">Sort by Experience</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {astrologersLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {astrologers.map((astrologerService) => (
                <AstrologerCard 
                  key={astrologerService._id}
                  astrologerService={astrologerService}
                  remedy={remedy}
                  onBook={() => handleBookAstrologer(astrologerService)}
                />
              ))}
            </div>
          )}

          {astrologers.length === 0 && !astrologersLoading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👨‍🔮</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No astrologers available</h3>
              <p className="text-gray-500">Please check back later or try a different remedy</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Astrologer Card Component
const AstrologerCard = ({ 
  astrologerService, 
  remedy,
  onBook 
}: { 
  astrologerService: AstrologerRemedyService;
  remedy: Remedy;
  onBook: () => void;
}) => {
  const astrologer = astrologerService.astrologer_id;
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="relative">
            <img 
              src={astrologer.personalDetails.profileImage || '/placeholder-avatar.jpg'} 
              alt={astrologer.personalDetails.name}
              className="w-16 h-16 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(astrologer.personalDetails.name)}&background=059669&color=fff`;
              }}
            />
            {astrologer.systemStatus?.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{astrologer.personalDetails.name}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-medium">{astrologerService.metrics.average_rating.toFixed(1)}</span>
              <span className="text-gray-500">({astrologerService.metrics.total_reviews} reviews)</span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {astrologerService.experience.years_experience} years exp • {astrologerService.experience.total_bookings} bookings
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {astrologerService.experience.specialization_description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {astrologerService.experience.specialization_description}
          </p>
        )}

        {/* Pricing */}
        <div className="space-y-2 mb-4">
          {astrologerService.custom_pricing.slice(0, 2).map((pricing, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <div className="font-medium text-sm">{pricing.specialization_name}</div>
                <div className="text-xs text-gray-600">{pricing.my_duration} mins</div>
              </div>
              <div className="font-semibold text-green-600 flex items-center">
                <IndianRupee className="w-4 h-4" />
                {pricing.my_price}
              </div>
            </div>
          ))}
          {astrologerService.custom_pricing.length > 2 && (
            <div className="text-xs text-gray-500 text-center">
              +{astrologerService.custom_pricing.length - 2} more options
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-center">
          <div>
            <div className="text-xs text-gray-600">Success Rate</div>
            <div className="font-semibold text-green-600">{astrologerService.experience.success_rate}%</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Response Time</div>
            <div className="font-semibold">{astrologerService.metrics.response_time_hours}h</div>
          </div>
        </div>

        <Button 
          onClick={onBook} 
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={!astrologerService.availability.is_active}
        >
          {astrologerService.availability.is_active ? 'Book Now' : 'Unavailable'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default RemedyDetailsPage;
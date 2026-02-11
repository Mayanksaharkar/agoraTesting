import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { remedyApi } from '@/services/remedyApi';
import { RemedyBooking } from '@/types/remedy';
import { config } from '@/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar,
  Clock, 
  IndianRupee, 
  User,
  Video,
  FileText,
  MessageCircle,
  Star,
  Eye,
  Package
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

// Helper function for status badges
const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
    confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800' },
    in_progress: { label: 'In Progress', className: 'bg-purple-100 text-purple-800' },
    completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
};

const UserBookingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [bookings, setBookings] = useState<RemedyBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadBookings();
  }, [activeTab]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const status = activeTab === 'all' ? undefined : activeTab;
      console.log('Loading bookings with status:', status);
      const response = await remedyApi.getUserBookings({ status, limit: 50 });
      console.log('Bookings response:', response);
      
      // Filter out bookings with missing populated data
      const validBookings = response.data.bookings.filter(booking => {
        const isValid = booking?.remedy_id && 
                       booking?.astrologer_id && 
                       booking?.selected_service &&
                       booking?.booking_details;
        if (!isValid) {
          console.warn('Invalid booking data:', booking);
        }
        return isValid;
      });
      
      console.log('Valid bookings:', validBookings);
      setBookings(validBookings);
    } catch (error: any) {
      console.error('Bookings error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewBooking = (bookingId: string) => {
    navigate(`/user/bookings/${bookingId}`);
  };

  const handleReviewBooking = (booking: RemedyBooking) => {
    // Open review modal or navigate to review page
    console.log('Review booking:', booking);
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    return booking.status === activeTab;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Remedy Bookings</h1>
          <p className="text-gray-600">Track your remedy services and view delivery content</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-1/2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {activeTab === 'all' ? 'No bookings found' : `No ${activeTab} bookings`}
                </h3>
                <p className="text-gray-500 mb-4">
                  {activeTab === 'all' 
                    ? 'You haven\'t made any remedy bookings yet'
                    : `You don't have any ${activeTab} bookings at the moment`
                  }
                </p>
                <Button 
                  onClick={() => navigate('/user/remedies')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Browse Remedies
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredBookings.map((booking) => (
              <BookingCard 
                key={booking._id}
                booking={booking}
                onView={() => handleViewBooking(booking._id)}
                onReview={() => handleReviewBooking(booking)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const resolveFileUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${config.api.baseURL.replace(/\/$/, '')}${url}`;
};

// Booking Card Component
const BookingCard = ({ 
  booking, 
  onView, 
  onReview 
}: { 
  booking: RemedyBooking;
  onView: () => void;
  onReview: () => void;
}) => {
  const fileUrl = resolveFileUrl(booking.delivery?.content?.file_url || booking.delivery?.content?.video_url);
  const responseType = booking.delivery?.content?.response_type;
  const isPdf = responseType === 'pdf' || booking.delivery?.content?.file_mime?.includes('pdf') || fileUrl.endsWith('.pdf');

  const getDeliveryStatusBadge = (delivery: any) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800' },
      completed: { label: 'Completed', className: 'bg-blue-100 text-blue-800' },
    };
    
    const config = statusConfig[delivery.status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-100 text-green-800">
                {booking.remedy_id?.category || 'N/A'}
              </Badge>
              {getStatusBadge(booking.status)}
            </div>
            <CardTitle className="text-xl mb-1">{booking.remedy_id?.title || 'Unknown Remedy'}</CardTitle>
            <p className="text-gray-600">
              Service: {booking.selected_service?.specialization_name || 'N/A'}
            </p>
          </div>
          <img 
            src={booking.remedy_id?.image || '/placeholder-remedy.jpg'} 
            alt={booking.remedy_id?.title || 'Remedy'}
            className="w-20 h-20 object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/80x80?text=Remedy';
            }}
          />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Astrologer Info */}
          <div className="flex items-center gap-3">
            <img 
              src={booking.astrologer_id?.personalDetails?.profileImage || '/placeholder-avatar.jpg'} 
              alt={booking.astrologer_id?.personalDetails?.name || 'Astrologer'}
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.astrologer_id?.personalDetails?.name || 'Astrologer')}&background=059669&color=fff`;
              }}
            />
            <div>
              <div className="font-medium">{booking.astrologer_id?.personalDetails?.name || 'Unknown'}</div>
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <User className="w-3 h-3" />
                Astrologer
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-2">
            {booking.booking_details?.scheduled_start_time && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{format(new Date(booking.booking_details?.scheduled_start_time), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>{format(new Date(booking.booking_details?.scheduled_start_time), 'hh:mm a')} ({booking.selected_service?.duration_minutes || 0} mins)</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-2 text-sm">
              <IndianRupee className="w-4 h-4 text-gray-500" />
              <span>₹{booking.booking_details?.total_amount || 0}</span>
            </div>
          </div>

          {/* Delivery Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {booking.delivery?.type === 'live_video' && <Video className="w-4 h-4 text-purple-600" />}
                {booking.delivery?.type === 'recorded_video' && <Video className="w-4 h-4 text-blue-600" />}
                {booking.delivery?.type === 'report' && <FileText className="w-4 h-4 text-green-600" />}
                {booking.delivery?.type === 'consultation' && <MessageCircle className="w-4 h-4 text-orange-600" />}
                {booking.delivery?.type === 'physical_item' && <Package className="w-4 h-4 text-amber-600" />}
                <span className="text-sm font-medium">
                  {booking.delivery?.type?.replace('_', ' ').toUpperCase() || 'N/A'}
                </span>
              </div>
            </div>
            {booking.delivery && getDeliveryStatusBadge(booking.delivery)}
            {booking.delivery?.delivered_at && (
              <div className="text-xs text-gray-500">
                Delivered: {format(new Date(booking.delivery?.delivered_at), 'MMM dd, hh:mm a')}
              </div>
            )}
          </div>
        </div>

        {/* Delivery Content Preview */}
        {booking.delivery?.content && booking.delivery?.status === 'delivered' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium text-green-800">Service Delivered</span>
            </div>

            {(!isPdf && (booking.delivery?.content?.response_type === 'video' || booking.delivery?.content?.video_url)) && (
              <div className="flex items-center gap-2 text-sm text-green-700 mb-2">
                <Video className="w-4 h-4" />
                <span>Video content available</span>
              </div>
            )}

            {isPdf && (
              <div className="flex items-center gap-2 text-sm text-green-700 mb-2">
                <FileText className="w-4 h-4" />
                <span>PDF report available</span>
              </div>
            )}

            {booking.delivery?.content?.text_content && (
              <p className="text-sm text-green-700 italic">
                "{booking.delivery?.content?.text_content}"
              </p>
            )}
            
            {booking.delivery?.content?.delivery_notes && (
              <p className="text-sm text-green-700 italic">
                "{booking.delivery?.content?.delivery_notes}"
              </p>
            )}
          </div>
        )}

        {/* Messages Preview */}
        {booking.messages && booking.messages.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">
                Latest Message ({booking.messages.length})
              </span>
            </div>
            <p className="text-sm text-blue-700 line-clamp-2">
              {booking.messages[booking.messages.length - 1]?.message || ''}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={onView}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Details
          </Button>

          {(booking.delivery?.content?.video_url || booking.delivery?.content?.file_url) && (
            <Button 
              variant="outline" 
              onClick={() => window.open(fileUrl, '_blank')}
              className="flex items-center gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              {isPdf ? <FileText className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              {isPdf ? 'Download PDF' : 'Watch Video'}
            </Button>
          )}

          {booking.status === 'completed' && !booking.review && (
            <Button 
              onClick={onReview}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600"
            >
              <Star className="w-4 h-4" />
              Leave Review
            </Button>
          )}
        </div>

        {/* Review Display */}
        {booking.review && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${
                      i < (booking.review?.rating || 0)
                        ? 'text-yellow-500 fill-yellow-500' 
                        : 'text-gray-300'
                    }`} 
                  />
                ))}
              </div>
              {booking.review?.review_date && (
                <span className="text-sm text-gray-600">
                  Your Review • {format(new Date(booking.review?.review_date), 'MMM dd, yyyy')}
                </span>
              )}
            </div>
            {booking.review?.comment && (
              <p className="text-sm text-gray-700">"{booking.review.comment}"</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserBookingsPage;
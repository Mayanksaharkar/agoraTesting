import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, IndianRupee, MessageCircle, Video } from 'lucide-react';
import { remedyApi } from '@/services/remedyApi';
import { Remedy, AstrologerRemedyService, RemedyBooking } from '@/types/remedy';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { config } from '@/config';
import { format } from 'date-fns';

const resolveFileUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${config.api.baseURL.replace(/\/$/, '')}${url}`;
};

const remedyCategories: Remedy['category'][] = [
  'VIP E-Pooja',
  'Palmistry',
  'Career',
  'Name Correction',
  'Face Reading',
  'Problem Solving',
  'Remedy Combos'
];

const deliveryTypes: Remedy['delivery_type'][] = [
  'live_video',
  'recorded_video',
  'report',
  'consultation',
  'physical_item'
];

const AstrologerRemediesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'services' | 'bookings'>('services');
  const [availableRemedies, setAvailableRemedies] = useState<Remedy[]>([]);
  const [myServices, setMyServices] = useState<AstrologerRemedyService[]>([]);
  const [bookings, setBookings] = useState<RemedyBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingUpdates, setBookingUpdates] = useState<Record<string, {
    status: RemedyBooking['status'];
    response_type: 'video' | 'pdf' | 'text';
    text_content: string;
    responseFile: File | null;
    delivery_notes: string;
    astrologer_notes: string;
  }>>({});
  const [isCreatingRemedy, setIsCreatingRemedy] = useState(false);
  const [newRemedy, setNewRemedy] = useState({
    title: '',
    description: '',
    category: 'VIP E-Pooja' as Remedy['category'],
    image: '',
    base_price: '',
    duration_minutes: '',
    delivery_type: 'recorded_video' as Remedy['delivery_type'],
    my_price: ''
  });

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (activeTab === 'bookings') {
      loadBookings();
    }
  }, [activeTab, bookingStatusFilter]);

  useEffect(() => {
    if (bookings.length === 0) return;
    setBookingUpdates((prev) => {
      const next = { ...prev };
      bookings.forEach((booking) => {
        if (!next[booking._id]) {
          next[booking._id] = {
            status: booking.status,
            response_type: booking.delivery?.content?.response_type || 'video',
            text_content: booking.delivery?.content?.text_content || booking.delivery?.content?.report_content || '',
            responseFile: null,
            delivery_notes: booking.delivery?.content?.delivery_notes || '',
            astrologer_notes: '',
          };
        }
      });
      return next;
    });
  }, [bookings]);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const [availableRes, myServicesRes] = await Promise.all([
        remedyApi.getAvailableRemediesForAstrologer(),
        remedyApi.getMyAstrologerServices(),
      ]);
      setAvailableRemedies(availableRes.data || []);
      setMyServices(myServicesRes.data || []);
    } catch (error: any) {
      toast({
        title: 'Failed to load remedies',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      setBookingsLoading(true);
      const status = bookingStatusFilter === 'all' ? undefined : bookingStatusFilter;
      const response = await remedyApi.getAstrologerBookings({ status, limit: 50 });
      setBookings(response.data.bookings || []);
    } catch (error: any) {
      toast({
        title: 'Failed to load bookings',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setBookingsLoading(false);
    }
  };

  const myServiceByRemedyId = useMemo(() => {
    const map = new Map<string, AstrologerRemedyService>();
    myServices.forEach((service) => {
      const remedyId = typeof service.remedy_id === 'string' ? service.remedy_id : (service.remedy_id as any)._id;
      if (remedyId) {
        map.set(remedyId, service);
      }
    });
    return map;
  }, [myServices]);

  const handleSetupService = async (remedy: Remedy) => {
    try {
      const defaultPricing = remedy.specializations.length > 0
        ? remedy.specializations.map((spec) => ({
            specialization_name: spec.name,
            my_price: spec.price || remedy.base_price,
            my_duration: spec.duration_minutes || remedy.duration_minutes,
            is_available: true,
          }))
        : [{
            specialization_name: remedy.title,
            my_price: remedy.base_price,
            my_duration: remedy.duration_minutes,
            is_available: true,
          }];

      const payload = {
        remedy_id: remedy._id,
        custom_pricing: defaultPricing,
        availability: {
          is_active: true,
          days_available: [],
          time_slots: [],
          advance_booking_days: 7,
          buffer_time_minutes: 15,
        },
        experience: {
          years_experience: 0,
          specialization_description: '',
        },
        portfolio: {},
        service_settings: {},
      };

      await remedyApi.setupAstrologerService(payload);
      toast({
        title: 'Service added',
        description: 'Your remedy service is now available for bookings.',
      });
      loadServices();
    } catch (error: any) {
      toast({
        title: 'Failed to add service',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleToggleService = async (serviceId: string, isActive: boolean) => {
    try {
      await remedyApi.toggleAstrologerService(serviceId, isActive);
      setMyServices((prev) =>
        prev.map((service) =>
          service._id === serviceId
            ? { ...service, availability: { ...service.availability, is_active: isActive } }
            : service
        )
      );
    } catch (error: any) {
      toast({
        title: 'Failed to update service',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleBookingUpdateChange = (bookingId: string, field: string, value: string) => {
    setBookingUpdates((prev) => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        [field]: value,
        ...(field === 'response_type'
          ? { responseFile: null, text_content: '' }
          : {}),
      },
    }));
  };

  const handleResponseFileChange = (bookingId: string, file: File | null) => {
    setBookingUpdates((prev) => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        responseFile: file,
      },
    }));
  };

  const handleSaveBookingUpdate = async (booking: RemedyBooking) => {
    const updates = bookingUpdates[booking._id];
    if (!updates) return;

    try {
      if (updates.status === 'completed') {
        if (updates.response_type === 'text' && !updates.text_content.trim()) {
          toast({
            title: 'Missing response text',
            description: 'Please add text content for the response.',
            variant: 'destructive',
          });
          return;
        }

        if ((updates.response_type === 'video' || updates.response_type === 'pdf') && !updates.responseFile) {
          toast({
            title: 'Missing file',
            description: 'Please upload a video or PDF file.',
            variant: 'destructive',
          });
          return;
        }

        await remedyApi.submitAstrologerResponse(booking._id, {
          response_type: updates.response_type,
          text_content: updates.response_type === 'text' ? updates.text_content : undefined,
          delivery_notes: updates.delivery_notes || undefined,
          responseFile: updates.response_type === 'text' ? null : updates.responseFile,
        });
      } else {
        await remedyApi.updateAstrologerBookingStatus(booking._id, {
          status: updates.status,
          astrologer_notes: updates.astrologer_notes || undefined,
        });
      }

      toast({
        title: 'Booking updated',
        description: 'Status and delivery details saved.',
      });

      loadBookings();
    } catch (error: any) {
      toast({
        title: 'Failed to update booking',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleNewRemedyChange = (field: keyof typeof newRemedy, value: string) => {
    setNewRemedy((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateRemedy = async () => {
    if (!newRemedy.title || !newRemedy.description || !newRemedy.image || !newRemedy.base_price || !newRemedy.duration_minutes) {
      toast({
        title: 'Missing fields',
        description: 'Please fill all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const basePrice = Number(newRemedy.base_price);
    const duration = Number(newRemedy.duration_minutes);
    const myPrice = Number(newRemedy.my_price || newRemedy.base_price);

    if (!Number.isFinite(basePrice) || !Number.isFinite(duration) || !Number.isFinite(myPrice)) {
      toast({
        title: 'Invalid numbers',
        description: 'Price and duration must be valid numbers.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreatingRemedy(true);
      await remedyApi.createAstrologerRemedy({
        title: newRemedy.title,
        description: newRemedy.description,
        category: newRemedy.category,
        image: newRemedy.image,
        base_price: basePrice,
        duration_minutes: duration,
        delivery_type: newRemedy.delivery_type,
        specializations: [{
          name: newRemedy.title,
          price: basePrice,
          duration_minutes: duration,
          description: newRemedy.description
        }],
        custom_pricing: [{
          specialization_name: newRemedy.title,
          my_price: myPrice,
          my_duration: duration,
          is_available: true
        }]
      });

      toast({
        title: 'Remedy submitted',
        description: 'Your remedy is submitted for approval.',
      });

      setNewRemedy({
        title: '',
        description: '',
        category: 'VIP E-Pooja',
        image: '',
        base_price: '',
        duration_minutes: '',
        delivery_type: 'recorded_video',
        my_price: ''
      });

      loadServices();
    } catch (error: any) {
      toast({
        title: 'Failed to create remedy',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingRemedy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border glass sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/astrologer')}
              className="text-muted-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display font-bold text-foreground">Remedy Services</h1>
              <p className="text-xs text-muted-foreground">Manage services and bookings</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'services' | 'bookings')}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-4">
            <div className="grid gap-6">
              <Card className="border border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Create Custom Remedy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        placeholder="Remedy title"
                        value={newRemedy.title}
                        onChange={(e) => handleNewRemedyChange('title', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Select
                        value={newRemedy.category}
                        onValueChange={(value) => handleNewRemedyChange('category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {remedyCategories.map((category) => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      rows={3}
                      placeholder="Short description for users"
                      value={newRemedy.description}
                      onChange={(e) => handleNewRemedyChange('description', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Image URL</label>
                      <Input
                        placeholder="https://..."
                        value={newRemedy.image}
                        onChange={(e) => handleNewRemedyChange('image', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Delivery Type</label>
                      <Select
                        value={newRemedy.delivery_type}
                        onValueChange={(value) => handleNewRemedyChange('delivery_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select delivery" />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Base Price</label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="1000"
                        value={newRemedy.base_price}
                        onChange={(e) => handleNewRemedyChange('base_price', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Duration (mins)</label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="60"
                        value={newRemedy.duration_minutes}
                        onChange={(e) => handleNewRemedyChange('duration_minutes', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">My Price</label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="My price"
                        value={newRemedy.my_price}
                        onChange={(e) => handleNewRemedyChange('my_price', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleCreateRemedy} disabled={isCreatingRemedy}>
                      {isCreatingRemedy ? 'Submitting...' : 'Create Remedy'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">My Services</h2>
                {myServices.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No services yet. Add from available remedies below.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {myServices.map((service) => {
                      const remedyTitle = (service.remedy_id as any)?.title || 'Remedy';
                      const remedyCategory = (service.remedy_id as any)?.category || '';
                      return (
                        <Card key={service._id} className="border border-border">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base">{remedyTitle}</CardTitle>
                                {remedyCategory && (
                                  <Badge className="mt-2" variant="secondary">{remedyCategory}</Badge>
                                )}
                              </div>
                              <Switch
                                checked={service.availability?.is_active}
                                onCheckedChange={(value) => handleToggleService(service._id, value)}
                              />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm text-muted-foreground mb-3">
                              {service.custom_pricing.length} service options
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Status</span>
                              <Badge variant={service.availability?.is_active ? 'default' : 'outline'}>
                                {service.availability?.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">Available Remedies</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {availableRemedies.map((remedy) => {
                    const existingService = myServiceByRemedyId.get(remedy._id);
                    return (
                      <Card key={remedy._id} className="border border-border">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{remedy.title}</CardTitle>
                              <Badge className="mt-2" variant="secondary">{remedy.category}</Badge>
                            </div>
                            {remedy.is_featured && (
                              <Badge className="bg-yellow-500 text-white">Featured</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {remedy.description}
                          </p>
                          <div className="flex items-center justify-between text-sm mb-4">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {remedy.duration_minutes} mins
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-green-600">
                              <IndianRupee className="w-4 h-4" />
                              {remedy.base_price}
                            </span>
                          </div>
                          <Button
                            className="w-full"
                            variant={existingService ? 'outline' : 'default'}
                            disabled={!!existingService}
                            onClick={() => handleSetupService(remedy)}
                          >
                            {existingService ? 'Already Added' : 'Add Service'}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="mt-4">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bookingsLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : bookings.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No bookings found for this status.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const update = bookingUpdates[booking._id] || {
                    status: booking.status,
                    response_type: booking.delivery?.content?.response_type || 'video',
                    text_content: booking.delivery?.content?.text_content || booking.delivery?.content?.report_content || '',
                    responseFile: null,
                    delivery_notes: booking.delivery?.content?.delivery_notes || '',
                    astrologer_notes: '',
                  };
                  const user = typeof booking.user_id === 'string' ? null : booking.user_id;
                  return (
                    <Card key={booking._id} className="border border-border">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <Badge className="mb-2" variant="secondary">{booking.remedy_id?.category || 'Remedy'}</Badge>
                            <CardTitle className="text-lg">{booking.remedy_id?.title || 'Remedy Booking'}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {user?.fullName || 'User'} • {booking.selected_service?.specialization_name}
                            </p>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {booking.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {booking.booking_details?.scheduled_start_time
                              ? format(new Date(booking.booking_details.scheduled_start_time), 'MMM dd, yyyy hh:mm a')
                              : 'Schedule not set'}
                          </div>
                          <div className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4" />
                            {booking.booking_details?.total_amount || 0}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Update Status</label>
                            <Select
                              value={update.status}
                              onValueChange={(value) => handleBookingUpdateChange(booking._id, 'status', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Astrologer Note</label>
                            <Input
                              placeholder="Message for user (optional)"
                                value={update.astrologer_notes || ''}
                              onChange={(e) => handleBookingUpdateChange(booking._id, 'astrologer_notes', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-4 border-t border-border pt-4">
                          <div className="text-sm text-muted-foreground">
                            Set status to "Completed" to enable response upload.
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Response Type</label>
                              <Select
                                value={update.response_type}
                                onValueChange={(value) => handleBookingUpdateChange(booking._id, 'response_type', value)}
                                disabled={update.status !== 'completed'}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select response type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="video">Video</SelectItem>
                                  <SelectItem value="pdf">PDF</SelectItem>
                                  <SelectItem value="text">Text</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Delivery Notes</label>
                              <Textarea
                                rows={2}
                                placeholder="Notes about the service"
                                value={update.delivery_notes || ''}
                                onChange={(e) => handleBookingUpdateChange(booking._id, 'delivery_notes', e.target.value)}
                                disabled={update.status !== 'completed'}
                              />
                            </div>
                          </div>

                          {update.response_type === 'text' ? (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Response Text</label>
                              <Textarea
                                rows={3}
                                placeholder="Write the response for the user"
                                value={update.text_content || ''}
                                onChange={(e) => handleBookingUpdateChange(booking._id, 'text_content', e.target.value)}
                                disabled={update.status !== 'completed'}
                              />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <label className="text-sm font-medium flex items-center gap-2">
                                <Video className="w-4 h-4" /> Upload File
                              </label>
                              <Input
                                type="file"
                                accept="video/*,application/pdf"
                                onChange={(e) => handleResponseFileChange(booking._id, e.target.files?.[0] || null)}
                                disabled={update.status !== 'completed'}
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <Button onClick={() => handleSaveBookingUpdate(booking)} className="gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Save Update
                          </Button>
                          {(booking.delivery?.content?.file_url || booking.delivery?.content?.video_url) && (
                            <Button
                              variant="outline"
                              className="gap-2"
                              onClick={() => window.open(resolveFileUrl(booking.delivery?.content?.file_url || booking.delivery?.content?.video_url), '_blank')}
                            >
                              <Video className="w-4 h-4" />
                              Open Video
                            </Button>
                          )}
                          {booking.messages?.length > 0 && (
                            <Badge variant="secondary" className="gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {booking.messages.length} messages
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AstrologerRemediesPage;

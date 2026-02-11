import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { remedyApi } from '@/services/remedyApi';
import { Remedy, AstrologerRemedyService, CreateBookingRequest } from '@/types/remedy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Calendar,
  Clock, 
  IndianRupee, 
  User,
  CreditCard,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const RemedyBookingPage = () => {
  const { remedyId, astrologerServiceId } = useParams<{ 
    remedyId: string; 
    astrologerServiceId: string; 
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get data from navigation state or fetch from API
  const [remedy] = useState<Remedy>(location.state?.remedy);
  const [astrologerService] = useState<AstrologerRemedyService>(location.state?.astrologerService);
  
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'razorpay'>('wallet');
  const [requirements, setRequirements] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  useEffect(() => {
    if (!remedy || !astrologerService) {
      // If no state data, redirect back
      navigate(`/user/remedies/${remedyId}`);
      return;
    }
    
    // Set default specialization
    if (astrologerService.custom_pricing.length > 0) {
      setSelectedSpecialization(astrologerService.custom_pricing[0].specialization_name);
    }
    
    // Set minimum date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduledDate(format(tomorrow, 'yyyy-MM-dd'));
  }, [remedy, astrologerService, remedyId, navigate]);

  const selectedPricing = astrologerService?.custom_pricing.find(
    p => p.specialization_name === selectedSpecialization
  );

  const handleRequirementChange = (fieldName: string, value: any, fieldType: string) => {
    setRequirements(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    // Check required fields
    remedy.requirements.forEach(req => {
      if (req.is_required && (!requirements[req.field_name] || requirements[req.field_name].toString().trim() === '')) {
        newErrors[req.field_name] = `${req.field_name} is required`;
      }
    });
    
    // Check specialization
    if (!selectedSpecialization) {
      newErrors.specialization = 'Please select a service type';
    }
    
    // Check date/time
    if (!scheduledDate) {
      newErrors.scheduledDate = 'Please select a date';
    }
    if (!scheduledTime) {
      newErrors.scheduledTime = 'Please select a time';
    }
    
    // Validate date is not in past
    if (scheduledDate && scheduledTime) {
      const selectedDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      if (selectedDateTime < new Date()) {
        newErrors.scheduledDate = 'Selected time cannot be in the past';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields correctly",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const bookingData: CreateBookingRequest = {
        astrologer_service_id: astrologerServiceId!,
        selected_service: {
          specialization_name: selectedSpecialization,
          price: selectedPricing!.my_price,
          duration_minutes: selectedPricing!.my_duration
        },
        user_requirements: remedy.requirements.map(req => ({
          field_name: req.field_name,
          field_value: requirements[req.field_name] || '',
          field_type: req.field_type
        })),
        scheduled_start_time: new Date(`${scheduledDate}T${scheduledTime}`).toISOString(),
        payment_method: paymentMethod
      };
      
      const response = await remedyApi.createBooking(bookingData);
      
      toast({
        title: "Booking Created!",
        description: "Your remedy booking has been created successfully",
      });
      
      // Navigate to booking details or user dashboard
      navigate(`/user/bookings/${response.data._id}`);
      
    } catch (error: any) {
      toast({
        title: "Booking Failed", 
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderField = (requirement: any) => {
    const fieldName = requirement.field_name;
    const fieldValue = requirements[fieldName] || '';
    const hasError = !!errors[fieldName];
    
    switch (requirement.field_type) {
      case 'text':
      case 'number':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {fieldName}
              {requirement.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type={requirement.field_type}
              placeholder={requirement.placeholder}
              value={fieldValue}
              onChange={(e) => handleRequirementChange(fieldName, e.target.value, requirement.field_type)}
              className={hasError ? 'border-red-500' : ''}
            />
            {requirement.description && (
              <p className="text-xs text-gray-600">{requirement.description}</p>
            )}
            {hasError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors[fieldName]}
              </p>
            )}
          </div>
        );
      
      case 'date':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {fieldName}
              {requirement.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="date"
              value={fieldValue}
              onChange={(e) => handleRequirementChange(fieldName, e.target.value, requirement.field_type)}
              className={hasError ? 'border-red-500' : ''}
            />
            {requirement.description && (
              <p className="text-xs text-gray-600">{requirement.description}</p>
            )}
            {hasError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors[fieldName]}
              </p>
            )}
          </div>
        );
      
      case 'select':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {fieldName}
              {requirement.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={fieldValue} onValueChange={(value) => handleRequirementChange(fieldName, value, requirement.field_type)}>
              <SelectTrigger className={hasError ? 'border-red-500' : ''}>
                <SelectValue placeholder={`Select ${fieldName}`} />
              </SelectTrigger>
              <SelectContent>
                {requirement.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {requirement.description && (
              <p className="text-xs text-gray-600">{requirement.description}</p>
            )}
            {hasError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors[fieldName]}
              </p>
            )}
          </div>
        );
      
      case 'textarea':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {fieldName}
              {requirement.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldName}
              placeholder={requirement.placeholder}
              value={fieldValue}
              onChange={(e) => handleRequirementChange(fieldName, e.target.value, requirement.field_type)}
              className={hasError ? 'border-red-500' : ''}
              rows={3}
            />
            {requirement.description && (
              <p className="text-xs text-gray-600">{requirement.description}</p>
            )}
            {hasError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors[fieldName]}
              </p>
            )}
          </div>
        );
      
      case 'file':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {fieldName}
              {requirement.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // For demo, just store file name
                  handleRequirementChange(fieldName, file.name, requirement.field_type);
                }
              }}
              className={hasError ? 'border-red-500' : ''}
              accept="image/*"
            />
            {requirement.description && (
              <p className="text-xs text-gray-600">{requirement.description}</p>
            )}
            {hasError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors[fieldName]}
              </p>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  if (!remedy || !astrologerService) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/user/remedies/${remedyId}`)}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Astrologer Selection
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Book Your Remedy Service</CardTitle>
                <p className="text-gray-600">Please fill the required information to complete your booking</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Service Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="specialization">
                      Select Service Type
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                      <SelectTrigger className={errors.specialization ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Choose service type" />
                      </SelectTrigger>
                      <SelectContent>
                        {astrologerService.custom_pricing.map((pricing) => (
                          <SelectItem key={pricing.specialization_name} value={pricing.specialization_name}>
                            <div className="flex justify-between items-center w-full">
                              <span>{pricing.specialization_name}</span>
                              <span className="ml-4 font-semibold">₹{pricing.my_price} ({pricing.my_duration} mins)</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.specialization && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.specialization}
                      </p>
                    )}
                  </div>

                  {/* Scheduling */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scheduledDate">
                        Preferred Date
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="scheduledDate"
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={format(new Date(), 'yyyy-MM-dd')}
                        className={errors.scheduledDate ? 'border-red-500' : ''}
                      />
                      {errors.scheduledDate && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.scheduledDate}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scheduledTime">
                        Preferred Time
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="scheduledTime"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className={errors.scheduledTime ? 'border-red-500' : ''}
                      />
                      {errors.scheduledTime && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.scheduledTime}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Requirements */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Required Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {remedy.requirements.map(renderField)}
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card 
                        className={`cursor-pointer transition-colors ${paymentMethod === 'wallet' ? 'ring-2 ring-green-500 bg-green-50' : ''}`}
                        onClick={() => setPaymentMethod('wallet')}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${paymentMethod === 'wallet' ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                            {paymentMethod === 'wallet' && <CheckCircle className="w-4 h-4 text-white" />}
                          </div>
                          <div>
                            <div className="font-medium">Wallet Payment</div>
                            <div className="text-sm text-gray-600">Pay from your wallet balance</div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card 
                        className={`cursor-pointer transition-colors ${paymentMethod === 'razorpay' ? 'ring-2 ring-green-500 bg-green-50' : ''}`}
                        onClick={() => setPaymentMethod('razorpay')}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${paymentMethod === 'razorpay' ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                            {paymentMethod === 'razorpay' && <CheckCircle className="w-4 h-4 text-white" />}
                          </div>
                          <div>
                            <div className="font-medium">Online Payment</div>
                            <div className="text-sm text-gray-600">UPI, Card, Net Banking</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating Booking...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Confirm Booking & Pay ₹{selectedPricing?.my_price || 0}
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Remedy Info */}
                <div>
                  <Badge className="mb-2 bg-green-100 text-green-800">
                    {remedy.category}
                  </Badge>
                  <h3 className="font-semibold">{remedy.title}</h3>
                </div>

                {/* Astrologer Info */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <img 
                    src={astrologerService.astrologer_id.personalDetails.profileImage || '/placeholder-avatar.jpg'} 
                    alt={astrologerService.astrologer_id.personalDetails.name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(astrologerService.astrologer_id.personalDetails.name)}&background=059669&color=fff`;
                    }}
                  />
                  <div>
                    <div className="font-medium">{astrologerService.astrologer_id.personalDetails.name}</div>
                    <div className="text-sm text-gray-600">
                      {astrologerService.experience.years_experience} years experience
                    </div>
                  </div>
                </div>

                {/* Service Details */}
                {selectedPricing && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service:</span>
                      <span className="font-medium">{selectedSpecialization}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{selectedPricing.my_duration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date & Time:</span>
                      <span className="font-medium">
                        {scheduledDate && scheduledTime ? 
                          `${format(new Date(scheduledDate), 'MMM dd, yyyy')} at ${scheduledTime}` :
                          'Not selected'
                        }
                      </span>
                    </div>
                    <hr />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Amount:</span>
                      <span className="text-green-600 flex items-center">
                        <IndianRupee className="w-5 h-5" />
                        {selectedPricing.my_price}
                      </span>
                    </div>
                  </div>
                )}

                {/* Features */}
                <div className="pt-4 border-t">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>100% Authentic Rituals</span>
                    </div>
                  
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Prasad Delivered Home</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemedyBookingPage;
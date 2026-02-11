import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { remedyApi } from '@/services/remedyApi';
import { RemedyBooking } from '@/types/remedy';
import { config } from '@/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Video } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const resolveFileUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${config.api.baseURL.replace(/\/$/, '')}${url}`;
};

const BookingResponsePage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<RemedyBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const [detailsRes, responseRes] = await Promise.all([
        remedyApi.getBookingById(bookingId!),
        remedyApi.getBookingResponse(bookingId!),
      ]);

      const merged: RemedyBooking = {
        ...detailsRes.data,
        delivery: responseRes.data.delivery,
        status: responseRes.data.status,
      };

      setBooking(merged);
    } catch (error: any) {
      toast({
        title: 'Failed to load booking',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="py-10 px-8 text-center">
            <div className="text-lg font-semibold">Booking not found</div>
            <Button className="mt-4" onClick={() => navigate('/user/bookings')}>
              Back to Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fileUrl = resolveFileUrl(booking.delivery?.content?.file_url || booking.delivery?.content?.video_url);
  const responseType = booking.delivery?.content?.response_type;
  const isPdf = responseType === 'pdf' || booking.delivery?.content?.file_mime?.includes('pdf') || fileUrl.endsWith('.pdf');

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/user/bookings')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Remedy Response</h1>
            <p className="text-sm text-muted-foreground">Booking #{booking._id}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{booking.remedy_id?.title || 'Remedy'}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {booking.selected_service?.specialization_name || 'Service'}
                </p>
              </div>
              <Badge variant="outline" className="capitalize">
                {booking.status.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!booking.delivery || booking.delivery.status !== 'delivered' ? (
              <div className="text-sm text-muted-foreground">
                Response not delivered yet.
              </div>
            ) : (
              <>
                {booking.delivery?.content?.text_content && (
                  <div className="text-sm bg-muted p-3 rounded-md">
                    {booking.delivery.content.text_content}
                  </div>
                )}

                {fileUrl && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.open(fileUrl, '_blank')}
                  >
                    {isPdf ? <FileText className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    {isPdf ? 'Download PDF' : 'Watch Video'}
                  </Button>
                )}

                {booking.delivery?.content?.delivery_notes && (
                  <div className="text-sm text-muted-foreground">
                    Notes: {booking.delivery.content.delivery_notes}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingResponsePage;

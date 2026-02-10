import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { astrologerApi } from '@/services/api';

interface CallPackage {
  _id: string;
  duration: number;
  price: number;
  discountPercentage: number;
  isActive: boolean;
}

interface PackageFormModalProps {
  package: CallPackage | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function PackageFormModal({ package: pkg, onClose, onSaved }: PackageFormModalProps) {
  const { toast } = useToast();
  const [duration, setDuration] = useState(pkg?.duration || 15);
  const [price, setPrice] = useState(pkg?.price || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [astrologerRate, setAstrologerRate] = useState(0);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    // Fetch astrologer's per-minute rate
    fetchAstrologerRate();
  }, []);

  useEffect(() => {
    // Calculate discount percentage when duration or price changes
    if (astrologerRate > 0 && duration > 0 && price > 0) {
      const regularPrice = duration * astrologerRate;
      const discount = ((regularPrice - price) / regularPrice) * 100;
      setDiscountPercentage(Math.max(0, Math.round(discount)));
      
      // Validate price
      if (price > regularPrice) {
        setValidationError(`Price cannot exceed ₹${regularPrice} (${duration} × ₹${astrologerRate})`);
      } else {
        setValidationError('');
      }
    }
  }, [duration, price, astrologerRate]);

  const fetchAstrologerRate = async () => {
    try {
      // Assuming there's an endpoint to get astrologer profile
      // For now, we'll use a default rate or fetch from user context
      // This should be replaced with actual API call
      setAstrologerRate(50); // Default rate, should be fetched from API
    } catch (error) {
      console.error('Failed to fetch astrologer rate:', error);
      setAstrologerRate(50); // Fallback rate
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validationError) {
      toast({
        title: 'Validation Error',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    if (duration <= 0 || price <= 0) {
      toast({
        title: 'Invalid Input',
        description: 'Duration and price must be greater than zero',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const packageData = {
        duration,
        price,
      };

      if (pkg) {
        // Update existing package
        await astrologerApi.updatePackage(pkg._id, packageData);
        toast({
          title: 'Package updated',
          description: 'Your package has been updated successfully.',
        });
      } else {
        // Create new package
        await astrologerApi.createPackage(packageData);
        toast({
          title: 'Package created',
          description: 'Your new package has been created successfully.',
        });
      }
      
      onSaved();
    } catch (error: any) {
      toast({
        title: pkg ? 'Failed to update package' : 'Failed to create package',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-display font-bold text-foreground">
            {pkg ? 'Edit Package' : 'Create Package'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Duration Input */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              step="1"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              placeholder="e.g., 15, 30, 60"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              How long will this package last?
            </p>
          </div>

          {/* Price Input */}
          <div className="space-y-2">
            <Label htmlFor="price">Price (₹)</Label>
            <Input
              id="price"
              type="number"
              min="1"
              step="1"
              value={price}
              onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
              placeholder="e.g., 99, 179, 299"
              className="w-full"
            />
            {validationError && (
              <p className="text-xs text-destructive">{validationError}</p>
            )}
            {!validationError && astrologerRate > 0 && duration > 0 && (
              <p className="text-xs text-muted-foreground">
                Regular price: ₹{duration * astrologerRate} ({duration} × ₹{astrologerRate}/min)
              </p>
            )}
          </div>

          {/* Discount Preview */}
          {discountPercentage > 0 && !validationError && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Discount Preview</span>
                <span className="text-2xl font-bold text-primary">{discountPercentage}% OFF</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Customers save ₹{(duration * astrologerRate) - price} with this package
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gold-gradient text-primary-foreground"
              disabled={isSubmitting || !!validationError}
            >
              {isSubmitting ? 'Saving...' : pkg ? 'Update Package' : 'Create Package'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { astrologerApi } from '@/services/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import PackageFormModal from '@/components/PackageFormModal';

interface CallPackage {
  _id: string;
  duration: number;
  price: number;
  discountPercentage: number;
  isActive: boolean;
  createdAt: string;
}

export default function PackageManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [packages, setPackages] = useState<CallPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CallPackage | null>(null);
  const [deletePackageId, setDeletePackageId] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const data = await astrologerApi.getPackages();
      setPackages(data.packages || []);
    } catch (error: any) {
      toast({
        title: 'Failed to load packages',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPackage = () => {
    setEditingPackage(null);
    setShowFormModal(true);
  };

  const handleEditPackage = (pkg: CallPackage) => {
    setEditingPackage(pkg);
    setShowFormModal(true);
  };

  const handleDeletePackage = async (packageId: string) => {
    try {
      await astrologerApi.deletePackage(packageId);
      toast({
        title: 'Package deleted',
        description: 'The package has been removed successfully.',
      });
      fetchPackages();
    } catch (error: any) {
      toast({
        title: 'Failed to delete package',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeletePackageId(null);
    }
  };

  const handlePackageSaved = () => {
    setShowFormModal(false);
    setEditingPackage(null);
    fetchPackages();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
              <Package className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-foreground">Package Management</h1>
              <p className="text-xs text-muted-foreground">Manage your call packages</p>
            </div>
          </div>
          <Button
            onClick={handleAddPackage}
            className="gold-gradient text-primary-foreground gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Package
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No packages yet</h3>
            <p className="text-muted-foreground mb-6">
              Create call packages to offer discounted rates to your clients
            </p>
            <Button
              onClick={handleAddPackage}
              className="gold-gradient text-primary-foreground gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Your First Package
            </Button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => (
                  <TableRow key={pkg._id}>
                    <TableCell className="font-medium">{pkg.duration} minutes</TableCell>
                    <TableCell>₹{pkg.price}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary">
                        {pkg.discountPercentage}% off
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          pkg.isActive
                            ? 'bg-green-500/15 text-green-600'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {pkg.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditPackage(pkg)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletePackageId(pkg._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      {/* Package Form Modal */}
      {showFormModal && (
        <PackageFormModal
          package={editingPackage}
          onClose={() => {
            setShowFormModal(false);
            setEditingPackage(null);
          }}
          onSaved={handlePackageSaved}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePackageId} onOpenChange={() => setDeletePackageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Package</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this package? This action cannot be undone.
              Existing calls using this package will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePackageId && handleDeletePackage(deletePackageId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

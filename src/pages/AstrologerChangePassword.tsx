import { useState } from 'react';
import { astrologerApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import AstrologerLayout from '@/components/AstrologerLayout';

export default function AstrologerChangePassword() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await astrologerApi.changePassword(currentPassword, newPassword);
      toast({ title: 'Password changed successfully' });
      navigate('/astrologer/dashboard');
    } catch (e: any) {
      toast({ title: 'Failed to change password', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AstrologerLayout>
      <header className="border-b border-border glass sticky top-0 z-40">
        <div className="px-6 h-16 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-foreground">Change Password</h1>
            <p className="text-xs text-muted-foreground">Update your account password</p>
          </div>
        </div>
      </header>

      <main className="px-6 py-6">
        <div className="max-w-xl space-y-4">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current Password</Label>
              <Input id="current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New Password</Label>
              <Input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm New Password</Label>
              <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => navigate('/astrologer/dashboard')}>Cancel</Button>
              <Button className="gold-gradient text-primary-foreground" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </AstrologerLayout>
  );
}

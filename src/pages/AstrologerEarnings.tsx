import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, Phone, Clock, Star, ChevronLeft, TrendingUp, Wallet, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { astrologerApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EarningsSummary {
  totalEarnings: number;
  grossEarnings: number;
  netEarnings: number;
  totalCalls: number;
  averageDuration: number;
  averageRating: number;
  acceptanceRate: number;
}

interface EarningsData {
  summary: EarningsSummary;
  breakdown: Array<{
    label: string;
    earnings: number;
    calls: number;
  }>;
  period: string;
}

interface WalletSummary {
  balance: number;
  transactions: Array<{
    _id: string;
    amount: number;
    type: 'Credit' | 'Debit';
    description: string;
    balanceAfter: number;
    createdAt: string;
  }>;
  withdrawals: Array<{
    _id: string;
    amount: number;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Processed';
    accountDetails: {
      bankName: string;
      accountNumber: string;
      ifscCode: string;
      accountHolderName: string;
    };
    createdAt: string;
    processedAt?: string;
    adminComments?: string;
  }>;
}

interface WithdrawalFormData {
  amount: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
}

export default function AstrologerEarnings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [walletData, setWalletData] = useState<WalletSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState<WithdrawalFormData>({
    amount: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
  });

  useEffect(() => {
    fetchEarnings();
    fetchWalletData();
  }, [selectedPeriod]);

  const fetchEarnings = async () => {
    setIsLoading(true);
    try {
      const response = await astrologerApi.getEarnings(selectedPeriod);
      const data = (response && typeof response === 'object' && 'data' in response)
        ? (response as any).data
        : response;
      const summary = data?.summary || {
        totalEarnings: 0,
        grossEarnings: 0,
        netEarnings: 0,
        totalCalls: 0,
        averageDuration: 0,
        averageRating: 0,
        acceptanceRate: 0,
      };
      const breakdown = Array.isArray(data?.breakdown) ? data.breakdown : [];
      const period = data?.period || selectedPeriod;
      setEarningsData({ summary, breakdown, period });
    } catch (error: any) {
      toast({
        title: 'Failed to fetch earnings',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWalletData = async () => {
    try {
      const response = await astrologerApi.getWalletSummary();
      const data = (response && typeof response === 'object' && 'data' in response)
        ? (response as any).data
        : response;
      const balance = typeof data?.balance === 'number' ? data.balance : 0;
      const transactions = Array.isArray(data?.transactions) ? data.transactions : [];
      const withdrawals = Array.isArray(data?.withdrawals) ? data.withdrawals : [];
      setWalletData({ balance, transactions, withdrawals });
    } catch (error: any) {
      toast({
        title: 'Failed to fetch wallet data',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    }
  };

  const handleWithdrawalSubmit = async () => {
    const amount = parseFloat(withdrawalForm.amount);
    
    if (!amount || amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid withdrawal amount',
        variant: 'destructive',
      });
      return;
    }

    if (!walletData || amount > walletData.balance) {
      toast({
        title: 'Insufficient balance',
        description: 'Withdrawal amount exceeds available balance',
        variant: 'destructive',
      });
      return;
    }

    if (!withdrawalForm.bankName || !withdrawalForm.accountNumber || !withdrawalForm.ifscCode || !withdrawalForm.accountHolderName) {
      toast({
        title: 'Incomplete details',
        description: 'Please fill in all bank account details',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingWithdrawal(true);
    try {
      await astrologerApi.requestWithdrawal({
        amount,
        accountDetails: {
          bankName: withdrawalForm.bankName,
          accountNumber: withdrawalForm.accountNumber,
          ifscCode: withdrawalForm.ifscCode,
          accountHolderName: withdrawalForm.accountHolderName,
        },
      });

      toast({
        title: 'Withdrawal request submitted',
        description: 'Your request will be processed within 3-5 business days',
      });

      setShowWithdrawalDialog(false);
      setWithdrawalForm({
        amount: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        accountHolderName: '',
      });
      fetchWalletData();
    } catch (error: any) {
      toast({
        title: 'Failed to submit withdrawal',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
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
              onClick={() => navigate('/astrologer/dashboard')}
              className="text-muted-foreground"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-foreground">Earnings Dashboard</h1>
              <p className="text-xs text-muted-foreground">{user?.name || 'Astrologer'}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Period Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'daily', 'weekly', 'monthly'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
              className={selectedPeriod === period ? 'gold-gradient text-primary-foreground' : ''}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Button>
          ))}
        </div>

        {/* Earnings Overview Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-xl animate-shimmer" />
            ))}
          </div>
        ) : earningsData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Earnings Card */}
            <div className="bg-card border border-border rounded-xl p-5 hover:card-glow transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  ₹{earningsData.summary.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Net after commission
                </p>
              </div>
            </div>

            {/* Total Calls Card */}
            <div className="bg-card border border-border rounded-xl p-5 hover:card-glow transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Calls</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {earningsData.summary.totalCalls}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {earningsData.summary.acceptanceRate}% acceptance rate
                </p>
              </div>
            </div>

            {/* Average Call Duration Card */}
            <div className="bg-card border border-border rounded-xl p-5 hover:card-glow transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Call Duration</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {formatDuration(earningsData.summary.averageDuration)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Per consultation
                </p>
              </div>
            </div>

            {/* Average Rating Card */}
            <div className="bg-card border border-border rounded-xl p-5 hover:card-glow transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/15 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Average Rating</p>
                <p className="text-2xl font-display font-bold text-foreground flex items-center gap-1">
                  {earningsData.summary.averageRating > 0 ? earningsData.summary.averageRating : 'N/A'}
                  {earningsData.summary.averageRating > 0 && (
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  From rated calls
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No earnings data available</p>
          </div>
        )}

        {/* Additional Info Section */}
        {earningsData && !isLoading && (
          <>
            {/* Wallet Balance and Payout Section */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Wallet Balance
                </h2>
                <Button
                  onClick={() => setShowWithdrawalDialog(true)}
                  disabled={!walletData || walletData.balance <= 0}
                  className="gold-gradient text-primary-foreground"
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Request Payout
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-primary/5 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                  <p className="text-3xl font-display font-bold text-foreground">
                    ₹{walletData?.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Ready for withdrawal
                  </p>
                </div>

                {/* Recent Withdrawals */}
                <div className="bg-accent/5 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Recent Withdrawals</p>
                  {walletData && walletData.withdrawals.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {walletData.withdrawals.slice(0, 3).map((withdrawal) => (
                        <div key={withdrawal._id} className="flex items-center justify-between text-sm">
                          <span className="text-foreground">₹{withdrawal.amount.toLocaleString('en-IN')}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            withdrawal.status === 'Processed' ? 'bg-green-500/20 text-green-500' :
                            withdrawal.status === 'Approved' ? 'bg-blue-500/20 text-blue-500' :
                            withdrawal.status === 'Rejected' ? 'bg-red-500/20 text-red-500' :
                            'bg-yellow-500/20 text-yellow-500'
                          }`}>
                            {withdrawal.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No withdrawal history</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-display font-semibold text-foreground mb-4">Earnings Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Gross Earnings</p>
                  <p className="text-xl font-semibold text-foreground">
                    ₹{earningsData.summary.grossEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Platform Commission</p>
                  <p className="text-xl font-semibold text-foreground">
                    ₹{(earningsData.summary.grossEarnings - earningsData.summary.netEarnings).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Net Earnings</p>
                  <p className="text-xl font-semibold text-primary">
                    ₹{earningsData.summary.netEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Earnings Chart */}
            {earningsData.breakdown && earningsData.breakdown.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="font-display font-semibold text-foreground mb-4">
                  {selectedPeriod === 'daily' ? 'Hourly' : selectedPeriod === 'weekly' ? 'Daily' : selectedPeriod === 'monthly' ? 'Weekly' : 'Overall'} Earnings
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={earningsData.breakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="label" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                      formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Earnings']}
                    />
                    <Legend 
                      wrapperStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                      name="Earnings (₹)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Calls Chart */}
            {earningsData.breakdown && earningsData.breakdown.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="font-display font-semibold text-foreground mb-4">
                  {selectedPeriod === 'daily' ? 'Hourly' : selectedPeriod === 'weekly' ? 'Daily' : selectedPeriod === 'monthly' ? 'Weekly' : 'Overall'} Calls
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={earningsData.breakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="label" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                      formatter={(value: number) => [value, 'Calls']}
                    />
                    <Legend 
                      wrapperStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar 
                      dataKey="calls" 
                      fill="hsl(var(--accent))" 
                      name="Number of Calls"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </main>

      {/* Withdrawal Dialog */}
      <Dialog open={showWithdrawalDialog} onOpenChange={setShowWithdrawalDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
            <DialogDescription>
              Enter the amount and bank account details for your withdrawal. Payouts are processed within 3-5 business days.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Withdrawal Amount</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={withdrawalForm.amount}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                  className="pl-9"
                  min="0"
                  step="0.01"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Available: ₹{walletData?.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountHolderName">Account Holder Name</Label>
              <Input
                id="accountHolderName"
                placeholder="Enter account holder name"
                value={withdrawalForm.accountHolderName}
                onChange={(e) => setWithdrawalForm({ ...withdrawalForm, accountHolderName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="Enter bank name"
                value={withdrawalForm.bankName}
                onChange={(e) => setWithdrawalForm({ ...withdrawalForm, bankName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                placeholder="Enter account number"
                value={withdrawalForm.accountNumber}
                onChange={(e) => setWithdrawalForm({ ...withdrawalForm, accountNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ifscCode">IFSC Code</Label>
              <Input
                id="ifscCode"
                placeholder="Enter IFSC code"
                value={withdrawalForm.ifscCode}
                onChange={(e) => setWithdrawalForm({ ...withdrawalForm, ifscCode: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWithdrawalDialog(false)}
              disabled={isSubmittingWithdrawal}
            >
              Cancel
            </Button>
            <Button
              onClick={handleWithdrawalSubmit}
              disabled={isSubmittingWithdrawal}
              className="gold-gradient text-primary-foreground"
            >
              {isSubmittingWithdrawal ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

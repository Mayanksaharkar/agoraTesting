import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Video, Clock, Calendar, Filter, ChevronLeft, ChevronRight, Search, IndianRupee } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { astrologerApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface CallHistoryItem {
  _id: string;
  userId: {
    _id: string;
    fullName?: string;
    profilePhoto?: string;
  };
  callType: 'audio' | 'video';
  status: string;
  duration: number;
  astrologerEarnings: number;
  initiatedAt: string;
  endedAt?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
}

export default function AstrologerCallHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [calls, setCalls] = useState<CallHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
    search: '',
  });

  useEffect(() => {
    fetchCallHistory();
  }, [pagination.currentPage, filters.status]);

  const fetchCallHistory = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: pagination.currentPage,
        limit: pagination.limit,
      };

      if (filters.status !== 'all') {
        params.status = filters.status;
      }
      if (filters.startDate) {
        params.startDate = filters.startDate;
      }
      if (filters.endDate) {
        params.endDate = filters.endDate;
      }

      const data = await astrologerApi.getCallHistory(params);
      setCalls(data.data?.calls || []);
      setPagination(data.data?.pagination || pagination);
    } catch (error) {
      console.error('Failed to fetch call history:', error);
      setCalls([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyDateFilter = () => {
    setPagination({ ...pagination, currentPage: 1 });
    fetchCallHistory();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ended':
        return 'bg-green-500/10 text-green-500';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-500/10 text-red-500';
      case 'no_answer':
        return 'bg-yellow-500/10 text-yellow-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const filteredCalls = calls.filter((call) => {
    if (!filters.search) return true;
    const userName = call.userId?.fullName || '';
    return userName.toLowerCase().includes(filters.search.toLowerCase());
  });

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
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display font-bold text-foreground">Call History</h1>
              <p className="text-xs text-muted-foreground">View your past consultations</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search user..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-9"
                />
              </div>

              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ended">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                placeholder="Start Date"
              />

              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                placeholder="End Date"
              />
            </div>

            {(filters.startDate || filters.endDate) && (
              <div className="mt-4 flex justify-end">
                <Button onClick={handleApplyDateFilter} size="sm">
                  Apply Date Filter
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 rounded-xl animate-shimmer" />
            ))}
          </div>
        ) : filteredCalls.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <Phone className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="font-display text-xl text-foreground mb-2">No Call History</h2>
              <p className="text-muted-foreground">Your consultation history will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {filteredCalls.map((call) => (
                <Card
                  key={call._id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => navigate(`/astrologer/calls/${call._id}/details`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* User Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {call.userId?.profilePhoto ? (
                          <img
                            src={call.userId.profilePhoto}
                            alt="User"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          (call.userId?.fullName?.[0] || 'U')
                        )}
                      </div>

                      {/* Call Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {call.userId?.fullName || 'User'}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              {call.callType === 'video' ? (
                                <Video className="w-4 h-4" />
                              ) : (
                                <Phone className="w-4 h-4" />
                              )}
                              <span className="capitalize">{call.callType} Call</span>
                            </div>
                          </div>
                          <Badge className={getStatusColor(call.status)}>
                            {call.status.replace('_', ' ')}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {format(new Date(call.initiatedAt), 'MMM dd, yyyy')}
                            </span>
                          </div>

                          {call.duration > 0 && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDuration(call.duration)}</span>
                            </div>
                          )}

                          {call.status === 'ended' && call.astrologerEarnings > 0 && (
                            <div className="flex items-center gap-1 font-semibold text-green-600">
                              <IndianRupee className="w-4 h-4" />
                              <span>{call.astrologerEarnings.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} calls
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })
                    }
                    disabled={pagination.currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })
                    }
                    disabled={pagination.currentPage === pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

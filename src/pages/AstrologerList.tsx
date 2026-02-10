import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Phone, Video, Clock, Languages, Sparkles, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { userApi } from '@/services/api';
import { cn } from '@/lib/utils';
import ChatNavLink from '@/components/ChatNavLink';

interface Astrologer {
  _id: string;
  personalDetails: {
    pseudonym?: string;
    profileImage?: string;
    about?: string;
    experience?: number;
    languages?: string[];
    skills?: string[];
  };
  ratings: {
    average: number;
    count: number;
  };
  availability: {
    status: 'online' | 'busy' | 'offline';
  };
  callSettings: {
    audioCallRate: number;
    videoCallRate: number;
    acceptAudioCalls: boolean;
    acceptVideoCalls: boolean;
  };
}

export default function AstrologerList() {
  const navigate = useNavigate();
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [filteredAstrologers, setFilteredAstrologers] = useState<Astrologer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'busy' | 'offline'>('all');

  useEffect(() => {
    fetchAstrologers();
  }, []);

  useEffect(() => {
    filterAstrologers();
  }, [searchQuery, statusFilter, astrologers]);

  const fetchAstrologers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch from API
      const response = await userApi.getAllAstrologers();
      // API returns array directly, not wrapped in object
      const astrologerList = Array.isArray(response) ? response : [];
      setAstrologers(astrologerList);
      setFilteredAstrologers(astrologerList);
    } catch (err: any) {
      console.error('Failed to fetch astrologers:', err);
      setError(err.message || 'Failed to load astrologers');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAstrologers = () => {
    let filtered = [...astrologers];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (astrologer) =>
          astrologer.personalDetails?.pseudonym?.toLowerCase().includes(query) ||
          astrologer.personalDetails?.skills?.some((skill) => skill.toLowerCase().includes(query)) ||
          astrologer.personalDetails?.languages?.some((lang) => lang.toLowerCase().includes(query))
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((astrologer) => astrologer.availability?.status === statusFilter);
    }

    setFilteredAstrologers(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Available';
      case 'busy':
        return 'In Call';
      case 'offline':
        return 'Offline';
      default:
        return 'Offline';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchAstrologers} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border glass sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="font-display font-bold text-xl text-foreground">Find Your Astrologer</h1>
          </div>
          <div className="flex items-center gap-2">
            <ChatNavLink />
            <Button variant="ghost" onClick={() => navigate('/user')}>
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, skills, or languages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter:</span>
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All ({astrologers.length})
            </Button>
            <Button
              variant={statusFilter === 'online' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('online')}
            >
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
              Available ({astrologers.filter((a) => a.availability?.status === 'online').length})
            </Button>
            <Button
              variant={statusFilter === 'busy' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('busy')}
            >
              <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
              Busy ({astrologers.filter((a) => a.availability?.status === 'busy').length})
            </Button>
            <Button
              variant={statusFilter === 'offline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('offline')}
            >
              <span className="w-2 h-2 rounded-full bg-gray-500 mr-2" />
              Offline ({astrologers.filter((a) => a.availability?.status === 'offline').length})
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredAstrologers.length} of {astrologers.length} astrologers
          </p>
        </div>

        {/* Astrologer Grid */}
        {filteredAstrologers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No astrologers found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAstrologers.map((astrologer) => (
              <div
                key={astrologer._id}
                className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate(`/user/astrologer/${astrologer._id}`)}
              >
                {/* Card Header */}
                <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5">
                  <div className="absolute -bottom-12 left-6">
                    <div className="relative">
                      <img
                        src={astrologer.personalDetails?.profileImage || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                        alt={astrologer.personalDetails?.pseudonym || 'Astrologer'}
                        className="w-24 h-24 rounded-full border-4 border-card object-cover"
                      />
                      <span
                        className={cn(
                          'absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-card',
                          getStatusColor(astrologer.availability?.status || 'offline')
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="pt-14 px-6 pb-6">
                  {/* Name and Status */}
                  <div className="mb-3">
                    <h3 className="font-display font-bold text-lg text-foreground mb-1">
                      {astrologer.personalDetails?.pseudonym || 'Astrologer'}
                    </h3>
                    <Badge variant={astrologer.availability?.status === 'online' ? 'default' : 'secondary'}>
                      {getStatusText(astrologer.availability?.status || 'offline')}
                    </Badge>
                  </div>

                  {/* Rating */}
                  {astrologer.ratings && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-foreground">
                          {astrologer.ratings.average?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({astrologer.ratings.count || 0} reviews)
                      </span>
                    </div>
                  )}

                  {/* Experience */}
                  {astrologer.personalDetails?.experience && (
                    <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{astrologer.personalDetails.experience} years experience</span>
                    </div>
                  )}

                  {/* Skills */}
                  {astrologer.personalDetails?.skills && astrologer.personalDetails.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {astrologer.personalDetails.skills.slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {astrologer.personalDetails.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{astrologer.personalDetails.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {astrologer.personalDetails?.languages && astrologer.personalDetails.languages.length > 0 && (
                    <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                      <Languages className="w-4 h-4" />
                      <span>{astrologer.personalDetails.languages.join(', ')}</span>
                    </div>
                  )}

                  {/* Call Rates */}
                  {astrologer.callSettings && (
                    <div className="flex items-center justify-between mb-4 p-3 bg-secondary rounded-lg">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">
                          ₹{astrologer.callSettings.audioCallRate || 0}/min
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">
                          ₹{astrologer.callSettings.videoCallRate || 0}/min
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    className="w-full"
                    disabled={astrologer.availability?.status === 'offline'}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/user/astrologer/${astrologer._id}`);
                    }}
                  >
                    {astrologer.availability?.status === 'online' ? 'Start Consultation' : 'View Profile'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

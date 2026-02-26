import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Search, Sparkles, Star, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userApi } from '@/services/api';
import { getSocket } from '@/services/socket';
import { TOPICS } from '@/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SessionCard from '@/components/SessionCard';
import UserSidebar from '@/components/UserSidebar';

interface LiveSession {
  _id: string;
  title: string;
  description?: string;
  topic?: string;
  status: string;
  actualStartTime?: string;
  astrologerId?: {
    _id: string;
    personalDetails?: {
      name?: string;
      pseudonym?: string;
      profileImage?: string;
    };
    ratings?: {
      average: number;
      total: number;
    };
  };
  currentViewers?: number;
  stats?: {
    totalViewers: number;
    totalLikes: number;
  };
}

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [topic, setTopic] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSessions();
  }, [topic]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewSession = (data: any) => {
      fetchSessions();
    };

    socket.on('new_live_session', onNewSession);
    return () => { socket.off('new_live_session', onNewSession); };
  }, []);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const data = await userApi.getActiveSessions(topic);
      setSessions(data.sessions || []);
    } catch {
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSessions = sessions.filter((s) =>
    !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <UserSidebar />

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="border-b border-border glass sticky top-0 z-40">
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="font-display font-bold text-foreground">Live Sessions</h1>
                <p className="text-xs text-muted-foreground">Discover live astrology sessions</p>
              </div>
            </div>
          </div>
        </header>

        <main className="px-6 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger className="w-40 bg-secondary border-border">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOPICS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sessions Grid */}
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-xl animate-shimmer" />
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-20">
            <Star className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="font-display text-xl text-foreground mb-2">No Live Sessions</h2>
            <p className="text-muted-foreground">Check back later for live readings!</p>
            <Button onClick={fetchSessions} variant="outline" className="mt-4">Refresh</Button>
          </div>
        ) : (
          <>
            {/* Remedy Flow Demo Section */}
            <div className="mb-8 p-6 rounded-xl border border-border bg-secondary">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    🔮 Try Our New Remedy Booking Flow!
                  </h3>
                  <p className="text-muted-foreground">
                    Book personalized remedy services with expert astrologers
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate('/user/remedies')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Browse Remedies
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/user/bookings')}
                    className="border-border text-foreground hover:bg-secondary"
                  >
                    My Bookings
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-3 bg-card rounded-lg border">
                  <div className="text-2xl mb-1">🕉️</div>
                  <div className="font-medium">VIP E-Pooja</div>
                  <div className="text-muted-foreground">Starting ₹1199</div>
                </div>
                <div className="text-center p-3 bg-card rounded-lg border">
                  <div className="text-2xl mb-1">✋</div>
                  <div className="font-medium">Palmistry</div>
                  <div className="text-muted-foreground">Starting ₹699</div>
                </div>
                <div className="text-center p-3 bg-card rounded-lg border">
                  <div className="text-2xl mb-1">💼</div>
                  <div className="font-medium">Career</div>
                  <div className="text-muted-foreground">Starting ₹599</div>
                </div>
                <div className="text-center p-3 bg-card rounded-lg border">
                  <div className="text-2xl mb-1">📝</div>
                  <div className="font-medium">Name Correction</div>
                  <div className="text-muted-foreground">Starting ₹799</div>
                </div>
              </div>
            </div>
            
            {/* Live Sessions Grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSessions.map((session) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  onClick={() => navigate(`/user/live/${session._id}`)}
                />
              ))}
            </div>
          </>
        )}
        </main>
      </div>
    </div>
  );
}

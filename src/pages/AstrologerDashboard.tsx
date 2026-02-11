import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Eye, Heart, MessageCircle, Clock, Plus, Play, X, BarChart3, LogOut, Phone, Package, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { astrologerApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import CreateSessionModal from '@/components/CreateSessionModal';
import StatsWidget from '@/components/StatsWidget';
import IncomingCallNotification from '@/components/IncomingCallNotification';
import AvailabilityToggle from '@/components/AvailabilityToggle';
import { useIncomingCalls } from '@/hooks/useIncomingCalls';
import { useAvailability } from '@/hooks/useAvailability';
import ChatNavLink from '@/components/ChatNavLink';

interface Session {
  _id: string;
  title: string;
  description?: string;
  topic?: string;
  status: string;
  scheduledStartTime?: string;
  actualStartTime?: string;
  stats: {
    totalViewers: number;
    peakViewers: number;
    totalMessages: number;
    totalLikes: number;
  };
  videoConfig?: any;
}

export default function AstrologerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState('scheduled');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [overallStats, setOverallStats] = useState<any>(null);
  
  // Incoming call management
  const { incomingCall, isProcessing, acceptCall, rejectCall } = useIncomingCalls();
  
  // Availability management
  const { status: availabilityStatus, updateStatus: updateAvailabilityStatus } = useAvailability();

  useEffect(() => {
    fetchSessions(activeTab);
    fetchStats();
  }, [activeTab]);

  const fetchSessions = async (status: string) => {
    setIsLoading(true);
    try {
      const data = await astrologerApi.getSessions(status);
      setSessions(data.sessions || []);
    } catch {
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await astrologerApi.getStats('today');
      setOverallStats(data.stats);
    } catch {
      // stats not critical
    }
  };

  const handleGoLive = (session: Session) => {
    navigate(`/astrologer/live/${session._id}`, { state: { session } });
  };

  const handleCancel = async (sessionId: string) => {
    try {
      await astrologerApi.cancelSession(sessionId);
      toast({ title: 'Session cancelled' });
      fetchSessions(activeTab);
    } catch {
      toast({ title: 'Failed to cancel', variant: 'destructive' });
    }
  };

  const handleSessionCreated = () => {
    setShowCreateModal(false);
    fetchSessions('scheduled');
    toast({ title: 'Session scheduled!' });
  };

  const handleAcceptCall = async () => {
    try {
      const callData = await acceptCall();
      // Navigate to call page with call data
      if (callData) {
        // Store Agora credentials in localStorage for InCallUI to use
        if (callData.data?.agora) {
          console.log('[AstrologerDashboard] Storing Agora credentials:', callData.data.agora);
          localStorage.setItem(`agora_${incomingCall?.callId}`, JSON.stringify(callData.data.agora));
        }
        
        navigate(`/astrologer/call/${incomingCall?.callId}`);
      }
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleRejectCall = async () => {
    await rejectCall();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border glass sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-foreground">Dashboard</h1>
              <p className="text-xs text-muted-foreground">{user?.name || 'Astrologer'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Availability Toggle */}
            <AvailabilityToggle
              initialStatus={availabilityStatus}
              onStatusChange={updateAvailabilityStatus}
            />
            <ChatNavLink />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/astrologer/earnings')} 
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Earnings
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/astrologer/calls/history')} 
              className="gap-2"
            >
              <Phone className="w-4 h-4" />
              Call History
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/astrologer/packages')} 
              className="gap-2"
            >
              <Package className="w-4 h-4" />
              Packages
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/astrologer/remedies')}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Remedies
            </Button>
            <Button onClick={() => setShowCreateModal(true)} className="gold-gradient text-primary-foreground gap-2">
              <Plus className="w-4 h-4" />
              New Session
            </Button>
            <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/'); }} className="text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        {overallStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsWidget icon={<BarChart3 className="w-5 h-5" />} label="Total Sessions" value={overallStats.totalSessions || 0} />
            <StatsWidget icon={<Eye className="w-5 h-5" />} label="Total Viewers" value={overallStats.totalViewers || 0} />
            <StatsWidget icon={<Clock className="w-5 h-5" />} label="Minutes Streamed" value={overallStats.totalMinutesStreamed || 0} />
            <StatsWidget icon={<Heart className="w-5 h-5" />} label="Avg Viewers" value={overallStats.averageViewersPerSession || 0} />
          </div>
        )}

        {/* Sessions */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="live">Live</TabsTrigger>
            <TabsTrigger value="ended">Ended</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 rounded-xl animate-shimmer" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg">No {activeTab} sessions</p>
                {activeTab === 'scheduled' && (
                  <Button onClick={() => setShowCreateModal(true)} variant="outline" className="mt-4 gap-2">
                    <Plus className="w-4 h-4" /> Schedule your first session
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sessions.map((session) => (
                  <div key={session._id} className="bg-card border border-border rounded-xl p-5 hover:card-glow transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-display font-semibold text-foreground">{session.title}</h3>
                        {session.topic && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary mt-1 inline-block">
                            {session.topic}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        session.status === 'live' ? 'bg-live text-live-foreground animate-pulse-live' :
                        session.status === 'scheduled' ? 'bg-accent/20 text-accent' :
                        session.status === 'ended' ? 'bg-muted text-muted-foreground' :
                        'bg-destructive/20 text-destructive'
                      }`}>
                        {session.status.toUpperCase()}
                      </span>
                    </div>

                    {session.scheduledStartTime && (
                      <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(session.scheduledStartTime), 'MMM d, yyyy h:mm a')}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{session.stats.totalViewers}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{session.stats.totalMessages}</span>
                      <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{session.stats.totalLikes}</span>
                    </div>

                    {session.status === 'scheduled' && (
                      <div className="flex gap-2">
                        <Button onClick={() => handleGoLive(session)} className="flex-1 gold-gradient text-primary-foreground gap-1" size="sm">
                          <Play className="w-3.5 h-3.5" /> Go Live
                        </Button>
                        <Button onClick={() => handleCancel(session._id)} variant="ghost" size="sm" className="text-destructive">
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {showCreateModal && (
        <CreateSessionModal onClose={() => setShowCreateModal(false)} onCreated={handleSessionCreated} />
      )}

      {/* Incoming Call Notification */}
      {incomingCall && (
        <IncomingCallNotification
          callId={incomingCall.callId}
          userName={incomingCall.userName}
          userPhoto={incomingCall.userPhoto}
          callType={incomingCall.callType}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          timeout={30}
        />
      )}
    </div>
  );
}

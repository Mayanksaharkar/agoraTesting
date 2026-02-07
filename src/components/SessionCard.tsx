import { Eye, Heart, Star } from 'lucide-react';
import { TOPIC_COLORS } from '@/config';

interface SessionCardProps {
  session: {
    _id: string;
    title: string;
    description?: string;
    topic?: string;
    status: string;
    currentViewers?: number;
    astrologerId?: {
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
    stats?: {
      totalViewers: number;
      totalLikes: number;
    };
  };
  onClick: () => void;
}

export default function SessionCard({ session, onClick }: SessionCardProps) {
  const astrologer = session.astrologerId;
  const topicColor = TOPIC_COLORS[session.topic || 'Other'] || TOPIC_COLORS.Other;

  return (
    <button
      onClick={onClick}
      className="bg-card border border-border rounded-xl p-5 text-left hover:card-glow transition-all hover:-translate-y-1 group w-full"
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-4">
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-live animate-pulse-live" />
          <span className="text-live">LIVE</span>
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Eye className="w-3.5 h-3.5" />
          {session.currentViewers || 0}
        </span>
      </div>

      {/* Astrologer info */}
      <div className="flex items-center gap-3 mb-3">
        {astrologer?.personalDetails?.profileImage ? (
          <img
            src={astrologer.personalDetails.profileImage}
            alt=""
            className="w-10 h-10 rounded-full object-cover border-2 border-primary/30"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold">
            {(astrologer?.personalDetails?.pseudonym || astrologer?.personalDetails?.name || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-display font-semibold text-foreground truncate">{session.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {astrologer?.personalDetails?.pseudonym || astrologer?.personalDetails?.name || 'Astrologer'}
          </p>
        </div>
      </div>

      {/* Topic + rating */}
      <div className="flex items-center gap-2 mb-3">
        {session.topic && (
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${topicColor}`}>
            {session.topic}
          </span>
        )}
        {astrologer?.ratings && (
          <span className="flex items-center gap-1 text-xs text-warning">
            <Star className="w-3.5 h-3.5 fill-current" />
            {astrologer.ratings.average.toFixed(1)}
            <span className="text-muted-foreground">({astrologer.ratings.total})</span>
          </span>
        )}
      </div>

      {/* Join CTA */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Heart className="w-3.5 h-3.5" />
          {session.stats?.totalLikes || 0}
        </span>
        <span className="text-xs font-semibold text-primary group-hover:underline">
          Join Session →
        </span>
      </div>
    </button>
  );
}

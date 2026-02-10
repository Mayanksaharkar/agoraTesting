import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';

interface ChatNavLinkProps {
  variant?: 'outline' | 'ghost' | 'default';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

/**
 * ChatNavLink Component
 * 
 * A navigation link to the chat page with an unread count badge.
 * Integrates with ChatContext to display real-time unread message count.
 * 
 * @param variant - Button variant (default: 'outline')
 * @param size - Button size (default: 'sm')
 * @param className - Additional CSS classes
 */
export default function ChatNavLink({
  variant = 'outline',
  size = 'sm',
  className = ''
}: ChatNavLinkProps) {
  const navigate = useNavigate();
  const { getTotalUnreadCount } = useChat();
  const { role } = useAuth();
  const unreadCount = getTotalUnreadCount();

  const handleChatClick = () => {
    if (role === 'astrologer') {
      navigate('/astrologer/chat');
    } else {
      navigate('/user/chat');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleChatClick}
      className={`gap-2 relative ${className}`}
      aria-label={`Chat${unreadCount > 0 ? ` (${unreadCount} unread messages)` : ''}`}
    >
      <MessageCircle className="w-4 h-4" />
      <span className="hidden sm:inline">Chat</span>
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center px-1 text-xs"
          aria-label={`${unreadCount} unread messages`}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
}

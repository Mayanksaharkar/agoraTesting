import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { config } from '@/config';
import { format } from 'date-fns';

interface ChatMessage {
  _id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  message: string;
  timestamp: string;
  isDeleted?: boolean;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  canDelete?: boolean;
  onDeleteMessage?: (messageId: string) => void;
  isHost?: boolean;
}

export default function ChatPanel({ messages, onSendMessage, canDelete, onDeleteMessage, isHost }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || trimmed.length > config.chat.maxMessageLength) return;
    onSendMessage(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 flex items-center px-4 border-b border-border shrink-0">
        <MessageCircle className="w-4 h-4 text-primary mr-2" />
        <span className="font-display font-semibold text-sm text-foreground">Chat</span>
        <span className="text-xs text-muted-foreground ml-2">({messages.length})</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">No messages yet. Be the first to chat!</p>
        )}
        {messages.map((msg) => (
          <div key={msg._id} className="group animate-slide-up flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-secondary/50 transition-colors">
            <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-semibold text-accent shrink-0">
              {msg.userName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold text-primary truncate">{msg.userName}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {format(new Date(msg.timestamp), 'HH:mm')}
                </span>
              </div>
              <p className="text-sm text-foreground/90 break-words">{msg.message}</p>
            </div>
            {canDelete && onDeleteMessage && (
              <button
                onClick={() => onDeleteMessage(msg._id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive/60 hover:text-destructive p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      {!isHost && (
        <div className="p-3 border-t border-border shrink-0">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={config.chat.maxMessageLength}
              className="bg-secondary border-border text-sm"
            />
            <Button onClick={handleSend} size="icon" className="gold-gradient text-primary-foreground shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {input.length > config.chat.maxMessageLength * 0.8 && (
            <p className="text-[10px] text-muted-foreground mt-1 text-right">
              {input.length}/{config.chat.maxMessageLength}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

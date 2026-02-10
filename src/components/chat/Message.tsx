import React from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck, Clock, AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UIMessage } from '@/types/chat';

export interface MessageProps {
  message: UIMessage;
  isOwn: boolean;
  showAvatar: boolean;
  showName: boolean;
  showTimestamp: boolean;
  onRetry?: (messageId: string) => void;
}

export function Message({
  message,
  isOwn,
  onRetry,
}: MessageProps) {
  const getStatusIcon = () => {
    switch (message.status) {
      case 'queued':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'sending':
        return <Clock className="h-3 w-3 text-muted-foreground animate-pulse" />;
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (date: Date) => {
    return format(new Date(date), 'HH:mm');
  };

  const handleRetry = () => {
    if (onRetry && message._id) {
      onRetry(message._id);
    }
  };

  return (
    <div
      className={cn(
        'flex w-full mb-1 px-4',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'flex flex-col max-w-[85%] sm:max-w-[70%] px-2.5 py-1.5 shadow-sm relative',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-none'
            : 'bg-muted text-foreground rounded-2xl rounded-tl-none'
        )}
      >
        <div className="relative flex flex-col">
          <p className="text-sm leading-[1.4] whitespace-pre-wrap break-words pr-14">
            {message.content}
          </p>

          <div className={cn(
            "flex items-center justify-end gap-1 absolute bottom-0 right-[-4px] pointer-events-none",
            isOwn ? "opacity-70" : "opacity-60"
          )}>
            <span className="text-[10px] min-w-fit leading-none">
              {formatTimestamp(message.timestamp)}
            </span>

            {isOwn && (
              <div className="flex items-center scale-75">
                {getStatusIcon()}
              </div>
            )}
          </div>
        </div>
      </div>

      {message.status === 'failed' && isOwn && onRetry && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full ml-1 text-destructive hover:bg-destructive/10 self-center"
          onClick={handleRetry}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

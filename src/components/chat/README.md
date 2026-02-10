# Chat Components

This directory contains the chat-related UI components for the one-to-one messaging feature.

## Components

### Message Component

The `Message` component displays a single chat message with appropriate styling, status indicators, and retry functionality.

**Location**: `cosmic-connect-live/src/components/chat/Message.tsx`

**Features**:
- ✅ Message alignment based on ownership (left for received, right for sent)
- ✅ Distinct background colors for sent/received messages
- ✅ Display sender name, content, and timestamp
- ✅ Delivery status icons (sending, sent, delivered, read, failed)
- ✅ Avatar display for received messages only
- ✅ Retry button for failed messages
- ✅ Support for multiline content with line breaks
- ✅ Responsive design with max-width constraint
- ✅ Accessibility support with proper data attributes

**Props**:
```typescript
interface MessageProps {
  message: UIMessage;           // The message data
  isOwn: boolean;               // Whether the message is from the current user
  showAvatar: boolean;          // Whether to show the sender's avatar
  showName: boolean;            // Whether to show the sender's name
  showTimestamp: boolean;       // Whether to show the timestamp
  onRetry?: (messageId: string) => void; // Callback for retry button
}
```

**Usage**:
```tsx
import { Message } from '@/components/chat';

<Message
  message={message}
  isOwn={message.senderId === currentUserId}
  showAvatar={true}
  showName={true}
  showTimestamp={true}
  onRetry={handleRetry}
/>
```

**Status Icons**:
- **Sending**: Clock icon with pulse animation (gray)
- **Sent**: Single checkmark (gray)
- **Delivered**: Double checkmark (gray)
- **Read**: Double checkmark (blue)
- **Failed**: Alert circle (red) with retry button

**Styling**:
- Own messages: Right-aligned with primary background color
- Received messages: Left-aligned with muted background color
- Avatar: 8x8 rounded circle with fallback initials
- Message bubble: Rounded corners with appropriate tail
- Timestamp: Small gray text below message
- Max width: 70% of container

**Testing**:
- Unit tests: `Message.test.tsx` (23 tests, all passing)
- Test coverage: Message display, alignment, status icons, avatar display, retry functionality, edge cases
- Examples: `Message.example.tsx` for visual demonstration

**Requirements Satisfied**:
- ✅ Requirement 4.1: Display sender name, content, and timestamp
- ✅ Requirement 4.2: Right alignment for own messages
- ✅ Requirement 4.3: Left alignment for received messages
- ✅ Requirement 4.4: Delivery status icons
- ✅ Requirement 4.5: Avatar display for received messages only
- ✅ Requirement 5.5: Retry button for failed messages

### TypingIndicator Component

The `TypingIndicator` component displays an animated typing indicator when the other participant is typing.

**Location**: `cosmic-connect-live/src/components/chat/TypingIndicator.tsx`

**Features**:
- ✅ Animated bouncing dots with staggered sequence
- ✅ Participant name with "is typing..." text
- ✅ Smooth fade in/out transitions
- ✅ Conditional rendering based on typing state
- ✅ Accessibility support with ARIA labels and live regions
- ✅ Customizable styling via className prop

**Props**:
```typescript
interface TypingIndicatorProps {
  participantName: string;      // Name of the typing participant
  isTyping: boolean;            // Whether the participant is typing
  className?: string;           // Optional custom CSS classes
}
```

**Usage**:
```tsx
import { TypingIndicator } from '@/components/chat';

<TypingIndicator
  participantName="John Doe"
  isTyping={isTyping}
/>
```

**Animation Details**:
- Three bouncing dots with staggered delays (0ms, 200ms, 400ms)
- Animation duration: 1.4s per cycle
- Smooth opacity transitions (300ms ease-in-out)
- Returns null when isTyping is false

**Accessibility**:
- `role="status"` for screen reader announcements
- `aria-live="polite"` for non-intrusive updates
- `aria-label` with descriptive text
- Animated dots hidden from screen readers with `aria-hidden="true"`

**Testing**:
- Unit tests: `TypingIndicator.test.tsx` (18 tests, all passing)
- Test coverage: Display behavior, animation, transitions, accessibility, custom styling, edge cases
- Examples: `TypingIndicator.example.tsx` for visual demonstration

**Requirements Satisfied**:
- ✅ Requirement 7.3: Display typing indicator when event received
- ✅ Requirement 7.4: Animated dots with bouncing sequence
- ✅ Requirement 7.5: Display participant name with "is typing..." text and smooth transitions

### ConnectionBanner Component

The `ConnectionBanner` component displays connection status and provides reconnection controls.

**Location**: `cosmic-connect-live/src/components/chat/ConnectionBanner.tsx`

**Features**:
- ✅ Display connection status (connected, disconnected, reconnecting)
- ✅ Show reconnection progress with spinner
- ✅ Manual reconnect button for disconnected state
- ✅ Smooth show/hide transitions
- ✅ Accessibility support with ARIA attributes
- ✅ Responsive design with appropriate styling

**Props**:
```typescript
interface ConnectionBannerProps {
  status: ConnectionStatus;           // Current connection status
  onReconnect?: () => void;           // Callback for reconnect button
  className?: string;                 // Optional custom CSS classes
  reconnectionAttempt?: number;       // Current reconnection attempt number
  maxReconnectionAttempts?: number;   // Maximum reconnection attempts
}

type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';
```

**Usage**:
```tsx
import { ConnectionBanner } from '@/components/chat';
import { useChat } from '@/contexts/ChatContext';

function ChatWindow() {
  const { isConnected } = useChat();
  
  const handleReconnect = () => {
    // Trigger manual reconnection
    socket.connect();
  };
  
  return (
    <div>
      <ConnectionBanner
        status={isConnected ? 'connected' : 'disconnected'}
        onReconnect={handleReconnect}
      />
      {/* Rest of chat UI */}
    </div>
  );
}
```

**Status Display**:
- **Connected**: Banner is hidden (returns null)
- **Disconnected**: Red banner with error icon and "Connection lost" message
- **Reconnecting**: Yellow banner with spinner and "Reconnecting..." message
- **Progress**: Shows "Attempt X of Y" when reconnectionAttempt > 0

**Styling**:
- Disconnected: Red background with red border
- Reconnecting: Yellow background with yellow border
- Smooth slide-in animation from top
- Responsive button placement
- Dark mode support

**Accessibility**:
- `role="alert"` for screen reader announcements
- `aria-live="assertive"` for immediate updates
- `aria-atomic="true"` for complete message reading
- Icons marked with `aria-hidden="true"`
- Reconnect button has descriptive `aria-label`

**Testing**:
- Unit tests: `ConnectionBanner.test.tsx` (16 tests, all passing)
- Test coverage: Status display, reconnect button, accessibility, styling, edge cases
- Examples: `ConnectionBanner.example.tsx` for visual demonstration

**Requirements Satisfied**:
- ✅ Requirement 1.2: Display connection status indicator
- ✅ Requirement 1.3: Show reconnection progress and provide manual reconnect button

## File Structure

```
cosmic-connect-live/src/components/chat/
├── Message.tsx                    # Message component implementation
├── Message.test.tsx               # Unit tests for Message component
├── Message.example.tsx            # Visual examples and demonstrations
├── TypingIndicator.tsx            # TypingIndicator component implementation
├── TypingIndicator.test.tsx       # Unit tests for TypingIndicator component
├── TypingIndicator.example.tsx    # Visual examples and demonstrations
├── MessageInput.tsx               # MessageInput component implementation
├── MessageInput.test.tsx          # Unit tests for MessageInput component
├── MessageInput.example.tsx       # Visual examples and demonstrations
├── MessageList.tsx                # MessageList component implementation
├── MessageList.test.tsx           # Unit tests for MessageList component
├── MessageList.example.tsx        # Visual examples and demonstrations
├── ConnectionBanner.tsx           # ConnectionBanner component implementation
├── ConnectionBanner.test.tsx      # Unit tests for ConnectionBanner component
├── ConnectionBanner.example.tsx   # Visual examples and demonstrations
├── index.ts                       # Barrel export for all chat components
└── README.md                      # This file
```

## Next Steps

The following components are planned for implementation:

1. ~~**TypingIndicator** - Animated typing indicator~~ ✅ **COMPLETED**
2. **MessageInput** - Text input with validation and typing events ✅ **COMPLETED**
3. **MessageList** - Virtualized list with infinite scroll ✅ **COMPLETED**
4. ~~**ConnectionBanner** - Connection status indicator~~ ✅ **COMPLETED**
5. **ConversationItem** - Conversation preview in chat list
6. **ChatList** - List of all conversations
7. **ChatWindow** - Complete chat interface
8. **ChatPage** - Main chat page with responsive layout

## Development Notes

- All components use shadcn/ui primitives for consistency
- TypeScript strict mode is enabled
- Components follow accessibility best practices
- Tests use Vitest and React Testing Library
- Styling uses Tailwind CSS utility classes

/**
 * ChatPage Component
 * Main container for chat interface with responsive layout
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useChat } from '@/contexts/ChatContext';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatErrorBoundary } from '@/components/chat/ChatErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';
import { useChatErrorHandling } from '@/hooks/useChatErrorHandling';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { ParticipantRole } from '@/types/chat';

// ============================================================================
// Types
// ============================================================================

interface ChatPageContentProps {
  participantId?: string;
}

// ============================================================================
// ChatPage Content Component (wrapped by ChatProvider)
// ============================================================================

/**
 * ChatPageContent Component
 * Handles conversation selection and responsive layout
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */
function ChatPageContent({ participantId }: ChatPageContentProps) {
  const { user, isAuthenticated, role, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { getOrCreateConversation, setActiveConversation, activeConversationId } = useChat();
  const { handleConversationCreationError } = useChatErrorHandling();

  // Get participant details from route state (passed from AstrologerProfile)
  const participantName = location.state?.participantName || 'Participant';
  const participantAvatar = location.state?.participantAvatar;

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);

  /**
   * Handle window resize for responsive layout
   * Requirements: 13.5
   */
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);

      // On desktop, always show both panels
      if (!isMobile) {
        setShowChatWindow(true);
      }
    };

    // Initial check
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  /**
   * Handle new conversation initiation from route parameter
   * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
   */
  useEffect(() => {
    // Wait for auth to finish loading
    if (isAuthLoading) {
      console.log('[ChatPage] Waiting for auth to load...');
      return;
    }

    // If no participantId, just show the chat list
    if (!participantId) {
      console.log('[ChatPage] No participantId, showing chat list');
      setIsCreatingConversation(false);
      return;
    }

    // Check authentication
    if (!isAuthenticated || !role) {
      console.log('[ChatPage] Not authenticated, redirecting to login');
      setCreationError('Please log in to access chat');
      setIsCreatingConversation(false);
      return;
    }

    console.log('[ChatPage] Initiating conversation with participant:', participantId);

    const initiateConversation = async () => {
      setIsCreatingConversation(true);
      setCreationError(null);

      try {
        // Determine participant role (opposite of current user)
        const participantRole: ParticipantRole = role === 'user' ? 'astrologer' : 'user';

        console.log('[ChatPage] Calling getOrCreateConversation:', { participantId, participantRole, participantName, participantAvatar });

        // Get or create conversation
        const conversationId = await getOrCreateConversation(
          participantId,
          participantName,
          participantRole,
          participantAvatar
        );

        console.log('[ChatPage] Conversation created/retrieved:', conversationId);

        // Select the conversation
        console.log('[ChatPage] Setting selectedConversationId to:', conversationId);
        setSelectedConversationId(conversationId);
        console.log('[ChatPage] Setting activeConversation to:', conversationId);
        setActiveConversation(conversationId);

        // On mobile, show chat window
        if (isMobileView) {
          setShowChatWindow(true);
        }

        // Clear participant ID from URL
        const chatPath = role === 'astrologer' ? '/astrologer/chat' : '/user/chat';
        navigate(chatPath, { replace: true });
      } catch (error) {
        console.error('[ChatPage] Failed to create conversation:', error);

        // Show error toast with retry option
        handleConversationCreationError(error, () => {
          // Retry by reloading the page with the same participant ID
          window.location.reload();
        });

        setCreationError(
          error instanceof Error ? error.message : 'Failed to start conversation'
        );
      } finally {
        setIsCreatingConversation(false);
      }
    };

    initiateConversation();
  }, [participantId, isAuthenticated, role, isAuthLoading, getOrCreateConversation, setActiveConversation, navigate, isMobileView, handleConversationCreationError, participantName, participantAvatar]);

  /**
   * Handle conversation selection
   * Requirements: 3.1, 13.3
   */
  const handleConversationSelect = useCallback(
    (conversationId: string) => {
      console.log('[ChatPage] handleConversationSelect called with:', conversationId);
      setSelectedConversationId(conversationId);
      setActiveConversation(conversationId);

      // On mobile, show chat window when conversation is selected
      if (isMobileView) {
        setShowChatWindow(true);
      }

      console.log('[ChatPage] After selection - selectedConversationId:', conversationId, 'isMobileView:', isMobileView);
    },
    [isMobileView, setActiveConversation]
  );

  /**
   * Handle back button on mobile
   * Requirements: 13.4
   */
  const handleBack = useCallback(() => {
    setShowChatWindow(false);
    setSelectedConversationId(null);
  }, []);

  /**
   * Handle Escape key to go back on mobile
   * Requirements: 16.1, 16.4
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileView && showChatWindow) {
        e.preventDefault();
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileView, showChatWindow, handleBack]);

  // ============================================================================
  // Render Loading State
  // ============================================================================

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isCreatingConversation) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Starting conversation...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render Error State
  // ============================================================================

  if (creationError) {
    return (
      <div className="flex items-center justify-center h-screen bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2">
            <span>{creationError}</span>
            <button
              onClick={() => navigate(-1)}
              className="text-sm underline hover:no-underline"
            >
              Go back
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ============================================================================
  // Render Desktop Layout (Two-Column)
  // Requirements: 13.1
  // ============================================================================

  if (!isMobileView) {
    console.log('[ChatPage] Rendering desktop layout:', {
      selectedConversationId,
      isMobileView,
      willRenderChatWindow: !!selectedConversationId
    });
    return (
      <div className="flex h-screen bg-background" data-testid="chat-page-desktop" role="main" aria-label="Chat interface">
        {/* Chat List - 30% width */}
        <div className="w-[30%] min-w-[300px] max-w-[400px] border-r border-border" role="navigation" aria-label="Conversation list">
          <ChatList
            onConversationSelect={handleConversationSelect}
            selectedConversationId={selectedConversationId}
            className="h-full"
          />
        </div>

        {/* Chat Window - 70% width */}
        <div className="flex-1" role="region" aria-label="Chat messages">
          {selectedConversationId ? (
            <>
              {console.log('[ChatPage] Rendering ChatWindow with conversationId:', selectedConversationId)}
              <ChatWindow conversationId={selectedConversationId} />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center p-8">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Select a conversation</h2>
                <p className="text-muted-foreground">
                  Choose a conversation from the list to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render Mobile Layout (Single View)
  // Requirements: 13.2, 13.3, 13.4
  // ============================================================================

  return (
    <div className="flex flex-col h-screen bg-background" data-testid="chat-page-mobile" role="main" aria-label="Chat interface">
      {/* Show Chat List by default on mobile */}
      {!showChatWindow && (
        <div className="flex-1 overflow-hidden" role="navigation" aria-label="Conversation list">
          <ChatList
            onConversationSelect={handleConversationSelect}
            selectedConversationId={selectedConversationId}
            className="h-full"
          />
        </div>
      )}

      {/* Show Chat Window when conversation is selected on mobile */}
      {showChatWindow && selectedConversationId && (
        <div className="flex-1 overflow-hidden" role="region" aria-label="Chat messages">
          <ChatWindow
            conversationId={selectedConversationId}
            onBack={handleBack}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ChatPage Component (with ChatProvider wrapper)
// ============================================================================

/**
 * ChatPage Component
 * Main entry point for chat interface
 * Wraps content with Error Boundary
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 14.1, 14.3
 */
export default function ChatPage() {
  const { participantId } = useParams<{ participantId?: string }>();

  return (
    <ChatErrorBoundary>
      <ChatPageContent participantId={participantId} />
    </ChatErrorBoundary>
  );
}

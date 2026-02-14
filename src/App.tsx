import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { lazy, Suspense } from "react";
import NotFound from "./pages/NotFound";

const Login = lazy(() => import("./pages/Login"));
const AstrologerDashboard = lazy(() => import("./pages/AstrologerDashboard"));
const AstrologerLiveStream = lazy(() => import("./pages/AstrologerLiveStream"));
const AstrologerProfile = lazy(() => import("./pages/AstrologerProfile"));
const AstrologerList = lazy(() => import("./pages/AstrologerList"));
const AstrologerCallHistory = lazy(() => import("./pages/AstrologerCallHistory"));
const AstrologerEarnings = lazy(() => import("./pages/AstrologerEarnings"));
const PackageManagement = lazy(() => import("./pages/PackageManagement"));
const AstrologerRemediesPage = lazy(() => import("./pages/AstrologerRemediesPage"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const UserLiveViewing = lazy(() => import("./pages/UserLiveViewing"));
const CallRinging = lazy(() => import("./pages/CallRinging"));
const InCallUI = lazy(() => import("./pages/InCallUI"));
const UserCallHistory = lazy(() => import("./pages/UserCallHistory"));
const CallDetails = lazy(() => import("./pages/CallDetails"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const UserCoursesPage = lazy(() => import("./pages/UserCoursesPage"));
const UserCourseDetail = lazy(() => import("./pages/UserCourseDetail"));
const UserMyCoursesPage = lazy(() => import("./pages/UserMyCoursesPage"));
const AstrologerLiveCourse = lazy(() => import("./pages/AstrologerLiveCourse"));
const UserLiveCourse = lazy(() => import("./pages/UserLiveCourse"));

// Remedy Pages
const RemediesPage = lazy(() => import("./pages/RemediesPage"));
const RemedyDetailsPage = lazy(() => import("./pages/RemedyDetailsPage"));
const RemedyBookingPage = lazy(() => import("./pages/RemedyBookingPage"));
const UserBookingsPage = lazy(() => import("./pages/UserBookingsPage"));
const BookingResponsePage = lazy(() => import("./pages/BookingResponsePage"));

const queryClient = new QueryClient();

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, role } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={role === "astrologer" ? "/astrologer" : "/user"} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route path="/astrologer" element={<ProtectedRoute requiredRole="astrologer"><AstrologerDashboard /></ProtectedRoute>} />
      <Route path="/astrologer/dashboard" element={<ProtectedRoute requiredRole="astrologer"><AstrologerDashboard /></ProtectedRoute>} />
      <Route path="/astrologer/live/:sessionId" element={<ProtectedRoute requiredRole="astrologer"><AstrologerLiveStream /></ProtectedRoute>} />
      <Route path="/astrologer/live-course/:courseId" element={<ProtectedRoute requiredRole="astrologer"><AstrologerLiveCourse /></ProtectedRoute>} />
      <Route path="/astrologer/call/:callId" element={<ProtectedRoute requiredRole="astrologer"><InCallUI /></ProtectedRoute>} />
      <Route path="/astrologer/calls/history" element={<ProtectedRoute requiredRole="astrologer"><AstrologerCallHistory /></ProtectedRoute>} />
      <Route path="/astrologer/calls/:callId/details" element={<ProtectedRoute requiredRole="astrologer"><CallDetails /></ProtectedRoute>} />
      <Route path="/astrologer/earnings" element={<ProtectedRoute requiredRole="astrologer"><AstrologerEarnings /></ProtectedRoute>} />
      <Route path="/astrologer/packages" element={<ProtectedRoute requiredRole="astrologer"><PackageManagement /></ProtectedRoute>} />
      <Route path="/astrologer/remedies" element={<ProtectedRoute requiredRole="astrologer"><AstrologerRemediesPage /></ProtectedRoute>} />
      <Route path="/user" element={<ProtectedRoute requiredRole="user"><UserDashboard /></ProtectedRoute>} />
      <Route path="/user/astrologers" element={<ProtectedRoute requiredRole="user"><AstrologerList /></ProtectedRoute>} />
      <Route path="/user/courses" element={<ProtectedRoute requiredRole="user"><UserCoursesPage /></ProtectedRoute>} />
      <Route path="/user/courses/:type/:courseId" element={<ProtectedRoute requiredRole="user"><UserCourseDetail /></ProtectedRoute>} />
      <Route path="/user/live-course/:courseId" element={<ProtectedRoute requiredRole="user"><UserLiveCourse /></ProtectedRoute>} />
      <Route path="/user/my-courses" element={<ProtectedRoute requiredRole="user"><UserMyCoursesPage /></ProtectedRoute>} />
      <Route path="/user/calls/history" element={<ProtectedRoute requiredRole="user"><UserCallHistory /></ProtectedRoute>} />
      <Route path="/user/calls/:callId/details" element={<ProtectedRoute requiredRole="user"><CallDetails /></ProtectedRoute>} />
      <Route path="/user/live/:sessionId" element={<ProtectedRoute requiredRole="user"><UserLiveViewing /></ProtectedRoute>} />
      <Route path="/user/astrologer/:astrologerId" element={<ProtectedRoute requiredRole="user"><AstrologerProfile /></ProtectedRoute>} />
      <Route path="/learn" element={<ProtectedRoute requiredRole="user"><UserCoursesPage /></ProtectedRoute>} />
      <Route path="/user/call/:callId/ringing" element={<ProtectedRoute requiredRole="user"><CallRinging /></ProtectedRoute>} />
      <Route path="/user/call/:callId" element={<ProtectedRoute requiredRole="user"><InCallUI /></ProtectedRoute>} />
      
      {/* Remedy Routes */}
      <Route path="/user/remedies" element={<ProtectedRoute requiredRole="user"><RemediesPage /></ProtectedRoute>} />
      <Route path="/user/remedies/:remedyId" element={<ProtectedRoute requiredRole="user"><RemedyDetailsPage /></ProtectedRoute>} />
      <Route path="/user/remedies/:remedyId/book/:astrologerServiceId" element={<ProtectedRoute requiredRole="user"><RemedyBookingPage /></ProtectedRoute>} />
      <Route path="/user/bookings" element={<ProtectedRoute requiredRole="user"><UserBookingsPage /></ProtectedRoute>} />
      <Route path="/user/bookings/:bookingId" element={<ProtectedRoute requiredRole="user"><BookingResponsePage /></ProtectedRoute>} />
      
      {/* Chat Routes */}
      <Route path="/astrologer/chat" element={<ProtectedRoute requiredRole="astrologer"><ChatPage /></ProtectedRoute>} />
      <Route path="/astrologer/chat/:participantId" element={<ProtectedRoute requiredRole="astrologer"><ChatPage /></ProtectedRoute>} />
      <Route path="/user/chat" element={<ProtectedRoute requiredRole="user"><ChatPage /></ProtectedRoute>} />
      <Route path="/user/chat/:participantId" element={<ProtectedRoute requiredRole="user"><ChatPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ChatProvider>
            <Suspense fallback={<LoadingFallback />}>
              <AppRoutes />
            </Suspense>
          </ChatProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

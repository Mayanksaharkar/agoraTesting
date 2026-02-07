import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { lazy, Suspense } from "react";
import NotFound from "./pages/NotFound";

const Login = lazy(() => import("./pages/Login"));
const AstrologerDashboard = lazy(() => import("./pages/AstrologerDashboard"));
const AstrologerLiveStream = lazy(() => import("./pages/AstrologerLiveStream"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const UserLiveViewing = lazy(() => import("./pages/UserLiveViewing"));

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
      <Route path="/astrologer/live/:sessionId" element={<ProtectedRoute requiredRole="astrologer"><AstrologerLiveStream /></ProtectedRoute>} />
      <Route path="/user" element={<ProtectedRoute requiredRole="user"><UserDashboard /></ProtectedRoute>} />
      <Route path="/user/live/:sessionId" element={<ProtectedRoute requiredRole="user"><UserLiveViewing /></ProtectedRoute>} />
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
          <Suspense fallback={<LoadingFallback />}>
            <AppRoutes />
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

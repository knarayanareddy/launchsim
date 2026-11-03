import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";

// Every other route is code-split. The previous build shipped all 18 pages in a
// single 1.79 MB chunk (530 kB gzipped), including jsPDF which is only needed on
// the Pro PDF-export path.
const Login = lazy(() => import("./pages/Login.tsx"));
const Signup = lazy(() => import("./pages/Signup.tsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const Pricing = lazy(() => import("./pages/Pricing.tsx"));
const Legal = lazy(() => import("./pages/Legal.tsx"));
const Studio = lazy(() => import("./pages/Studio.tsx"));
const Simulation = lazy(() => import("./pages/Simulation.tsx"));
const Results = lazy(() => import("./pages/Results.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const Wiki = lazy(() => import("./pages/Wiki.tsx"));
const WikiReport = lazy(() => import("./pages/WikiReport.tsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.tsx"));
const Tracker = lazy(() => import("./pages/Tracker.tsx"));
const Compare = lazy(() => import("./pages/Compare.tsx"));
const Personas = lazy(() => import("./pages/Personas.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <Sonner position="bottom-right" toastOptions={{ duration: 4000 }} visibleToasts={3} />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/legal/:doc" element={<Legal />} />
                <Route path="/wiki" element={<Wiki />} />
                <Route path="/wiki/:token" element={<WikiReport />} />

                {/* Protected routes */}
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                <Route path="/studio" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
                <Route path="/simulation" element={
                  <ProtectedRoute>
                    <ErrorBoundary fallbackTitle="Simulation encountered an error">
                      <Simulation />
                    </ErrorBoundary>
                  </ProtectedRoute>
                } />
                <Route path="/results" element={
                  <ProtectedRoute>
                    <ErrorBoundary fallbackTitle="Results encountered an error">
                      <Results />
                    </ErrorBoundary>
                  </ProtectedRoute>
                } />
                {/* Deep link to a saved report (used by the completion email and admin panel) */}
                <Route path="/results/:id" element={
                  <ProtectedRoute>
                    <ErrorBoundary fallbackTitle="Results encountered an error">
                      <Results />
                    </ErrorBoundary>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/tracker" element={<ProtectedRoute><Tracker /></ProtectedRoute>} />
                <Route path="/compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
                <Route path="/personas" element={<ProtectedRoute><Personas /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

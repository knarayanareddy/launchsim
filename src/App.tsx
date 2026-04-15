import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index.tsx";
import Studio from "./pages/Studio.tsx";
import Simulation from "./pages/Simulation.tsx";
import Results from "./pages/Results.tsx";
import Wiki from "./pages/Wiki.tsx";
import WikiReport from "./pages/WikiReport.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <Toaster />
        <Sonner position="bottom-right" toastOptions={{ duration: 4000 }} visibleToasts={3} />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/studio" element={
              <ErrorBoundary fallbackTitle="Studio encountered an error">
                <Studio />
              </ErrorBoundary>
            } />
            <Route path="/simulation" element={
              <ErrorBoundary fallbackTitle="Simulation encountered an error">
                <Simulation />
              </ErrorBoundary>
            } />
            <Route path="/results" element={
              <ErrorBoundary fallbackTitle="Results encountered an error">
                <Results />
              </ErrorBoundary>
            } />
            <Route path="/wiki" element={<Wiki />} />
            <Route path="/wiki/:token" element={<WikiReport />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

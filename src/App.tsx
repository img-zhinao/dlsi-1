import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import Overview from "./pages/Overview";
import AIQuote from "./pages/AIQuote";
import QuoteManagement from "./pages/QuoteManagement";
import Underwriting from "./pages/Underwriting";
import Claims from "./pages/Claims";
import Dashboard from "./pages/Dashboard";
import ProfessionalKnowledge from "./pages/knowledge/ProfessionalKnowledge";
import InsuranceTerms from "./pages/knowledge/InsuranceTerms";
import DataSources from "./pages/knowledge/DataSources";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Overview />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/quote"
        element={
          <ProtectedRoute>
            <MainLayout>
              <AIQuote />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/quote/management"
        element={
          <ProtectedRoute>
            <MainLayout>
              <QuoteManagement />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/underwriting"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Underwriting />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/claims"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Claims />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/knowledge/professional"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ProfessionalKnowledge />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/knowledge/terms"
        element={
          <ProtectedRoute>
            <MainLayout>
              <InsuranceTerms />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/knowledge/datasources"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DataSources />
            </MainLayout>
          </ProtectedRoute>
        }
      />
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
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

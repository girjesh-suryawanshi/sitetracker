import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";

// Lazy load pages for performance
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Credits = lazy(() => import("./pages/Credits"));
const Sites = lazy(() => import("./pages/Sites"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const Vendors = lazy(() => import("./pages/Vendors"));
const BankAccounts = lazy(() => import("./pages/BankAccounts"));
const FundTransfers = lazy(() => import("./pages/FundTransfers"));
const Reports = lazy(() => import("./pages/Reports"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading component
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
            <Route path="/expenses" element={<DashboardLayout><Expenses /></DashboardLayout>} />
            <Route path="/credits" element={<DashboardLayout><Credits /></DashboardLayout>} />
            <Route path="/sites" element={<DashboardLayout><Sites /></DashboardLayout>} />
            <Route path="/vendors" element={<DashboardLayout><Vendors /></DashboardLayout>} />
            <Route path="/bank-accounts" element={<DashboardLayout><BankAccounts /></DashboardLayout>} />
            <Route path="/fund-transfers" element={<DashboardLayout><FundTransfers /></DashboardLayout>} />
            <Route path="/users" element={<DashboardLayout><UserManagement /></DashboardLayout>} />
            <Route path="/reports" element={<DashboardLayout><Reports /></DashboardLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

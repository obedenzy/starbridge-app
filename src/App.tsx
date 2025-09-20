import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ReviewProvider } from "@/contexts/ReviewContext";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import ReviewForm from "./pages/ReviewForm";
import Reviews from "./pages/Reviews";
import Users from "./pages/Users";
import Billing from "./pages/Billing";
import CreateSuperAdmin from "./pages/CreateSuperAdmin";
import NotFound from "./pages/NotFound";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SuperAdminBusinesses from "./pages/SuperAdminBusinesses";
import SuperAdminUsers from "./pages/SuperAdminUsers";
import { SuperAdminSidebar } from "@/components/SuperAdminSidebar";
import { SuperAdminSubscriptions } from "@/components/SuperAdminSubscriptions";
import { SubscriptionPrompt } from "@/components/SubscriptionPrompt";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import { useReview } from '@/contexts/ReviewContext';
import ForcePasswordChange from '@/components/ForcePasswordChange';

const queryClient = new QueryClient();

const AppWithSidebar = ({ children }: { children: React.ReactNode }) => {
  const reviewContext = useReview();
  const location = useLocation();
  
  if (!reviewContext) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  const { userRole, subscriptionStatus, redirectPath } = reviewContext;
  
  // Debug logging
  console.log('AppWithSidebar - userRole:', userRole, 'pathname:', location.pathname, 'subscription:', subscriptionStatus);
  
  // Always call hooks first before any conditional returns
  const sidebarComponent = userRole === 'super_admin' ? <SuperAdminSidebar /> : <AppSidebar />;
  
  // Handle redirects after all hooks are called
  if (userRole === 'super_admin') {
    if (location.pathname === '/dashboard') {
      console.log('Redirecting super admin from /dashboard to /super-admin/dashboard');
      return <Navigate to="/super-admin/dashboard" replace />;
    }
    if (location.pathname === '/profile') {
      return <Navigate to="/super-admin/profile" replace />;
    }
    if (location.pathname === '/settings') {
      return <Navigate to="/super-admin/settings" replace />;
    }
    if (location.pathname === '/reviews') {
      return <Navigate to="/super-admin/dashboard" replace />;
    }
  }
  
  // Redirect regular users from super admin routes to regular routes
  if (userRole === 'business_user') {
    if (location.pathname.startsWith('/super-admin/')) {
      console.log('Redirecting business user from super admin routes to /dashboard');
      return <Navigate to="/dashboard" replace />;
    }
    
    // Skip subscription check for subscription-related routes and billing page to prevent redirect loops
    const exemptRoutes = ['/subscription-required', '/subscription-success', '/billing'];
    const isExemptRoute = exemptRoutes.includes(location.pathname);
    
    // Handle redirects based on business status and reviews
    if (!isExemptRoute && redirectPath && location.pathname !== redirectPath) {
      console.log('Redirecting based on business status and reviews:', redirectPath);
      return <Navigate to={redirectPath} replace />;
    }
  }
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {sidebarComponent}
        <SidebarInset className="flex-1">
          <header className="h-14 flex items-center border-b bg-background px-4">
            <SidebarTrigger />
          </header>
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

const AppWithPasswordCheck = () => {
  const reviewContext = useReview();
  
  if (!reviewContext) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  const { user, requiresPasswordChange } = reviewContext;

  // Check if user needs to change password
  if (user && requiresPasswordChange()) {
    return <ForcePasswordChange />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<AppWithSidebar><Dashboard /></AppWithSidebar>} />
        <Route path="/profile" element={<AppWithSidebar><Profile /></AppWithSidebar>} />
        <Route path="/settings" element={<AppWithSidebar><Settings /></AppWithSidebar>} />
        <Route path="/reviews" element={<AppWithSidebar><Reviews /></AppWithSidebar>} />
        <Route path="/users" element={<AppWithSidebar><Users /></AppWithSidebar>} />
        <Route path="/billing" element={<AppWithSidebar><Billing /></AppWithSidebar>} />
        
        {/* Super Admin Routes */}
        <Route path="/super-admin/dashboard" element={<AppWithSidebar><SuperAdminDashboard /></AppWithSidebar>} />
        <Route path="/super-admin/businesses" element={<AppWithSidebar><SuperAdminBusinesses /></AppWithSidebar>} />
        <Route path="/super-admin/users" element={<AppWithSidebar><SuperAdminUsers /></AppWithSidebar>} />
        <Route path="/super-admin/subscriptions" element={<AppWithSidebar><SuperAdminSubscriptions /></AppWithSidebar>} />
        <Route path="/super-admin/settings" element={<AppWithSidebar><Settings /></AppWithSidebar>} />
        <Route path="/super-admin/profile" element={<AppWithSidebar><Profile /></AppWithSidebar>} />
        <Route path="/create-super-admin" element={<CreateSuperAdmin />} />
        <Route path="/subscription-required" element={<SubscriptionPrompt />} />
        <Route path="/subscription-success" element={<SubscriptionSuccess />} />
        <Route path="/review" element={<ReviewForm />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReviewProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppWithPasswordCheck />
        </TooltipProvider>
      </ReviewProvider>
    </QueryClientProvider>
  );
};

export default App;

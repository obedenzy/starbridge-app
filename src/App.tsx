import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import CreateSuperAdmin from "./pages/CreateSuperAdmin";
import NotFound from "./pages/NotFound";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SuperAdminBusinesses from "./pages/SuperAdminBusinesses";
import SuperAdminUsers from "./pages/SuperAdminUsers";
import { SuperAdminSidebar } from "@/components/SuperAdminSidebar";
import { useReview } from "@/contexts/ReviewContext";
import { Navigate, useLocation } from "react-router-dom";

const queryClient = new QueryClient();

const AppWithSidebar = ({ children }: { children: React.ReactNode }) => {
  const { userRole } = useReview();
  const location = useLocation();
  
  // Redirect super admin users from regular routes to super admin routes
  if (userRole === 'super_admin') {
    if (location.pathname === '/dashboard') {
      return <Navigate to="/super-admin/dashboard" replace />;
    }
    if (location.pathname === '/profile') {
      return <Navigate to="/super-admin/profile" replace />;
    }
    if (location.pathname === '/settings') {
      return <Navigate to="/super-admin/settings" replace />;
    }
  }
  
  // Redirect regular users from super admin routes to regular routes
  if (userRole === 'business_user') {
    if (location.pathname.startsWith('/super-admin/')) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {userRole === 'super_admin' ? <SuperAdminSidebar /> : <AppSidebar />}
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ReviewProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<AppWithSidebar><Dashboard /></AppWithSidebar>} />
            <Route path="/profile" element={<AppWithSidebar><Profile /></AppWithSidebar>} />
            <Route path="/settings" element={<AppWithSidebar><Settings /></AppWithSidebar>} />
            <Route path="/reviews" element={<AppWithSidebar><Reviews /></AppWithSidebar>} />
            
            {/* Super Admin Routes */}
            <Route path="/super-admin/dashboard" element={<AppWithSidebar><SuperAdminDashboard /></AppWithSidebar>} />
            <Route path="/super-admin/businesses" element={<AppWithSidebar><SuperAdminBusinesses /></AppWithSidebar>} />
            <Route path="/super-admin/users" element={<AppWithSidebar><SuperAdminUsers /></AppWithSidebar>} />
            <Route path="/super-admin/settings" element={<AppWithSidebar><Settings /></AppWithSidebar>} />
            <Route path="/super-admin/profile" element={<AppWithSidebar><Profile /></AppWithSidebar>} />
            <Route path="/create-super-admin" element={<CreateSuperAdmin />} />
            <Route path="/review" element={<ReviewForm />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ReviewProvider>
  </QueryClientProvider>
);

export default App;

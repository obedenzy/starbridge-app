import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  Building2, 
  Users, 
  Settings, 
  User,
  LogOut,
  Shield,
  CreditCard
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useReview } from "@/contexts/ReviewContext";

const menuItems = [
  { title: "Dashboard", url: "/super-admin/dashboard", icon: BarChart3 },
  { title: "Business Accounts", url: "/super-admin/businesses", icon: Building2 },
  { title: "Business Users", url: "/super-admin/users", icon: Users },
  { title: "Subscriptions", url: "/super-admin/subscriptions", icon: CreditCard },
  { title: "Profile", url: "/super-admin/profile", icon: User },
];

export function SuperAdminSidebar() {
  // Always call all hooks first
  const { state } = useSidebar();
  const location = useLocation();
  const { user, logout, profile } = useReview();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Calculate derived values after hooks
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  const collapsed = state === "collapsed";

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Handle null user case after all hooks are called
  if (!user) {
    return null;
  }

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-semibold text-sm truncate">
                Super Admin
              </h2>
              <p className="text-xs text-muted-foreground">Platform Management</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) =>
                        isActive 
                          ? "bg-primary/10 text-primary" 
                          : "hover:bg-muted/50"
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
import { useEffect, useState } from "react";
import { useReview } from "@/contexts/ReviewContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Key, Mail, Search, Shield, Building2, Calendar, Activity } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface UserData {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  business_name: string;
  created_at?: string;
  last_login: string | null;
}

interface UserWithRole extends UserData {
  role: 'super_admin' | 'business_user';
}

export default function SuperAdminUsers() {
  const { user, userRole, getAllUsers, updateUserPassword } = useReview();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const { toast } = useToast();

  // Redirect if not super admin
  if (!user || userRole !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data as UserData[]);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!selectedUser || !newPassword) return;

    setIsChangingPassword(true);
    try {
      const { error } = await updateUserPassword(selectedUser.user_id, newPassword);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Password updated successfully",
        });
        setSelectedUser(null);
        setNewPassword("");
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.business_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getActivityStatus = (lastLogin: string | null) => {
    if (!lastLogin) return { status: 'Never', color: 'text-muted-foreground' };
    
    const loginDate = new Date(lastLogin);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - loginDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return { status: 'Today', color: 'text-green-600' };
    if (daysDiff <= 7) return { status: `${daysDiff}d ago`, color: 'text-blue-600' };
    if (daysDiff <= 30) return { status: `${daysDiff}d ago`, color: 'text-yellow-600' };
    return { status: `${daysDiff}d ago`, color: 'text-red-600' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            Business Users
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage all business users on the platform
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Enhanced Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              New This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => {
                if (!u.created_at) return false;
                const createdDate = new Date(u.created_at);
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return createdDate > weekAgo;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Active Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => {
                if (!u.last_login) return false;
                const lastLoginDate = new Date(u.last_login);
                const today = new Date();
                return lastLoginDate.toDateString() === today.toDateString();
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Logged in today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              With Businesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.business_name && u.business_name !== 'Platform Administration').length}
            </div>
            <p className="text-xs text-muted-foreground">Business owners</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Super Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.business_name === 'Platform Administration').length}
            </div>
            <p className="text-xs text-muted-foreground">Admin accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Info</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((userData) => {
                const activityStatus = getActivityStatus(userData.last_login);
                const isAdmin = userData.business_name === 'Platform Administration';
                
                return (
                  <TableRow key={userData.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {isAdmin ? (
                            <Shield className="w-5 h-5 text-primary" />
                          ) : (
                            <Users className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{userData.full_name || 'N/A'}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {userData.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        {userData.business_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isAdmin ? "default" : "secondary"}>
                        {isAdmin ? 'Super Admin' : 'Business User'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {userData.created_at ? new Date(userData.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className={activityStatus.color}>
                        {activityStatus.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(userData)}
                            disabled={isAdmin}
                          >
                            <Key className="w-4 h-4 mr-1" />
                            Change Password
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                            <DialogDescription>
                              Change password for {userData.full_name || userData.email}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">New Password</label>
                              <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password (min 8 characters)"
                                minLength={8}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Password must be at least 8 characters long
                              </p>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(null);
                                setNewPassword("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handlePasswordChange}
                              disabled={!newPassword || newPassword.length < 8 || isChangingPassword}
                            >
                              {isChangingPassword ? 'Updating...' : 'Update Password'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
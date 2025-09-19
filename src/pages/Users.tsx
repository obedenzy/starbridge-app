import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useReview } from '@/contexts/ReviewContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Users as UsersIcon, 
  UserPlus, 
  Shield, 
  User, 
  Trash2, 
  Key,
  Crown,
  RefreshCw
} from 'lucide-react';

interface BusinessUser {
  id: string;
  business_id: string;
  user_id: string;
  role: 'business_admin' | 'business_user';
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
  is_owner?: boolean;
}

const Users = () => {
  const { 
    user, 
    userRole, 
    businessSettings,
    getUserBusinessRole,
    businessRole,
    getBusinessUsers,
    inviteUserToBusiness,
    removeUserFromBusiness,
    updateBusinessUserRole,
    changeUserPassword
  } = useReview();
  const { toast } = useToast();
  
  const [businessUsers, setBusinessUsers] = useState<BusinessUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<BusinessUser | null>(null);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'business_admin' | 'business_user'>('business_user');
  const [inviteLoading, setInviteLoading] = useState(false);
  
  // Password form state
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Check user permissions
  useEffect(() => {
    const checkRole = async () => {
      if (user && businessSettings) {
        await getUserBusinessRole();
      }
    };
    checkRole();
  }, [user, businessSettings, getUserBusinessRole]);

  // Load business users
  const loadBusinessUsers = async () => {
    setLoading(true);
    try {
      const users = await getBusinessUsers();
      setBusinessUsers(users);
    } catch (error) {
      console.error('Error loading business users:', error);
      toast({
        title: "Error",
        description: "Failed to load business users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessSettings) {
      loadBusinessUsers();
    }
  }, [businessSettings]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (userRole === 'super_admin') {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  // Only business owners and business admins can access this page
  if (businessRole !== 'business_admin') {
    return (
      <div className="p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to manage users for this business.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    setInviteLoading(true);
    try {
      await inviteUserToBusiness(inviteEmail, inviteRole);
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('business_user');
      await loadBusinessUsers(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to invite user.",
        variant: "destructive",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await removeUserFromBusiness(userId);
      await loadBusinessUsers(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove user.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'business_admin' | 'business_user') => {
    try {
      await updateBusinessUserRole(userId, newRole);
      await loadBusinessUsers(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a new password.",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      await changeUserPassword(selectedUser.user_id, newPassword);
      setPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password.",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Business Users</h1>
          <p className="text-muted-foreground">
            Manage users for your business account
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadBusinessUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90 text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite User to Business</DialogTitle>
                <DialogDescription>
                  Send an invitation to a user to join your business account.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={(value: 'business_admin' | 'business_user') => setInviteRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business_user">Business User</SelectItem>
                      <SelectItem value="business_admin">Business Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteUser} disabled={inviteLoading}>
                  {inviteLoading ? 'Inviting...' : 'Send Invite'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-accent" />
            Users ({businessUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : businessUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
              <p className="text-sm">Invite users to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {businessUsers.map((businessUser) => (
                <div key={businessUser.user_id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-card/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                      {businessUser.is_owner ? (
                        <Crown className="h-5 w-5 text-white" />
                      ) : businessUser.role === 'business_admin' ? (
                        <Shield className="h-5 w-5 text-white" />
                      ) : (
                        <User className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {businessUser.profiles.full_name}
                        {businessUser.is_owner && (
                          <Badge variant="default" className="ml-2">Owner</Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{businessUser.profiles.email}</p>
                      <Badge variant={businessUser.role === 'business_admin' ? 'default' : 'secondary'} className="mt-1">
                        {businessUser.role === 'business_admin' ? 'Admin' : 'User'}
                      </Badge>
                    </div>
                  </div>
                  
                  {!businessUser.is_owner && (
                    <div className="flex gap-2">
                      <Select 
                        value={businessUser.role} 
                        onValueChange={(value: 'business_admin' | 'business_user') => handleUpdateRole(businessUser.user_id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="business_user">User</SelectItem>
                          <SelectItem value="business_admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(businessUser);
                          setPasswordDialogOpen(true);
                        }}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove {businessUser.profiles.full_name} from your business? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleRemoveUser(businessUser.user_id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove User
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.profiles.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPasswordDialogOpen(false);
              setSelectedUser(null);
              setNewPassword('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={passwordLoading}>
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
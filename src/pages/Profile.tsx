import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReview } from '@/contexts/ReviewContext';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Building, Calendar, Save, Lock, Eye, EyeOff } from 'lucide-react';

const Profile = () => {
  const { user, businessSettings, updateBusinessSettings, changePassword } = useReview();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [businessName, setBusinessName] = useState(businessSettings?.businessName || '');
  
  // Password change states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSave = () => {
    if (businessName.trim()) {
      updateBusinessSettings({ businessName: businessName.trim() });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your business name has been updated successfully.",
      });
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    const success = await changePassword(currentPassword, newPassword);
    
    if (success) {
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast({
        title: "Password change failed",
        description: "Current password is incorrect.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile information and account settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">{/* Removed max-w-4xl constraint */}
        {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-accent" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="h-12 bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed after account creation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="businessName"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      disabled={!isEditing}
                      className={`h-12 ${!isEditing ? 'bg-muted/50' : ''}`}
                    />
                    {!isEditing ? (
                      <Button 
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit
                      </Button>
                    ) : (
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setBusinessName(businessSettings?.businessName || '');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSave}
                          className="bg-gradient-primary hover:opacity-90 text-white"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Account Created</Label>
                  <Input
                    value={new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    disabled
                    className="h-12 bg-muted/50"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Password Change Section */}
            <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-accent" />
                  <span>Password & Security</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isChangingPassword ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Password</p>
                        <p className="text-xs text-muted-foreground">
                          Last updated: Not available
                        </p>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => setIsChangingPassword(true)}
                      >
                        Change Password
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="h-12 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="h-12 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="h-12 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handlePasswordChange}
                        className="bg-gradient-primary hover:opacity-90 text-white"
                        disabled={!currentPassword || !newPassword || !confirmPassword}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Update Password
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Account Summary */}
          <div className="space-y-6">
            <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
              <CardHeader>
                <CardTitle className="text-lg">Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Building className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Business</p>
                    <p className="text-xs text-muted-foreground">
                      {businessSettings?.businessName || 'Not set'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-accent/10 p-2 rounded-lg">
                    <Mail className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Contact</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-success/10 p-2 rounded-lg">
                    <Calendar className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Member Since</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/settings">
                    Configure Review Settings
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/reviews">
                    View All Reviews
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link 
                    to={`/review/${user.businessAccountId}`}
                    target="_blank"
                  >
                    Preview Review Form
                  </Link>
                </Button>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
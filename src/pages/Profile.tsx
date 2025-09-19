import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReview } from '@/contexts/ReviewContext';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Building, Calendar, Save, Lock, Eye, EyeOff, Copy } from 'lucide-react';

const Profile = () => {
  const { user, businessSettings, updateBusinessSettings, changePassword, profile } = useReview();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [businessName, setBusinessName] = useState(businessSettings?.business_name || '');
  
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
      updateBusinessSettings({ business_name: businessName.trim() });
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

    try {
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} has been copied to your clipboard.`,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile & Account</h1>
        <p className="text-muted-foreground">
          Manage your personal information, business details, and account settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Information */}
        <div className="space-y-6">
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-accent" />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input value={user.email} disabled className="bg-muted/50" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Business Name</Label>
                  {!isEditing ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setBusinessName(businessSettings?.business_name || '');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleSave}
                        className="bg-gradient-primary hover:opacity-90 text-white"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>
                
                {isEditing ? (
                  <Input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Enter your business name"
                  />
                ) : (
                  <Input
                    value={businessSettings?.business_name || 'Not set'}
                    disabled
                    className="bg-muted/50"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Account Created</Label>
                <Input
                  value={new Date(user.created_at || '').toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  disabled
                  className="bg-muted/50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-accent" />
                <span>Change Password</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isChangingPassword ? (
                <Button 
                  onClick={() => setIsChangingPassword(true)}
                  className="bg-gradient-primary hover:opacity-90 text-white"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
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
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
                      disabled={!currentPassword || !newPassword || !confirmPassword}
                      className="bg-gradient-primary hover:opacity-90 text-white"
                    >
                      Update Password
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Account Summary & Quick Actions */}
        <div className="space-y-6">
          {/* Account Summary */}
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-accent" />
                <span>Account Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 border border-border/50 rounded-lg bg-card/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Business Name</span>
                  </div>
                  <p className="text-foreground">{businessSettings?.business_name || 'Not set'}</p>
                </div>

                <div className="p-4 border border-border/50 rounded-lg bg-card/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Email Address</span>
                  </div>
                  <p className="text-foreground">{user.email}</p>
                </div>

                <div className="p-4 border border-border/50 rounded-lg bg-card/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Member Since</span>
                  </div>
                  <p className="text-foreground">
                    {new Date(user.created_at || '').toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" asChild className="justify-start h-auto p-4">
                  <Link to="/reviews">
                    <div className="flex flex-col items-start space-y-1">
                      <span className="font-medium">Manage Reviews</span>
                      <span className="text-xs text-muted-foreground">View and manage customer reviews</span>
                    </div>
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="justify-start h-auto p-4">
                  <Link to="/settings">
                    <div className="flex flex-col items-start space-y-1">
                      <span className="font-medium">Business Settings</span>
                      <span className="text-xs text-muted-foreground">Configure review thresholds and URLs</span>
                    </div>
                  </Link>
                </Button>

                <Button variant="outline" asChild className="justify-start h-auto p-4">
                  <Link to={`/review?businessAccountId=${user.id}`} target="_blank">
                    <div className="flex flex-col items-start space-y-1">
                      <span className="font-medium">Preview Review Form</span>
                      <span className="text-xs text-muted-foreground">See how customers view your form</span>
                    </div>
                  </Link>
                </Button>
              </div>

              {/* Shareable Review Form URL */}
              <div className="pt-4 border-t border-border/50">
                <Label className="text-sm font-medium mb-2 block">Public Review Form URL</Label>
                <div className="flex space-x-2">
                  <Input
                    value={`${window.location.origin}/review?businessAccountId=${user.id}`}
                    disabled
                    className="bg-muted/50 font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(
                      `${window.location.origin}/review?businessAccountId=${user.id}`,
                      'Review form URL'
                    )}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Share this URL with customers to collect reviews
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
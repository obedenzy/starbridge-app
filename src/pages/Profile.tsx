import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReview } from '@/contexts/ReviewContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Mail, Building, Calendar, Save } from 'lucide-react';

const Profile = () => {
  const { user, businessSettings, updateBusinessSettings } = useReview();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [businessName, setBusinessName] = useState(businessSettings?.businessName || '');

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
                    to={`/review/${businessSettings?.businessName.toLowerCase().replace(/\s+/g, '-') || '#'}`}
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
import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useReview } from '@/contexts/ReviewContext';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Save, Building, Mail, User as UserIcon, Copy, Eye } from 'lucide-react';

const Settings = () => {
  const { user, businessSettings, updateBusinessSettings } = useReview();
  const { toast } = useToast();
  
  const [businessName, setBusinessName] = useState(businessSettings?.business_name || '');
  const [email, setEmail] = useState(businessSettings?.contact_email || '');

  if (!user || !businessSettings) {
    return <Navigate to="/login" replace />;
  }

  const handleSave = () => {
    updateBusinessSettings({
      business_name: businessName.trim(),
      contact_email: email.trim()
    });
    
    toast({
      title: "Settings saved",
      description: "Your business account settings have been updated successfully.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Business Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your business account information and preferences.
        </p>
      </div>

      <div className="space-y-6">{/* Removed max-w-2xl constraint */}
        {/* Account Information */}
        <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserIcon className="w-5 h-5 text-accent" />
              <span>Account Information</span>
            </CardTitle>
            <CardDescription>
              Your account details and basic information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input value={user.email} disabled className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>Account ID</Label>
                <div className="flex space-x-2">
                  <Input value={user.id} disabled className="bg-muted/50 font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(user.id);
                      toast({ title: "Copied to clipboard" });
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Member Since</Label>
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

        {/* Business Information */}
        <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-accent" />
              <span>Business Information</span>
            </CardTitle>
            <CardDescription>
              Update your business details and contact information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Enter your business name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="business@example.com"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={handleSave}
                className="bg-gradient-primary hover:opacity-90 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Security */}
        <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="w-5 h-5 text-accent" />
              <span>Account Security</span>
            </CardTitle>
            <CardDescription>
              Manage your account security and password settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                For security reasons, password changes can be done through your profile page.
              </p>
              <Button variant="outline" asChild>
                <Link to="/profile">
                  <Eye className="w-4 h-4 mr-2" />
                  Go to Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
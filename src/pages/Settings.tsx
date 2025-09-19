import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useReview } from '@/contexts/ReviewContext';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Save, Building, Mail, User as UserIcon } from 'lucide-react';

const Settings = () => {
  const { user, businessSettings, updateBusinessSettings } = useReview();
  const { toast } = useToast();
  
  const [businessName, setBusinessName] = useState(businessSettings?.businessName || '');
  const [email, setEmail] = useState(businessSettings?.email || '');

  if (!user || !businessSettings) {
    return <Navigate to="/login" replace />;
  }

  const handleSave = () => {
    updateBusinessSettings({
      businessName: businessName.trim(),
      email: email.trim()
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

      <div className="space-y-6 max-w-2xl">
        {/* Account Information */}
        <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserIcon className="w-5 h-5 text-accent" />
              <span>Account Information</span>
            </CardTitle>
            <CardDescription>
              View your account details and business account ID
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Email</Label>
                <Input
                  value={user.email}
                  readOnly
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Business Account ID</Label>
                <Input
                  value={user.businessAccountId}
                  readOnly
                  className="bg-muted/50 font-mono text-xs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Member Since</Label>
              <Input
                value={new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                readOnly
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
              Update your business details displayed to customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter your business name"
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                This name will be displayed on your review forms and public pages
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Business Contact Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@yourbusiness.com"
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                This email may be shown to customers for follow-up communications
              </p>
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
              Manage your account security and access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm">
                <strong>Password Management:</strong> To change your password or update security settings, 
                please contact support or use the password reset feature on the login page.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            size="lg"
            className="bg-gradient-primary hover:opacity-90 text-white shadow-glow"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
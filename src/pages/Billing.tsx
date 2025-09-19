import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useReview } from '@/contexts/ReviewContext';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { 
  Crown, 
  CreditCard, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Calendar,
  DollarSign,
  Building,
  Mail,
  IdCard,
  Target,
  Star,
  Link as LinkIcon,
  QrCode,
  Save
} from 'lucide-react';

const Billing = () => {
  const { 
    user, 
    businessSettings, 
    subscriptionStatus, 
    userRole, 
    createCheckout, 
    openCustomerPortal,
    checkSubscription,
    updateBusinessSettings
  } = useReview();
  const { toast } = useToast();

  // Review settings state
  const [reviewThreshold, setReviewThreshold] = useState(businessSettings?.review_threshold || 4);
  const [googleReviewUrl, setGoogleReviewUrl] = useState(businessSettings?.google_review_url || '');

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (userRole === 'super_admin') {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  const handleRefreshSubscription = async () => {
    try {
      await checkSubscription();
      toast({
        title: "Subscription Status Updated",
        description: "Your subscription status has been refreshed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh subscription status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveReviewSettings = () => {
    updateBusinessSettings({
      review_threshold: reviewThreshold,
      google_review_url: googleReviewUrl.trim()
    });
    
    toast({
      title: "Review settings saved",
      description: "Your review settings have been updated successfully.",
    });
  };

  const previewUrl = businessSettings?.public_path 
    ? `${window.location.origin}/review?business=${businessSettings.public_path}`
    : '';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription, billing information, and review settings.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan */}
        <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-accent" />
              Current Plan
            </CardTitle>
            <CardDescription>
              {subscriptionStatus?.subscribed 
                ? "Your business account is active" 
                : "Your business account needs activation"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={subscriptionStatus?.subscribed ? "default" : "secondary"}>
                {subscriptionStatus?.subscribed ? (
                  <><CheckCircle2 className="h-3 w-3 mr-1" /> Business Pro</>
                ) : (
                  <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                )}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Price</span>
              <span className="text-sm font-semibold">$250/month</span>
            </div>

            {subscriptionStatus?.subscribed && subscriptionStatus?.subscription_end && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Next billing</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(subscriptionStatus.subscription_end).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Management */}
        <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-accent" />
              Subscription Management
            </CardTitle>
            <CardDescription>
              Manage your subscription and payment details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {subscriptionStatus?.subscribed ? (
              <>
                <Button 
                  onClick={openCustomerPortal} 
                  className="w-full bg-gradient-primary hover:opacity-90 text-white"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage Payment & Cancel
                </Button>
                <Button 
                  onClick={handleRefreshSubscription} 
                  variant="outline" 
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={createCheckout} 
                  className="w-full bg-gradient-primary hover:opacity-90 text-white"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Subscribe to Business Pro
                </Button>
                <Button 
                  onClick={handleRefreshSubscription} 
                  variant="outline" 
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Payment Status
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Review Settings */}
      <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-accent" />
            Review Settings
          </CardTitle>
          <CardDescription>
            Configure your review collection preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reviewThreshold">Rating Threshold</Label>
                <Input
                  id="reviewThreshold"
                  type="number"
                  min="1"
                  max="5"
                  value={reviewThreshold}
                  onChange={(e) => setReviewThreshold(parseInt(e.target.value) || 4)}
                  placeholder="4"
                />
                <p className="text-xs text-muted-foreground">
                  Reviews with {reviewThreshold}+ stars will be sent to Google Reviews
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleReviewUrl">Google Review URL</Label>
                <Input
                  id="googleReviewUrl"
                  type="url"
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  Customers with high ratings will be redirected here
                </p>
              </div>

              <Button 
                onClick={handleSaveReviewSettings}
                className="w-full bg-gradient-primary hover:opacity-90 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Review Settings
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Preview URL QR Code</Label>
                {previewUrl ? (
                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg bg-background">
                      <QRCodeGenerator 
                        text={previewUrl} 
                        size={150}
                        className="mx-auto"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Share this URL with customers:</p>
                      <div className="flex gap-2">
                        <Input
                          value={previewUrl}
                          readOnly
                          className="bg-muted/50 text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(previewUrl);
                            toast({ title: "URL copied to clipboard" });
                          }}
                        >
                          <LinkIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <QrCode className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      QR code will appear here once your business is set up
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Business Pro Plan Features */}
      <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Business Pro Plan Features
          </CardTitle>
          <CardDescription>
            Everything you need to manage your business reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Unlimited review collection</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Custom review forms</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">QR code generation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Review analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Email notifications</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Priority support</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Business Information */}
      <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-accent" />
            Business Information
          </CardTitle>
          <CardDescription>
            Your business account details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Business Name</label>
              <p className="text-foreground">{businessSettings?.business_name || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Contact Email</label>
              <p className="text-foreground">{businessSettings?.contact_email || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Account Status</label>
              <Badge variant={businessSettings?.status === 'active' ? 'default' : 'secondary'}>
                {businessSettings?.status || 'Unknown'}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Account ID</label>
              <p className="text-foreground font-mono text-xs">{businessSettings?.id || 'Not available'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;
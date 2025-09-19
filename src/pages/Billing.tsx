import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useReview } from '@/contexts/ReviewContext';
import { 
  CreditCard, 
  Crown, 
  Check, 
  Calendar,
  DollarSign,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const Billing = () => {
  const { user, userRole, subscriptionStatus, businessSettings, createCheckout, openCustomerPortal, checkSubscription } = useReview();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (userRole === 'super_admin') {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  const handleRefreshSubscription = async () => {
    await checkSubscription();
  };

  const isSubscribed = subscriptionStatus?.subscribed;
  const subscriptionEnd = subscriptionStatus?.subscription_end;

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Billing & Subscription
        </h1>
        <p className="text-muted-foreground">
          Manage your subscription, view billing history, and update payment methods.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Current Plan
            </CardTitle>
            <CardDescription>
              {isSubscribed 
                ? "Your business account is active with full access to all features" 
                : "Upgrade to unlock all premium features for your business"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Business Pro Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    {isSubscribed ? "Active subscription" : "Not subscribed"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={isSubscribed ? "default" : "secondary"} className="mb-2">
                  {isSubscribed ? (
                    <><Check className="h-3 w-3 mr-1" /> Active</>
                  ) : (
                    <><AlertCircle className="h-3 w-3 mr-1" /> Inactive</>
                  )}
                </Badge>
                <p className="text-2xl font-bold">$250<span className="text-sm text-muted-foreground">/month</span></p>
              </div>
            </div>

            {/* Subscription Details */}
            {isSubscribed && subscriptionEnd && (
              <div className="space-y-4">
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Next billing date</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(subscriptionEnd).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Billing amount</p>
                      <p className="text-sm text-muted-foreground">$250.00 USD</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {isSubscribed ? (
                <>
                  <Button onClick={openCustomerPortal} className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Manage Subscription
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleRefreshSubscription}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Status
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={createCheckout} className="flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    Subscribe to Business Pro
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleRefreshSubscription}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Check Payment Status
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plan Features */}
        <Card>
          <CardHeader>
            <CardTitle>Business Pro Features</CardTitle>
            <CardDescription>
              Everything you need to manage and grow your business reviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Unlimited review collection",
                "Advanced analytics dashboard", 
                "Custom review forms",
                "Email notifications",
                "Export reviews data",
                "Priority customer support",
                "Business branding options",
                "Advanced reporting tools"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Your business details associated with this subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Business Name</p>
                <p className="text-sm">{businessSettings?.business_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact Email</p>
                <p className="text-sm">{businessSettings?.contact_email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Account Status</p>
                <Badge variant={businessSettings?.status === 'active' ? 'default' : 'secondary'}>
                  {businessSettings?.status || 'Unknown'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Account ID</p>
                <p className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {user.id.slice(0, 8)}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Billing;
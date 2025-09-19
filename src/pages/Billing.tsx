import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReview } from '@/contexts/ReviewContext';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { 
  Crown, 
  CreditCard, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Target,
  Building,
  Receipt,
  ExternalLink,
  Download
} from 'lucide-react';

const Billing = () => {
  const { 
    user, 
    businessSettings, 
    subscriptionStatus, 
    userRole, 
    createCheckout, 
    openCustomerPortal,
    refreshSubscriptionStatus,
    getInvoices
  } = useReview();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  // Auto-refresh subscription status every 2 minutes
  useEffect(() => {
    if (!user) return;
    
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing subscription status (Billing page)...');
      refreshSubscriptionStatus();
    }, 2 * 60 * 1000); // Refresh every 2 minutes

    return () => clearInterval(refreshInterval);
  }, [user, refreshSubscriptionStatus]);

  // Load invoices
  useEffect(() => {
    const loadInvoices = async () => {
      setLoadingInvoices(true);
      try {
        const invoiceData = await getInvoices();
        setInvoices(invoiceData);
      } catch (error) {
        console.error('Error loading invoices:', error);
      } finally {
        setLoadingInvoices(false);
      }
    };

    if (user && subscriptionStatus?.subscribed) {
      loadInvoices();
    } else {
      setLoadingInvoices(false);
    }
  }, [user, subscriptionStatus?.subscribed, getInvoices]);


  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (userRole === 'super_admin') {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  const handleRefreshSubscription = async () => {
    await refreshSubscriptionStatus();
  };



  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information.
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
            <span className="text-sm font-semibold">
              {businessSettings?.custom_subscription_amount 
                ? `$${(businessSettings.custom_subscription_amount / 100).toFixed(2)}/month`
                : '$250/month'
              }
            </span>
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

      {/* Invoice History */}
      {subscriptionStatus?.subscribed && (
        <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-accent" />
              Invoice History
            </CardTitle>
            <CardDescription>
              Your recent billing history and invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingInvoices ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No invoices found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-card/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-foreground">
                          {invoice.number || `Invoice #${invoice.id.slice(-8)}`}
                        </span>
                        <Badge variant={invoice.status === 'paid' ? 'default' : invoice.status === 'open' ? 'secondary' : 'destructive'}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{invoice.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(invoice.created * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold">
                        ${(invoice.amount_paid / 100).toFixed(2)}
                      </span>
                      <div className="flex gap-2">
                        {invoice.hosted_invoice_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(invoice.hosted_invoice_url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        {invoice.invoice_pdf && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(invoice.invoice_pdf, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
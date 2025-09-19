import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, AlertCircle, CheckCircle, X } from "lucide-react";

interface BusinessWithSubscription {
  id: string;
  business_name: string;
  contact_email: string;
  status: string;
  subscription_status: string | null;
  subscription_end_date: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  payment_failed_at: string | null;
}

export function SuperAdminSubscriptions() {
  const [businesses, setBusinesses] = useState<BusinessWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error('Error loading businesses:', error);
      toast({
        title: "Error",
        description: "Failed to load business accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBusinessStatus = async (businessId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('business_settings')
        .update({ status: newStatus })
        .eq('id', businessId);

      if (error) throw error;

      setBusinesses(prev => 
        prev.map(business => 
          business.id === businessId 
            ? { ...business, status: newStatus }
            : business
        )
      );

      toast({
        title: "Success",
        description: `Business account ${newStatus === 'active' ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error updating business status:', error);
      toast({
        title: "Error",
        description: "Failed to update business status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (business: BusinessWithSubscription) => {
    if (business.payment_failed_at) {
      return <Badge variant="destructive">Payment Failed</Badge>;
    }
    
    if (business.subscription_status === 'active') {
      return <Badge variant="default">Active Subscription</Badge>;
    }
    
    if (business.subscription_status === 'cancelled') {
      return <Badge variant="secondary">Cancelled</Badge>;
    }
    
    if (business.status === 'active') {
      return <Badge variant="outline">Active (No Subscription)</Badge>;
    }
    
    return <Badge variant="secondary">Inactive</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Subscription Management</h2>
        <p className="text-muted-foreground">
          Manage business account subscriptions and billing status
        </p>
      </div>

      <div className="grid gap-4">
        {businesses.map((business) => (
          <Card key={business.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {business.business_name}
                  </CardTitle>
                  <CardDescription>{business.contact_email}</CardDescription>
                </div>
                {getStatusBadge(business)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Subscription Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Status:</span>
                    <p className="text-muted-foreground">{business.status}</p>
                  </div>
                  <div>
                    <span className="font-medium">Subscription:</span>
                    <p className="text-muted-foreground">
                      {business.subscription_status || 'None'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Next Billing:</span>
                    <p className="text-muted-foreground">
                      {business.subscription_end_date 
                        ? new Date(business.subscription_end_date).toLocaleDateString()
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>

                {/* Payment Failed Warning */}
                {business.payment_failed_at && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">
                      Payment failed on {new Date(business.payment_failed_at).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {business.status === 'active' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateBusinessStatus(business.id, 'inactive')}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => updateBusinessStatus(business.id, 'active')}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Activate
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {businesses.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No business accounts found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
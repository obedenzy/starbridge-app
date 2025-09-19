import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReview } from "@/contexts/ReviewContext";
import { Check, Crown, CreditCard } from "lucide-react";

export function SubscriptionStatus() {
  const { subscriptionStatus, createCheckout, openCustomerPortal } = useReview();

  if (!subscriptionStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Subscription Status
          </CardTitle>
          <CardDescription>Loading subscription information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Subscription Status
        </CardTitle>
        <CardDescription>
          {subscriptionStatus.subscribed 
            ? "Your business account is active" 
            : "Upgrade to unlock all features"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          <Badge variant={subscriptionStatus.subscribed ? "default" : "secondary"}>
            {subscriptionStatus.subscribed ? (
              <><Check className="h-3 w-3 mr-1" /> Active</>
            ) : (
              "Inactive"
            )}
          </Badge>
        </div>
        
        {subscriptionStatus.subscribed && subscriptionStatus.subscription_end && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Next billing</span>
            <span className="text-sm text-muted-foreground">
              {new Date(subscriptionStatus.subscription_end).toLocaleDateString()}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          {subscriptionStatus.subscribed ? (
            <Button onClick={() => window.location.href = '/billing'} variant="outline" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Manage Subscription
            </Button>
          ) : (
            <Button onClick={createCheckout} className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Upgrade to Pro ($250/month)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
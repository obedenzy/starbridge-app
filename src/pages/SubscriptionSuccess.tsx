import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useReview } from "@/contexts/ReviewContext";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const { checkSubscription, subscriptionStatus } = useReview();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifySubscription = async () => {
      // Wait a moment for Stripe to process the subscription
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check subscription status
      await checkSubscription();
      setIsChecking(false);
    };

    verifySubscription();
  }, [checkSubscription]);

  // Separate effect to handle navigation when subscription status is confirmed
  useEffect(() => {
    if (!isChecking && subscriptionStatus?.subscribed) {
      // Wait a moment to show success state, then navigate
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    }
  }, [isChecking, subscriptionStatus, navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-elegant">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              {isChecking ? (
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              ) : (
                <CheckCircle className="w-12 h-12 text-green-500" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              {isChecking ? "Processing Subscription..." : "Subscription Activated!"}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            {isChecking ? (
              <div>
                <p className="text-muted-foreground mb-4">
                  We're setting up your business account. This will only take a moment.
                </p>
                <div className="flex justify-center">
                  <div className="animate-pulse text-sm text-primary">
                    Activating your subscription...
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground mb-4">
                  Your Business Pro subscription is now active! You have full access to all features.
                </p>
                <p className="text-sm text-green-600 font-medium">
                  Redirecting to your dashboard...
                </p>
                
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="mt-4 w-full bg-gradient-primary hover:opacity-90"
                >
                  Go to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
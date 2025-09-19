import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Star, Check } from "lucide-react";
import { useReview } from "@/contexts/ReviewContext";

export function SubscriptionPrompt() {
  const { createCheckout } = useReview();

  const features = [
    "Unlimited review collection",
    "Advanced analytics dashboard", 
    "Custom review forms",
    "Email notifications",
    "Public review pages",
    "Export capabilities"
  ];

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl">
              <Crown className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Upgrade to Business Pro</h1>
          <p className="text-white/80">Subscribe to access your business dashboard and start collecting reviews</p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-elegant">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <Star className="w-6 h-6 text-primary" />
              Business Pro Plan
            </CardTitle>
            <CardDescription>
              Everything you need to manage and grow your business reputation
            </CardDescription>
            <div className="text-center mt-4">
              <span className="text-4xl font-bold text-primary">$250</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <Button 
              onClick={createCheckout} 
              className="w-full h-12 bg-gradient-primary hover:opacity-90 text-white font-semibold shadow-glow"
              size="lg"
            >
              <Crown className="w-5 h-5 mr-2" />
              Subscribe Now
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Secure payment powered by Stripe. Cancel anytime.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
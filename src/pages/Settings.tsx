import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { StarRating } from '@/components/StarRating';
import { useReview } from '@/contexts/ReviewContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Settings as SettingsIcon, ExternalLink, Save, Copy, Eye } from 'lucide-react';

const Settings = () => {
  const { user, businessSettings, updateBusinessSettings } = useReview();
  const { toast } = useToast();
  
  const [googleUrl, setGoogleUrl] = useState(businessSettings?.googleReviewUrl || '');
  const [threshold, setThreshold] = useState(businessSettings?.threshold || 4);
  const [customMessage, setCustomMessage] = useState(businessSettings?.customMessage || '');

  if (!user || !businessSettings) {
    return <Navigate to="/login" replace />;
  }

  const handleSave = () => {
    updateBusinessSettings({
      googleReviewUrl: googleUrl.trim(),
      threshold: threshold,
      customMessage: customMessage.trim()
    });
    
    toast({
      title: "Settings saved",
      description: "Your review settings have been updated successfully.",
    });
  };

  const reviewUrl = `${window.location.origin}/review/${businessSettings.businessName.toLowerCase().replace(/\s+/g, '-')}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(reviewUrl);
    toast({
      title: "Link copied!",
      description: "Review form link has been copied to your clipboard.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Review Settings</h1>
            <p className="text-muted-foreground">
              Configure how your review system works and customize the user experience.
            </p>
          </div>

          {/* Review Form Link */}
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ExternalLink className="w-5 h-5 text-accent" />
                <span>Review Form Link</span>
              </CardTitle>
              <CardDescription>
                Share this link with your customers to collect reviews
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={reviewUrl}
                  readOnly
                  className="h-12 bg-muted/50 font-mono text-sm"
                />
                <Button variant="outline" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" asChild>
                  <Link to={`/review/${businessSettings.businessName.toLowerCase().replace(/\s+/g, '-')}`} target="_blank">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rating Threshold */}
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <SettingsIcon className="w-5 h-5 text-accent" />
                <span>Rating Threshold</span>
              </CardTitle>
              <CardDescription>
                Set the minimum rating to redirect customers to Google Reviews. 
                Lower ratings will be collected internally for your improvement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Threshold Rating</Label>
                  <div className="flex items-center space-x-2">
                    <StarRating rating={threshold} readonly size="sm" />
                    <span className="text-sm font-medium">({threshold} stars)</span>
                  </div>
                </div>
                <Slider
                  value={[threshold]}
                  onValueChange={(value) => setThreshold(value[0])}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <div key={rating} className="text-center">
                      {rating} star{rating !== 1 ? 's' : ''}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>How it works:</strong> Customers who rate {threshold}+ stars will be redirected to 
                  your Google Review page (if configured). Lower ratings will be collected privately 
                  for your internal improvement.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Google Reviews Integration */}
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
            <CardHeader>
              <CardTitle>Google Reviews Integration</CardTitle>
              <CardDescription>
                Add your Google My Business review URL to redirect happy customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="googleUrl">Google Review URL</Label>
                <Input
                  id="googleUrl"
                  value={googleUrl}
                  onChange={(e) => setGoogleUrl(e.target.value)}
                  placeholder="https://g.page/your-business/review"
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground">
                  Find your Google review link in Google My Business → Customers → Reviews → Get more reviews
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Custom Message */}
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
            <CardHeader>
              <CardTitle>Thank You Message</CardTitle>
              <CardDescription>
                Customize the message shown to customers after they submit a review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="customMessage">Custom Thank You Message</Label>
                <Textarea
                  id="customMessage"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Thank you for your feedback! Your review helps us improve our service."
                  className="min-h-[100px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  This message will be displayed after customers submit their review
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
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
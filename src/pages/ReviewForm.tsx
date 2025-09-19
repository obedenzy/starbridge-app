import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from '@/components/StarRating';
import { useReview } from '@/contexts/ReviewContext';
import { useToast } from '@/hooks/use-toast';
import { Star, ExternalLink, CheckCircle } from 'lucide-react';

const ReviewForm = () => {
  const { businessAccountId } = useParams<{ businessAccountId: string }>();
  const { getBusinessByAccountId, addReview } = useReview();
  const { toast } = useToast();
  
  const [business, setBusiness] = useState(null);
  const [rating, setRating] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (businessAccountId) {
      const foundBusiness = getBusinessByAccountId(businessAccountId);
      setBusiness(foundBusiness);
    }
  }, [businessAccountId, getBusinessByAccountId]);

  useEffect(() => {
    if (rating > 0 && business && rating >= business.threshold) {
      setShouldRedirect(true);
    } else {
      setShouldRedirect(false);
    }
  }, [rating, business]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!business || rating === 0) return;
    
    setIsSubmitting(true);

    try {
      // If rating meets threshold and Google URL exists, redirect to Google
      if (shouldRedirect && business.googleReviewUrl) {
        window.open(business.googleReviewUrl, '_blank');
        setIsSubmitted(true);
        toast({
          title: "Thank you!",
          description: "You've been redirected to leave a Google review.",
        });
        return;
      }

      // Otherwise, save the review locally
      addReview({
        rating,
        name,
        email,
        comment,
        businessId: business.id,
        isPublic: true
      });

      setIsSubmitted(true);
      toast({
        title: "Review submitted!",
        description: business.customMessage || "Thank you for your feedback!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleRedirect = () => {
    if (business?.googleReviewUrl) {
      window.open(business.googleReviewUrl, '_blank');
      setIsSubmitted(true);
    }
  };

  if (!business) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Business Not Found</h2>
            <p className="text-muted-foreground">
              The review form you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-success" />
            <h2 className="text-2xl font-bold mb-4 text-success">Thank You!</h2>
            <p className="text-muted-foreground mb-6">
              {business.customMessage || "Your feedback has been submitted successfully."}
            </p>
            {shouldRedirect && business.googleReviewUrl && (
              <Button 
                onClick={handleGoogleRedirect}
                className="bg-gradient-primary hover:opacity-90 text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Leave Google Review
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl">
              <Star className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{business.businessName}</h1>
          <p className="text-white/80">We'd love to hear about your experience</p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-elegant">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Share Your Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating Selection */}
              <div className="text-center">
                <Label className="text-lg font-medium mb-4 block">How was your experience?</Label>
                <div className="flex justify-center mb-4">
                  <StarRating 
                    rating={rating} 
                    onRatingChange={setRating} 
                    size="lg" 
                  />
                </div>
                {rating > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {rating >= 4 ? "Great! " : ""}
                    {rating >= business.threshold && business.googleReviewUrl
                      ? "You'll be redirected to Google to share your positive experience."
                      : "Please tell us more about your experience below."
                    }
                  </p>
                )}
              </div>

              {/* Redirect Notice */}
              {shouldRedirect && business.googleReviewUrl && (
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 text-center">
                  <p className="text-accent font-medium mb-2">
                    Thank you for the great rating! 🌟
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Would you mind sharing your positive experience on Google?
                  </p>
                  <Button
                    type="button"
                    onClick={handleGoogleRedirect}
                    className="bg-gradient-primary hover:opacity-90 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Leave Google Review
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Or continue below to leave feedback here
                  </p>
                </div>
              )}

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter your name"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="h-12"
                  />
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <Label htmlFor="comment">
                  {rating >= 4 ? "What did you love about our service?" : "How can we improve?"}
                </Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    rating >= 4 
                      ? "Tell us what made your experience great..."
                      : "Your feedback helps us improve our service..."
                  }
                  className="min-h-[100px] resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="w-full h-12 bg-gradient-primary hover:opacity-90 text-white font-semibold shadow-glow"
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReviewForm;

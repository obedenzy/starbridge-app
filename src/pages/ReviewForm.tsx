import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from '@/components/StarRating';
import { useReview } from '@/contexts/ReviewContext';
import { useToast } from '@/hooks/use-toast';
import { Star, ExternalLink, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ReviewForm = () => {
  const [searchParams] = useSearchParams();
  const businessAccountId = searchParams.get('businessAccountId');
  const { getBusinessByAccountId, addReview } = useReview();
  const { toast } = useToast();
  
  const [business, setBusiness] = useState(null);
  const [rating, setRating] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    console.log('ReviewForm mounted, businessAccountId:', businessAccountId);
    if (businessAccountId) {
      getBusinessByAccountId(businessAccountId).then(foundBusiness => {
        console.log('Found business:', foundBusiness);
        if (!foundBusiness) {
          console.log('Business not found for ID:', businessAccountId);
          console.log('This might be due to an incorrect business ID in the URL');
        }
        setBusiness(foundBusiness);
      });
    }
  }, [businessAccountId, getBusinessByAccountId]);

  const handleGoogleRedirect = () => {
    if (business?.google_review_url) {
      window.open(business.google_review_url, '_blank');
      setIsSubmitted(true);
    }
  };

  // Automatically redirect if rating is above threshold
  useEffect(() => {
    if (rating > 0 && business && rating >= business.review_threshold && business.google_review_url) {
      setShouldRedirect(true);
      // Small delay to allow user to see the rating before redirect
      const timer = setTimeout(() => {
        handleGoogleRedirect();
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setShouldRedirect(false);
    }
  }, [rating, business]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!business || rating === 0) return;
    
    setIsSubmitting(true);

    try {
      // High ratings are already handled by the useEffect redirect
      // This form submission is only for low ratings that need manual review

      // Otherwise, save the review locally
      const result = await addReview({
        rating,
        customer_name: name,
        customer_email: email,
        subject,
        comment,
        business_id: business.business_id // Corrected from business.id to business.business_id
      });

      if (result.success) {
        // Send email notifications via Supabase Edge Function
        try {
          const { data, error: emailError } = await supabase.functions.invoke('send-review-notification', {
            body: {
              reviewId: result.data?.id,
              businessId: business.business_id,
              customerName: name,
              customerEmail: email,
              rating,
              comment,
              subject
            }
          });

          if (emailError) {
            console.error('Error sending email notifications via Edge Function:', emailError);
          } else {
            console.log('Email notifications sent successfully via Edge Function:', data);
          }
        } catch (emailError) {
          console.error('Error invoking email Edge Function:', emailError);
        }
      }

      setIsSubmitted(true);
      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback! Confirmation emails have been sent.",
      });
    } catch (error: any) {
      console.error('Review submission error:', error);
      
      // Handle specific validation errors
      let errorMessage = "Failed to submit review. Please try again.";
      
      if (error?.message?.includes('Rate limit exceeded')) {
        errorMessage = "You've submitted too many reviews recently. Please wait before submitting another review.";
      } else if (error?.message?.includes('only submit one review per business per day')) {
        errorMessage = "You can only submit one review per business per day. Please try again tomorrow.";
      } else if (error?.message?.includes('business_id')) {
        errorMessage = "This business is currently not accepting reviews.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!businessAccountId) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Missing Business ID</h2>
            <p className="text-muted-foreground mb-4">
              No business account ID provided in the URL.
            </p>
            <p className="text-xs text-muted-foreground">
              URL should include: ?businessAccountId=YOUR_BUSINESS_ID
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Business Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The review form you're looking for doesn't exist or has been removed.
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              Requested Business ID: {businessAccountId}
            </p>
            <p className="text-xs text-muted-foreground">
              Please check the URL and ensure you have the correct business ID.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if business is active
  if (business.status !== 'active') {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Reviews Temporarily Unavailable</h2>
            <p className="text-muted-foreground mb-4">
              {business.business_name} is currently not accepting reviews.
            </p>
            <p className="text-xs text-muted-foreground">
              Please check back later or contact the business directly.
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
              Your feedback has been submitted successfully.
            </p>
            {shouldRedirect && business.google_review_url && (
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
          <h1 className="text-3xl font-bold text-white mb-2">{business.business_name}</h1>
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
                {rating > 0 && rating >= business.review_threshold && (
                  <p className="text-sm text-accent font-medium">
                    Thank you for the great rating! You will be redirected to Google Reviews.
                  </p>
                )}
              </div>

              {/* Form fields for ratings below threshold */}
              {rating > 0 && rating < business.review_threshold && (
                <>
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
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="your@email.com"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      placeholder="Brief summary of your review"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comment">Your Review</Label>
                    <Textarea
                      id="comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required
                      placeholder="Tell us about your experience..."
                      className="min-h-[120px] resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || rating === 0 || !name || !email || !subject || !comment}
                    className="w-full h-12 bg-gradient-primary hover:opacity-90 text-white font-semibold shadow-glow"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                  </Button>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReviewForm;

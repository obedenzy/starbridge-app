import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/StarRating';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReview } from '@/contexts/ReviewContext';
import { useToast } from '@/hooks/use-toast';
import { Search, MessageSquare, Calendar, Mail, User, Filter, Settings as SettingsIcon, ExternalLink, Save, Copy, Eye, QrCode } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Reviews = () => {
  const { user, getReviewsByBusiness, businessSettings, updateBusinessSettings } = useReview();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  
  // Settings state
  const [googleUrl, setGoogleUrl] = useState(businessSettings?.googleReviewUrl || '');
  const [threshold, setThreshold] = useState(businessSettings?.threshold || 4);
  const [customMessage, setCustomMessage] = useState(businessSettings?.customMessage || '');

  if (!user || !businessSettings) {
    return <Navigate to="/login" replace />;
  }

  const allReviews = getReviewsByBusiness(user.id);

  // Filter and sort reviews
  const filteredReviews = allReviews
    .filter(review => {
      const matchesSearch = review.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          review.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRating = filterRating === 'all' || review.rating.toString() === filterRating;
      
      return matchesSearch && matchesRating;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'bg-success text-success-foreground';
    if (rating >= 3) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  const handleSaveSettings = () => {
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Reviews Management</h1>
        <p className="text-muted-foreground">
          View and manage all reviews for {user.businessName}
        </p>
      </div>

      <Tabs defaultValue="reviews" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="settings">Review Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-6">
          {/* Filters and Search */}
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-accent" />
                <span>Filter Reviews</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, or comment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
                
                <Select value={filterRating} onValueChange={setFilterRating}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Filter by rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="highest">Highest Rating</SelectItem>
                    <SelectItem value="lowest">Lowest Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reviews List */}
          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <Card className="bg-gradient-card backdrop-blur-sm border-border/50">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold mb-2">No Reviews Found</h3>
                  <p className="text-muted-foreground mb-6">
                    {allReviews.length === 0 
                      ? "You haven't received any reviews yet. Share your review link to get started!"
                      : "No reviews match your current filters. Try adjusting your search criteria."
                    }
                  </p>
                  <Button onClick={() => copyToClipboard()} variant="outline">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Review Link
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">
                    Showing {filteredReviews.length} of {allReviews.length} reviews
                  </p>
                </div>

                {filteredReviews.map((review) => (
                  <Card key={review.id} className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover hover:shadow-elegant transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="bg-primary/10 p-3 rounded-full">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{review.name}</h3>
                            {review.email && (
                              <div className="flex items-center space-x-1 mt-1">
                                <Mail className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{review.email}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-2 mt-2">
                              <StarRating rating={review.rating} readonly size="sm" />
                              <Badge className={getRatingColor(review.rating)}>
                                {review.rating} Star{review.rating !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>

                      {review.comment && (
                        <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/30">
                          <p className="text-foreground leading-relaxed">{review.comment}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Review Form Link */}
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ExternalLink className="w-5 h-5 text-accent" />
                <span>Review Form Link</span>
              </CardTitle>
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
                <Button variant="outline" onClick={() => window.open(reviewUrl, '_blank')}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Generator */}
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-accent" />
                <span>QR Code</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QRCodeGenerator 
                text={reviewUrl} 
                size={200}
                className="mx-auto border rounded-lg"
              />
            </CardContent>
          </Card>

          <Separator />

          {/* Rating Threshold */}
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <SettingsIcon className="w-5 h-5 text-accent" />
                <span>Rating Threshold</span>
              </CardTitle>
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
              onClick={handleSaveSettings}
              size="lg"
              className="bg-gradient-primary hover:opacity-90 text-white shadow-glow"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reviews;
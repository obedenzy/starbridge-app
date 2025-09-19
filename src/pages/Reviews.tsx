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
  const { user, getReviewsByBusiness, businessSettings, updateBusinessSettings, profile } = useReview();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  
  // Settings state
  const [googleUrl, setGoogleUrl] = useState(businessSettings?.google_review_url || '');
  const [threshold, setThreshold] = useState(businessSettings?.review_threshold || 4);

  if (!user || !businessSettings) {
    return <Navigate to="/login" replace />;
  }

  const allReviews = getReviewsByBusiness(businessSettings.id);

  // Filter and sort reviews
  const filteredReviews = allReviews
    .filter(review => {
      const matchesSearch = review.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          review.subject.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRating = filterRating === 'all' || 
        (filterRating === 'high' && review.rating >= 4) ||
        (filterRating === 'low' && review.rating < 4) ||
        review.rating.toString() === filterRating;
      
      return matchesSearch && matchesRating;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

  const handleSaveSettings = () => {
    updateBusinessSettings({
      google_review_url: googleUrl
    });
    
    toast({
      title: "Settings saved",
      description: "Your review settings have been updated successfully.",
    });
  };

  const copyReviewUrl = () => {
    const url = `${window.location.origin}/review?businessAccountId=${user.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copied",
      description: "Review form URL has been copied to your clipboard.",
    });
  };

  const averageRating = allReviews.length > 0 
    ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length 
    : 0;

  const ratingCounts = {
    5: allReviews.filter(r => r.rating === 5).length,
    4: allReviews.filter(r => r.rating === 4).length,
    3: allReviews.filter(r => r.rating === 3).length,
    2: allReviews.filter(r => r.rating === 2).length,
    1: allReviews.filter(r => r.rating === 1).length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Reviews Management</h1>
          <p className="text-muted-foreground">
            Manage customer reviews for {profile?.business_name}
          </p>
        </div>
      </div>

      <Tabs defaultValue="reviews" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="share">Share & QR</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{allReviews.length}</div>
                  <div className="text-sm text-muted-foreground">Total Reviews</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{averageRating.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Average Rating</div>
                  <StarRating rating={averageRating} readonly size="sm" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{ratingCounts[5]}</div>
                  <div className="text-sm text-muted-foreground">5-Star Reviews</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {allReviews.filter(r => r.rating >= 4).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Positive Reviews</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-accent" />
                <span>Filter & Search</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Search Reviews</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or comment..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Filter by Rating</Label>
                  <Select value={filterRating} onValueChange={setFilterRating}>
                    <SelectTrigger>
                      <SelectValue placeholder="All ratings" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="high">4-5 Stars</SelectItem>
                      <SelectItem value="low">1-3 Stars</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Sort by</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
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
              </div>
            </CardContent>
          </Card>

          {/* Reviews List */}
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-accent" />
                  <span>Customer Reviews ({filteredReviews.length})</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredReviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No reviews found</h3>
                  <p className="text-muted-foreground mb-6">
                    {allReviews.length === 0 
                      ? "You haven't received any reviews yet. Share your review link to get started!"
                      : "No reviews match your current filters. Try adjusting your search criteria."
                    }
                  </p>
                  <Button onClick={copyReviewUrl} className="bg-gradient-primary hover:opacity-90 text-white">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Review Link
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <div key={review.id} className="p-6 border border-border/50 rounded-lg bg-card/50 hover:bg-card/70 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div>
                              <h4 className="font-medium text-foreground">{review.customer_name}</h4>
                              <p className="text-sm text-muted-foreground">Customer</p>
                            </div>
                            <Badge variant={review.rating >= 4 ? "default" : "secondary"}>
                              {review.rating >= 4 ? "Positive" : "Needs Attention"}
                            </Badge>
                          </div>
                          <div className="mb-3">
                            <StarRating rating={review.rating} readonly size="sm" />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      {review.subject && (
                        <div className="mb-3">
                          <h5 className="font-medium text-foreground">{review.subject}</h5>
                        </div>
                      )}
                      
                      {review.comment && (
                        <div className="text-muted-foreground">
                          <p>{review.comment}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <SettingsIcon className="w-5 h-5 text-accent" />
                <span>Review Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="googleUrl">Google Review URL</Label>
                <Input
                  id="googleUrl"
                  value={googleUrl}
                  onChange={(e) => setGoogleUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
                <p className="text-sm text-muted-foreground">
                  Customers with high ratings will be redirected to this URL
                </p>
              </div>

              <div className="space-y-3">
                <Label>Rating Threshold: {threshold} stars</Label>
                <Slider
                  value={[threshold]}
                  onValueChange={(value) => setThreshold(value[0])}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Reviews with {threshold} stars or higher will redirect to Google Reviews
                </p>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveSettings}
                  className="bg-gradient-primary hover:opacity-90 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="share" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ExternalLink className="w-5 h-5 text-accent" />
                  <span>Share Review Form</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Review Form URL</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={`${window.location.origin}/review?businessAccountId=${user.id}`}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button variant="outline" onClick={copyReviewUrl}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button asChild className="w-full bg-gradient-primary hover:opacity-90 text-white">
                    <a 
                      href={`${window.location.origin}/review?businessAccountId=${user.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Review Form
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <QrCode className="w-5 h-5 text-accent" />
                  <span>QR Code</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QRCodeGenerator 
                  text={`${window.location.origin}/review?businessAccountId=${user.id}`}
                  size={200}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reviews;
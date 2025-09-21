import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StarRating } from '@/components/StarRating';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { useToast } from '@/hooks/use-toast';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  MessageSquare, 
  Star, 
  Search, 
  Filter,
  Download,
  Eye,
  Trash2,
  Calendar,
  Settings,
  Save,
  Link as LinkIcon,
  QrCode
} from 'lucide-react';
import { useReview } from '@/contexts/ReviewContext';
import { Review } from '@/contexts/ReviewContext';

const Reviews = () => {
  const { user, businessSettings, getReviewsByBusiness, updateBusinessSettings } = useReview();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // Review settings state
  const [reviewThreshold, setReviewThreshold] = useState('4');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [thankYouMessage, setThankYouMessage] = useState('Thank you for your feedback! We appreciate your time.');

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const loadReviews = async () => {
      if (!businessSettings) return;
      
      try {
        const data = await getReviewsByBusiness(businessSettings.business_id);
        setReviews(data);
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [businessSettings, getReviewsByBusiness]);

  // Update local state when businessSettings changes
  useEffect(() => {
    if (businessSettings) {
      setReviewThreshold(businessSettings.review_threshold?.toString() || '4');
      setGoogleReviewUrl(businessSettings.google_review_url || '');
      setThankYouMessage(businessSettings.thank_you_message || 'Thank you for your feedback! We appreciate your time.');
    }
  }, [businessSettings]);

  const handleSaveReviewSettings = () => {
    updateBusinessSettings({
      review_threshold: parseInt(reviewThreshold),
      google_review_url: googleReviewUrl.trim(),
      thank_you_message: thankYouMessage.trim()
    });
    
    toast({
      title: "Review settings saved",
      description: "Your review settings have been updated successfully.",
    });
  };

  const previewUrl = businessSettings?.business_id 
    ? `${window.location.origin}/review?businessAccountId=${businessSettings.business_id}`
    : '';

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter(review => {
      const matchesSearch = review.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (review.comment || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (review.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRating = filterRating === 'all' || 
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate statistics
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
    : 0;

  const ratingCounts = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Customer Name', 'Rating', 'Subject', 'Comment', 'Email'];
    const csvData = filteredReviews.map(review => [
      new Date(review.created_at).toLocaleDateString(),
      review.customer_name,
      review.rating,
      review.subject || '',
      (review.comment || '').replace(/,/g, ';'),
      review.customer_email || ''
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reviews-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reviews</h1>
          <p className="text-muted-foreground">
            Manage and analyze customer feedback for {businessSettings?.business_name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button asChild>
            <Link to={`/review?businessAccountId=${businessSettings?.business_id}`} target="_blank">
              <Eye className="w-4 h-4 mr-2" />
              Preview Form
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Reviews Overview</TabsTrigger>
          <TabsTrigger value="settings">Review Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Total Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalReviews}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Star className="w-4 h-4 mr-2" />
                  Average Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
                <StarRating rating={averageRating} readonly size="sm" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reviews.filter(r => 
                    new Date(r.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  ).length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">5-Star Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{ratingCounts[5]}</div>
                <div className="text-xs text-muted-foreground">
                  {totalReviews > 0 ? Math.round((ratingCounts[5] / totalReviews) * 100) : 0}% of total
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filter & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search Reviews</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="search"
                      placeholder="Search by customer name, comment, or subject..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Filter by Rating</Label>
                  <Select value={filterRating} onValueChange={setFilterRating}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
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
                </div>
                
                <div>
                  <Label>Sort by</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
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

          {/* Reviews Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Reviews ({filteredReviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredReviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
                  <p className="text-muted-foreground mb-4">
                    {reviews.length === 0 
                      ? "You haven't received any reviews yet. Share your review link to get started!"
                      : "No reviews match your current filters. Try adjusting your search criteria."
                    }
                  </p>
                  <Button asChild>
                    <Link to={`/review?businessAccountId=${businessSettings?.business_id}`} target="_blank">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Review Form
                    </Link>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{review.customer_name}</div>
                            {review.customer_email && (
                              <div className="text-sm text-muted-foreground">
                                {review.customer_email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StarRating rating={review.rating} readonly size="sm" />
                            <Badge 
                              variant={review.rating >= 4 ? 'default' : review.rating >= 3 ? 'secondary' : 'destructive'}
                            >
                              {review.rating}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{review.subject || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {review.comment ? (
                              <p className="text-sm line-clamp-2">{review.comment}</p>
                            ) : (
                              <span className="text-muted-foreground text-sm">No comment</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(review.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // TODO: Implement review details modal
                                console.log('View review details:', review.id);
                              }}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // TODO: Implement delete review
                                console.log('Delete review:', review.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Review Settings */}
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-accent" />
                Review Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reviewThreshold">Rating Threshold</Label>
                    <Select value={reviewThreshold} onValueChange={setReviewThreshold}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select rating threshold" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 Stars Only</SelectItem>
                        <SelectItem value="4">4+ Stars</SelectItem>
                        <SelectItem value="3">3+ Stars</SelectItem>
                        <SelectItem value="2">2+ Stars</SelectItem>
                        <SelectItem value="1">1+ Stars (All)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Reviews with {reviewThreshold}+ stars will be sent to Google Reviews
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="googleReviewUrl">Google Review URL</Label>
                    <Input
                      id="googleReviewUrl"
                      type="url"
                      value={googleReviewUrl}
                      onChange={(e) => setGoogleReviewUrl(e.target.value)}
                      placeholder="https://maps.google.com/..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Customers with high ratings will be redirected here
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thankYouMessage">Thank You Message</Label>
                    <Textarea
                      id="thankYouMessage"
                      value={thankYouMessage}
                      onChange={(e) => setThankYouMessage(e.target.value)}
                      placeholder="Thank you for your feedback! We appreciate your time."
                      className="min-h-[80px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Message shown to customers after submitting a review
                    </p>
                  </div>

                  <Button 
                    onClick={handleSaveReviewSettings}
                    className="w-full bg-gradient-primary hover:opacity-90 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Review Settings
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Preview URL QR Code</Label>
                    {previewUrl ? (
                      <div className="space-y-3">
                        <div className="p-4 border rounded-lg bg-background">
                          <QRCodeGenerator 
                            text={previewUrl} 
                            size={150}
                            className="mx-auto"
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Share this URL with customers:</p>
                          <div className="flex gap-2">
                            <Input
                              value={previewUrl}
                              readOnly
                              className="bg-muted/50 text-xs"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(previewUrl);
                                toast({ title: "URL copied to clipboard" });
                              }}
                            >
                              <LinkIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                        <QrCode className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          QR code will appear here once your business is set up
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reviews;
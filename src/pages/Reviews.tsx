import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/StarRating';
import { useReview } from '@/contexts/ReviewContext';
import { ArrowLeft, Search, MessageSquare, Calendar, Mail, User, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Reviews = () => {
  const { user, getReviewsByBusiness } = useReview();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  if (!user) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="max-w-6xl mx-auto px-6 py-8">
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Reviews Management</h1>
            <p className="text-muted-foreground">
              View and manage all reviews for {user.businessName}
            </p>
          </div>

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
                  <Button asChild variant="outline">
                    <Link to="/settings">Configure Review Link</Link>
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
        </div>
      </div>
    </div>
  );
};

export default Reviews;
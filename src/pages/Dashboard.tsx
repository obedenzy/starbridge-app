import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/ui/stats-card';
import { StarRating } from '@/components/StarRating';
import { SubscriptionStatus } from '@/components/SubscriptionStatus';
import { useReview } from '@/contexts/ReviewContext';
import { 
  BarChart3, 
  Star, 
  Users, 
  TrendingUp, 
  MessageSquare,
  Settings,
  UserCircle,
  Eye,
  LogOut
} from 'lucide-react';

interface Analytics {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { rating: number; count: number }[];
  recentReviews: any[];
}

const Dashboard = () => {
  const { user, userRole, getAnalytics, businessSettings, profile } = useReview();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect super admin to their dashboard
  if (userRole === 'super_admin') {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const data = await getAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (businessSettings) {
      loadAnalytics();
    } else {
      setLoading(false);
    }
  }, [getAnalytics, businessSettings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const defaultAnalytics = {
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: [],
    recentReviews: []
  };

  const displayAnalytics = analytics || defaultAnalytics;

  return (
    <div className="p-6 space-y-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {profile?.business_name}!
          </h2>
          <p className="text-muted-foreground">
            Here's an overview of your review performance and recent activity.
          </p>
        </div>

        <SubscriptionStatus />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Reviews"
            value={displayAnalytics.totalReviews}
            icon={<MessageSquare className="w-6 h-6" />}
          />
          <StatsCard
            title="Average Rating"
            value={displayAnalytics.averageRating || 0}
            icon={<Star className="w-6 h-6" />}
          />
          <StatsCard
            title="This Month"
            value={displayAnalytics.recentReviews.filter(r => 
              new Date(r.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            ).length}
            icon={<TrendingUp className="w-6 h-6" />}
          />
          <StatsCard
            title="Happy Customers"
            value={displayAnalytics.recentReviews.filter(r => r.rating >= 4).length}
            icon={<Users className="w-6 h-6" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Rating Distribution */}
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-accent" />
                <span>Rating Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const ratingData = displayAnalytics.ratingDistribution.find(r => r.rating === rating);
                  const count = ratingData?.count || 0;
                  const percentage = displayAnalytics.totalReviews > 0 
                    ? (count / displayAnalytics.totalReviews) * 100 
                    : 0;
                  
                  return (
                    <div key={rating} className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2 w-16">
                        <span className="text-sm font-medium">{rating}</span>
                        <Star className="w-4 h-4 fill-warning text-warning" />
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-gradient-accent h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-accent" />
                  <span>Recent Reviews</span>
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/reviews">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayAnalytics.recentReviews.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No reviews yet</p>
                    <p className="text-sm">Share your review link to get started!</p>
                  </div>
                ) : (
                  displayAnalytics.recentReviews.map((review) => (
                    <div key={review.id} className="p-4 border border-border/50 rounded-lg bg-card/50">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-foreground">{review.customer_name}</p>
                          <StarRating rating={review.rating} readonly size="sm" />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card-hover">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button asChild className="h-20 bg-gradient-primary hover:opacity-90 text-white">
                  <Link to="/settings" className="flex flex-col items-center space-y-2">
                    <Settings className="w-6 h-6" />
                    <span>Configure Settings</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20">
                  <Link to="/reviews" className="flex flex-col items-center space-y-2">
                    <MessageSquare className="w-6 h-6" />
                    <span>Manage Reviews</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20">
                  <Link to={`/review?businessAccountId=${user?.id}`} target="_blank" className="flex flex-col items-center space-y-2">
                    <Eye className="w-6 h-6" />
                    <span>Preview Form</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
};

export default Dashboard;
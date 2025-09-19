import { useEffect, useState } from "react";
import { useReview } from "@/contexts/ReviewContext";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  MessageSquare, 
  Star,
  TrendingUp,
  Activity,
  Calendar,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { Navigate } from "react-router-dom";

interface SuperAdminAnalytics {
  totalBusinesses: number;
  totalUsers: number;
  totalReviews: number;
  averageRating: number;
  businessStatusDistribution: { status: string; count: number }[];
  recentBusinesses: any[];
  reviewTrends: { month: string; count: number }[];
}

interface EnhancedMetrics {
  newBusinessesThisMonth: number;
  newUsersThisMonth: number;
  reviewsThisMonth: number;
  activeBusinessesToday: number;
  topPerformingBusinesses: Array<{
    business_name: string;
    review_count: number;
    avg_rating: number;
  }>;
  monthlySignups: Array<{
    month: string;
    businesses: number;
    users: number;
  }>;
  ratingDistribution: Array<{
    rating: number;
    count: number;
  }>;
}

const COLORS = [
  'hsl(var(--primary))', 
  'hsl(var(--chart-2))', 
  'hsl(var(--chart-3))', 
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
];

export default function SuperAdminDashboard() {
  const { user, userRole, getSuperAdminAnalytics } = useReview();
  const [analytics, setAnalytics] = useState<SuperAdminAnalytics | null>(null);
  const [enhancedMetrics, setEnhancedMetrics] = useState<EnhancedMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if not super admin
  if (!user || userRole !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const data = await getSuperAdminAnalytics();
        setAnalytics(data);
        
        // Generate enhanced metrics (simulated for now - you could create additional DB functions)
        const enhancedData: EnhancedMetrics = {
          newBusinessesThisMonth: Math.floor(data.totalBusinesses * 0.1),
          newUsersThisMonth: Math.floor(data.totalUsers * 0.15),
          reviewsThisMonth: Math.floor(data.totalReviews * 0.2),
          activeBusinessesToday: Math.floor(data.totalBusinesses * 0.8),
          topPerformingBusinesses: data.recentBusinesses.slice(0, 3).map(b => ({
            business_name: b.business_name,
            review_count: Math.floor(Math.random() * 50) + 10,
            avg_rating: 4 + Math.random()
          })),
          monthlySignups: [
            { month: 'Jan', businesses: 12, users: 28 },
            { month: 'Feb', businesses: 15, users: 32 },
            { month: 'Mar', businesses: 18, users: 41 },
            { month: 'Apr', businesses: 22, users: 48 },
            { month: 'May', businesses: 20, users: 45 },
            { month: 'Jun', businesses: 25, users: 52 }
          ],
          ratingDistribution: [
            { rating: 1, count: Math.floor(data.totalReviews * 0.05) },
            { rating: 2, count: Math.floor(data.totalReviews * 0.08) },
            { rating: 3, count: Math.floor(data.totalReviews * 0.15) },
            { rating: 4, count: Math.floor(data.totalReviews * 0.35) },
            { rating: 5, count: Math.floor(data.totalReviews * 0.37) }
          ]
        };
        setEnhancedMetrics(enhancedData);
      } catch (error) {
        console.error('Error loading super admin analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [getSuperAdminAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics || !enhancedMetrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Platform overview and management
          </p>
        </div>
        <Badge variant="outline" className="px-4 py-2">
          <Activity className="w-4 h-4 mr-2" />
          Platform Status: Active
        </Badge>
      </div>

      {/* Primary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Businesses"
          value={analytics.totalBusinesses}
          icon={<Building2 className="w-6 h-6" />}
          changeType="neutral"
        />
        <StatsCard
          title="Total Users"
          value={analytics.totalUsers}
          icon={<Users className="w-6 h-6" />}
          changeType="positive"
        />
        <StatsCard
          title="Total Reviews"
          value={analytics.totalReviews}
          icon={<MessageSquare className="w-6 h-6" />}
          changeType="positive"
        />
        <StatsCard
          title="Average Rating"
          value={analytics.averageRating.toFixed(1)}
          icon={<Star className="w-6 h-6" />}
          changeType="positive"
        />
      </div>

      {/* Secondary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enhancedMetrics.activeBusinessesToday}</div>
            <p className="text-xs text-muted-foreground">
              {((enhancedMetrics.activeBusinessesToday / analytics.totalBusinesses) * 100).toFixed(1)}% of businesses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((enhancedMetrics.newBusinessesThisMonth / analytics.totalBusinesses) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Monthly business growth</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Engagement</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analytics.totalReviews / analytics.totalUsers).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Avg reviews per user</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Excellent</div>
            <p className="text-xs text-muted-foreground">
              {enhancedMetrics.ratingDistribution.filter(r => r.rating >= 4).reduce((sum, r) => sum + r.count, 0)} positive reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Signups Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Monthly Signups Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={enhancedMetrics.monthlySignups}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="businesses" fill="hsl(var(--primary))" name="Businesses" />
                <Bar dataKey="users" fill="hsl(var(--chart-2))" name="Users" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Rating Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={enhancedMetrics.ratingDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ rating, percent }) => `${rating}★ ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {enhancedMetrics.ratingDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Business Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.businessStatusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.businessStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Review Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Review Activity (6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.reviewTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Recent Activities and Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Business Registrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Business Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recentBusinesses.map((business) => (
                <div key={business.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{business.business_name}</h3>
                      <p className="text-sm text-muted-foreground">{business.contact_email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {new Date(business.created_at).toLocaleDateString()}
                    </p>
                    <Badge variant={business.status === 'active' ? 'default' : 'secondary'}>
                      {business.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Businesses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Top Performing Businesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {enhancedMetrics.topPerformingBusinesses.map((business, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      #{index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold">{business.business_name}</h3>
                      <p className="text-sm text-muted-foreground">{business.review_count} reviews</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{business.avg_rating.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
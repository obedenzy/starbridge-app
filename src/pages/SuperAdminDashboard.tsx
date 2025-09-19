import { useEffect, useState } from "react";
import { useReview } from "@/contexts/ReviewContext";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  Users, 
  MessageSquare, 
  Star,
  TrendingUp,
  Activity
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
  Line
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

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function SuperAdminDashboard() {
  const { user, userRole, getSuperAdminAnalytics } = useReview();
  const [analytics, setAnalytics] = useState<SuperAdminAnalytics | null>(null);
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

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Platform overview and management
        </p>
      </div>

      {/* Stats Cards */}
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
          changeType="neutral"
        />
        <StatsCard
          title="Total Reviews"
          value={analytics.totalReviews}
          icon={<MessageSquare className="w-6 h-6" />}
          changeType="neutral"
        />
        <StatsCard
          title="Average Rating"
          value={analytics.averageRating.toFixed(1)}
          icon={<Star className="w-6 h-6" />}
          changeType="positive"
        />
      </div>

      {/* Charts Row */}
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
              Review Trends (6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.reviewTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Businesses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Business Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.recentBusinesses.map((business) => (
              <div key={business.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">{business.business_name}</h3>
                  <p className="text-sm text-muted-foreground">{business.contact_email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {new Date(business.created_at).toLocaleDateString()}
                  </p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                    business.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {business.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
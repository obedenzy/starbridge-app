import { useEffect, useState } from "react";
import { useReview } from "@/contexts/ReviewContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SuperAdminSubscriptionManager } from "@/components/SuperAdminSubscriptionManager";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Eye, ToggleLeft, ToggleRight, Search, Filter, ExternalLink, Users, MessageSquare, Star } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface BusinessAccount {
  id: string;
  user_id: string;
  business_name: string;
  contact_email: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  public_path: string;
  review_threshold: number;
  google_review_url?: string;
}

interface BusinessDetails {
  business: BusinessAccount;
  totalReviews: number;
  avgRating: number;
  lastActive: string;
}

export default function SuperAdminBusinesses() {
  const { user, userRole, getAllBusinessAccounts, updateBusinessStatus } = useReview();
  const [businesses, setBusinesses] = useState<BusinessAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  // Redirect if not super admin
  if (!user || userRole !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const data = await getAllBusinessAccounts();
      setBusinesses(data as BusinessAccount[]);
    } catch (error) {
      console.error('Error loading businesses:', error);
      toast({
        title: "Error",
        description: "Failed to load business accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (businessId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      await updateBusinessStatus(businessId, newStatus);
      setBusinesses(prev => 
        prev.map(business => 
          business.id === businessId 
            ? { ...business, status: newStatus }
            : business
        )
      );
      toast({
        title: "Success",
        description: `Business status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating business status:', error);
      toast({
        title: "Error",
        description: "Failed to update business status",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = async (business: BusinessAccount) => {
    // In a real app, you'd fetch these details from the API
    const businessDetails: BusinessDetails = {
      business,
      totalReviews: Math.floor(Math.random() * 100) + 10,
      avgRating: 3.5 + Math.random() * 1.5,
      lastActive: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    setSelectedBusiness(businessDetails);
    setShowDetails(true);
  };

  const filteredBusinesses = businesses.filter(business => {
    const matchesStatus = statusFilter === "all" || business.status === statusFilter;
    const matchesSearch = business.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.contact_email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-8 h-8" />
            Business Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage all business accounts and subscriptions on the platform
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businesses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Businesses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {businesses.filter(b => b.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inactive Businesses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {businesses.filter(b => b.status === 'inactive').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="businesses" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="businesses">Business Accounts</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscription Management</TabsTrigger>
        </TabsList>

        <TabsContent value="businesses" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Business Table */}
          <Card>
            <CardHeader>
              <CardTitle>Business Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Contact Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Review Threshold</TableHead>
                    <TableHead>Public Path</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBusinesses.map((business) => (
                    <TableRow key={business.id}>
                      <TableCell className="font-medium">
                        {business.business_name}
                      </TableCell>
                      <TableCell>{business.contact_email}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={business.status === 'active' ? 'default' : 'secondary'}
                          className={business.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        >
                          {business.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {business.created_at ? new Date(business.created_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>{business.review_threshold}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          /{business.public_path}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(business)}
                          >
                            <Eye className="w-4 h-4" />
                            Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/${business.public_path}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                            Visit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusToggle(business.id, business.status)}
                            className={business.status === 'active' ? 'text-red-600' : 'text-green-600'}
                          >
                            {business.status === 'active' ? (
                              <>
                                <ToggleRight className="w-4 h-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-4 h-4" />
                                Activate
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <SuperAdminSubscriptionManager />
        </TabsContent>
      </Tabs>

      {/* Business Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Business Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about {selectedBusiness?.business.business_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBusiness && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Business Name</label>
                  <p className="font-semibold">{selectedBusiness.business.business_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contact Email</label>
                  <p>{selectedBusiness.business.contact_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge className={selectedBusiness.business.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {selectedBusiness.business.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Review Threshold</label>
                  <p>{selectedBusiness.business.review_threshold} stars</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{selectedBusiness.totalReviews}</p>
                        <p className="text-xs text-muted-foreground">Total Reviews</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <div>
                        <p className="text-2xl font-bold">{selectedBusiness.avgRating.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">Avg Rating</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Last Active</p>
                        <p className="text-sm font-medium">
                          {new Date(selectedBusiness.lastActive).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Info */}
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Public Path</label>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">/{selectedBusiness.business.public_path}</code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/${selectedBusiness.business.public_path}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {selectedBusiness.business.google_review_url && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Google Review URL</label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm truncate">{selectedBusiness.business.google_review_url}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedBusiness.business.google_review_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useEffect, useState } from "react";
import { useReview } from "@/contexts/ReviewContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Building2, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface BusinessAccount {
  id: string;
  business_name: string;
  contact_email: string;
  status: string;
  created_at: string;
  updated_at?: string;
  public_path: string;
  review_threshold: number;
}

export default function SuperAdminBusinesses() {
  const { user, userRole, getAllBusinessAccounts, updateBusinessStatus } = useReview();
  const [businesses, setBusinesses] = useState<BusinessAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
      setBusinesses(data.map(b => ({ ...b, updated_at: b.updated_at || b.created_at })));
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

  const filteredBusinesses = businesses.filter(business => 
    statusFilter === "all" || business.status === statusFilter
  );

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
            Business Accounts
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage all business accounts on the platform
          </p>
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
                    {new Date(business.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{business.review_threshold}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/${business.public_path}`, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                        View
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
    </div>
  );
}
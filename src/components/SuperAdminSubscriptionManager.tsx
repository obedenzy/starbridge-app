import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  DollarSign,
  Edit,
  Building,
  Save,
  X
} from 'lucide-react';
import { useReview } from '@/contexts/ReviewContext';
import { BusinessSettings } from '@/contexts/ReviewContext';

export const SuperAdminSubscriptionManager = () => {
  const { getAllBusinessAccounts, updateBusinessSettings } = useReview();
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<BusinessSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBusiness, setEditingBusiness] = useState<BusinessSettings | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const data = await getAllBusinessAccounts();
      setBusinesses(data);
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubscription = (business: BusinessSettings) => {
    setEditingBusiness(business);
    setCustomAmount(business.custom_subscription_amount ? (business.custom_subscription_amount / 100).toString() : '250');
    setIsDialogOpen(true);
  };

  const handleSaveSubscription = async () => {
    if (!editingBusiness) return;

    try {
      const amountInCents = parseFloat(customAmount) * 100;
      
      await updateBusinessSettings({
        ...editingBusiness,
        custom_subscription_amount: amountInCents
      });

      // Update local state
      setBusinesses(prev => prev.map(b => 
        b.id === editingBusiness.id 
          ? { ...b, custom_subscription_amount: amountInCents }
          : b
      ));

      toast({
        title: "Subscription amount updated",
        description: `${editingBusiness.business_name} subscription set to $${customAmount}/month`,
      });

      setIsDialogOpen(false);
      setEditingBusiness(null);
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to update subscription amount",
        variant: "destructive",
      });
    }
  };

  const handleResetToDefault = async () => {
    if (!editingBusiness) return;

    try {
      await updateBusinessSettings({
        ...editingBusiness,
        custom_subscription_amount: null
      });

      // Update local state
      setBusinesses(prev => prev.map(b => 
        b.id === editingBusiness.id 
          ? { ...b, custom_subscription_amount: null }
          : b
      ));

      toast({
        title: "Reset to default",
        description: `${editingBusiness.business_name} subscription reset to $250/month default`,
      });

      setIsDialogOpen(false);
      setEditingBusiness(null);
    } catch (error) {
      console.error('Error resetting subscription:', error);
      toast({
        title: "Error",
        description: "Failed to reset subscription amount",
        variant: "destructive",
      });
    }
  };

  const getDisplayAmount = (business: BusinessSettings) => {
    return business.custom_subscription_amount 
      ? `$${(business.custom_subscription_amount / 100).toFixed(2)}`
      : '$250.00';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Subscription Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Manage custom subscription amounts for business accounts. Changes will apply to future subscription renewals.
          </p>
          
          <Separator />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Contact Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Monthly Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.map((business) => (
                <TableRow key={business.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span className="font-medium">{business.business_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{business.contact_email}</TableCell>
                  <TableCell>
                    <Badge variant={business.status === 'active' ? 'default' : 'secondary'}>
                      {business.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    {getDisplayAmount(business)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={business.custom_subscription_amount ? 'outline' : 'secondary'}>
                      {business.custom_subscription_amount ? 'Custom' : 'Default'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSubscription(business)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription Amount</DialogTitle>
            <DialogDescription>
              Set a custom monthly subscription amount for {editingBusiness?.business_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monthly Amount (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="pl-7"
                  placeholder="250.00"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Current default is $250.00/month
              </p>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <strong>Preview:</strong> This business will be charged{' '}
                <span className="font-mono">${parseFloat(customAmount || '0').toFixed(2)}</span> per month
                for future subscriptions.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleResetToDefault}
              disabled={!editingBusiness?.custom_subscription_amount}
            >
              <X className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
            <Button onClick={handleSaveSubscription}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
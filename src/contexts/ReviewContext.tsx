import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types
export interface Review {
  id: string;
  rating: number;
  customer_name: string;
  customer_email?: string;
  subject: string;
  comment: string;
  business_id: string;
  created_at: string;
}

export interface BusinessSettings {
  id: string;
  user_id: string;
  business_name: string;
  contact_email: string;
  google_review_url: string;
  review_threshold: number;
  public_path: string;
  status?: string;
  thank_you_message?: string;
  custom_subscription_amount?: number;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  business_name: string;
  last_login?: string;
}

interface ReviewContextType {
  user: User | null;
  session: Session | null;
  businessSettings: BusinessSettings | null;
  profile: Profile | null;
  reviews: Review[];
  userRole: 'super_admin' | 'business_user' | null;
  subscriptionStatus: {
    subscribed: boolean;
    product_id: string | null;
    subscription_end: string | null;
  } | null;
  redirectPath: string | null;
  supabase: typeof supabase;
  login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signup: (email: string, password: string, businessName: string) => Promise<{ error: AuthError | null }>;
  logout: () => Promise<void>;
  addReview: (review: Omit<Review, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  updateBusinessSettings: (settings: Partial<BusinessSettings>) => Promise<void>;
  getBusinessByPath: (path: string) => Promise<BusinessSettings | null>;
  getBusinessByAccountId: (accountId: string) => Promise<BusinessSettings | null>;
  getReviewsByBusiness: (businessId: string) => Promise<Review[]>;
  changePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  checkSubscription: () => Promise<{ subscribed: boolean; product_id?: string | null; subscription_end?: string | null } | null>;
  createCheckout: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  getInvoices: () => Promise<any[]>;
  getAnalytics: () => Promise<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: { rating: number; count: number }[];
    recentReviews: Review[];
  }>;
  businessRole: 'business_admin' | 'business_user' | null;
  // Business user management
  getUserBusinessRole: () => Promise<'business_admin' | 'business_user' | null>;
  getBusinessUsers: () => Promise<any[]>;
  refreshSubscriptionStatus: () => Promise<void>;
  createBusinessUser: (email: string, fullName: string, role: 'business_admin' | 'business_user') => Promise<any>;
  removeUserFromBusiness: (userId: string) => Promise<void>;
  updateBusinessUserRole: (userId: string, role: 'business_admin' | 'business_user') => Promise<void>;
  changeUserPassword: (userId: string, newPassword: string) => Promise<void>;
  requiresPasswordChange: () => boolean;
  // Super admin functions
  getAllBusinessAccounts: () => Promise<BusinessSettings[]>;
  getAllUsers: () => Promise<Profile[]>;
  updateUserPassword: (userId: string, newPassword: string) => Promise<{ error: AuthError | null }>;
  updateBusinessStatus: (businessId: string, status: string) => Promise<void>;
  getSuperAdminAnalytics: () => Promise<{
    totalBusinesses: number;
    totalUsers: number;
    totalReviews: number;
    averageRating: number;
    businessStatusDistribution: { status: string; count: number }[];
    recentBusinesses: BusinessSettings[];
    reviewTrends: { month: string; count: number }[];
  }>;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export const ReviewProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userRole, setUserRole] = useState<'super_admin' | 'business_user' | null>(null);
  const [businessRole, setBusinessRole] = useState<'business_admin' | 'business_user' | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    subscribed: boolean;
    product_id: string | null;
    subscription_end: string | null;
  } | null>(null);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  const loadUserData = async (userId: string) => {
    try {
      console.log('Loading user data for userId:', userId);
      
      // Get user's email to check if they're a super admin
      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log('User data:', userData, 'User error:', userError);
      
      // Check if user is a super admin by email
      const superAdminEmails = ['admin@platform.com', 'superadmin@platform.com'];
      const userEmail = userData?.user?.email;
      
      console.log('Checking if user email is super admin:', userEmail);
      console.log('Available super admin emails:', superAdminEmails);
      
      // Check if user email is in super admin list
      if (userEmail && superAdminEmails.includes(userEmail)) {
        console.log('User is super admin based on email');
        setUserRole('super_admin');
        
        // Load profile for super admin
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        setProfile(profileData);
        return;
      }

      // If not super admin by email, check user_roles table or default to business_user
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      console.log('User role check:', { roleData, roleError });
      
      // If no role found, default to business_user
      const role = roleData?.role;
      if (role === 'business_admin') {
        setUserRole('business_user'); // business_admin is handled separately via businessRole
      } else {
        setUserRole(role || 'business_user');
      }

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      setProfile(profileData);

      // For super admin, don't load business-specific data
      if (roleData?.role === 'super_admin') {
        return;
      }

      // Load business settings for business users
      const { data: businessData } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      setBusinessSettings(businessData);

      // Load reviews for this business
      if (businessData) {
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .eq('business_id', businessData.id)
          .order('created_at', { ascending: false });
        
        setReviews(reviewsData || []);

        // Note: Final redirect path determination will happen after subscription check
        // This is just the initial assessment
        if (businessData.status === 'inactive' && (!roleData || roleData.role === 'business_user')) {
          const reviewCount = reviewsData?.length || 0;
          if (reviewCount === 0) {
            setRedirectPath('/subscription-required');
          } else {
            setRedirectPath('/billing');
          }
        } else {
          setRedirectPath(null);
        }
      }

      // Check subscription status for business users (not super admin)
      const shouldCheckSubscription = !superAdminEmails.includes(userEmail || '') && 
                                      (!roleData || roleData.role === 'business_user');
      if (shouldCheckSubscription) {
        console.log('Checking subscription for business user...');
        const subscriptionResult = await checkSubscription();
        console.log('Subscription check result:', subscriptionResult);
        
    // If we have an active subscription, reload business settings to get updated data
        if (subscriptionResult?.subscribed) {
          console.log('Active subscription detected, reloading business settings...');
          const { data: updatedBusinessData } = await supabase
            .from('business_settings')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (updatedBusinessData) {
            setBusinessSettings(updatedBusinessData);
            console.log('Updated business settings:', updatedBusinessData);
            
            // Clear redirect path if business is now active
            if (updatedBusinessData.status === 'active') {
              console.log('Business is now active, clearing redirect path');
              setRedirectPath(null);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const checkSubscription = async (): Promise<{ subscribed: boolean; product_id?: string | null; subscription_end?: string | null } | null> => {
    if (!session) return null;
    
    try {
      console.log('Checking subscription status...');
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('Subscription check response:', { data, error });

      if (error) {
        console.error('Error checking subscription:', error);
        const defaultStatus = { subscribed: false, product_id: null, subscription_end: null };
        setSubscriptionStatus(defaultStatus);
        return defaultStatus;
      }

      // Update subscription status
      const subscriptionData = {
        subscribed: data.subscribed,
        product_id: data.product_id || null,
        subscription_end: data.subscription_end || null
      };
      setSubscriptionStatus(subscriptionData);
      
      // If subscription is active, update business settings and clear redirect path
      if (data.subscribed && data.business_status === 'active') {
        console.log('Active subscription found, updating business settings...');
        
        // Update local business settings state
        if (businessSettings) {
          setBusinessSettings(prev => prev ? { 
            ...prev, 
            status: 'active',
            subscription_status: data.subscription_status || 'active',
            subscription_end_date: data.subscription_end
          } : null);
        }
        
        // Clear redirect path since subscription is now active
        setRedirectPath(null);
      }
      
      return subscriptionData;
    } catch (error) {
      console.error('Error in checkSubscription:', error);
      const defaultStatus = { subscribed: false, product_id: null, subscription_end: null };
      setSubscriptionStatus(defaultStatus);
      return defaultStatus;
    }
  };

  const refreshSubscriptionStatus = async () => {
    if (!session || !user) return;
    
    try {
      console.log('Manually refreshing subscription status...');
      await checkSubscription();
      
      // Also refresh business settings to get latest data
      const { data: updatedBusinessData } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (updatedBusinessData) {
        setBusinessSettings(updatedBusinessData);
        console.log('Business settings refreshed:', updatedBusinessData);
      }
      
      toast({
        title: "Success",
        description: "Subscription status refreshed!",
      });
    } catch (error) {
      console.error('Error refreshing subscription status:', error);
      toast({
        title: "Error",
        description: "Failed to refresh subscription status.",
        variant: "destructive",
      });
    }
  };

  const createCheckout = async () => {
    console.log('createCheckout called - session:', !!session, 'user:', !!user);
    
    if (!session) {
      console.error('No session found - please log in first');
      alert('Please log in to subscribe');
      return;
    }

    if (!user?.email) {
      console.error('No user email found');
      alert('User information not available. Please refresh and try again.');
      return;
    }

    console.log('Creating checkout session...', { userEmail: user.email, hasToken: !!session.access_token });

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('Checkout response:', { data, error });

      if (error) {
        console.error('Error creating checkout:', error);
        alert(`Error creating checkout: ${error.message || 'Unknown error'}`);
        return;
      }

      if (data?.url) {
        console.log('Redirecting to checkout:', data.url);
        window.open(data.url, '_blank');
      } else {
        console.error('No checkout URL received');
        alert('Failed to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  };

  const openCustomerPortal = async () => {
    if (!session) {
      console.error('No session found');
      alert('Please log in to manage your subscription.');
      return;
    }

    try {
      console.log('Opening customer portal...');
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error opening customer portal:', error);
        alert(`Error: ${error.message || 'Failed to open customer portal'}`);
        return;
      }

      if (data?.url) {
        console.log('Opening customer portal URL:', data.url);
        window.open(data.url, '_blank');
      } else {
        console.error('No portal URL received');
        alert('Failed to get customer portal URL. Please try again.');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  };

  const getInvoices = async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase.functions.invoke('get-invoices');
      
      if (error) {
        console.error('Get invoices error:', error);
        return [];
      }
      
      return data?.invoices || [];
    } catch (error: any) {
      console.error('Get invoices error:', error);
      return [];
    }
  };

  // Business user management functions
  const getUserBusinessRole = async (): Promise<'business_admin' | 'business_user' | null> => {
    if (!user || !businessSettings) return null;
    
    try {
      const { data, error } = await supabase.rpc('get_user_business_role', {
        user_id_param: user.id,
        business_id_param: businessSettings.id
      });
      
      if (error) throw error;
      const role = data as 'business_admin' | 'business_user';
      setBusinessRole(role);
      return role;
    } catch (error) {
      console.error('Error getting user business role:', error);
      setBusinessRole(null);
      return null;
    }
  };

  const getBusinessUsers = async () => {
    if (!businessSettings) return [];
    
    try {
      // Get business users
      const { data: businessUsers, error: businessUsersError } = await supabase
        .from('business_users')
        .select(`
          *,
          profiles!business_users_user_id_fkey (
            full_name,
            email
          )
        `)
        .eq('business_id', businessSettings.id);
      
      if (businessUsersError) throw businessUsersError;

      // Get business owner info
      const { data: ownerProfile, error: ownerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', businessSettings.user_id)
        .single();
      
      if (ownerError && ownerError.code !== 'PGRST116') throw ownerError;

      // Combine owner and business users
      const allUsers = [
        ...(ownerProfile ? [{
          id: businessSettings.user_id,
          business_id: businessSettings.id,
          user_id: businessSettings.user_id,
          role: 'business_admin' as const,
          created_at: new Date().toISOString(),
          profiles: ownerProfile,
          is_owner: true
        }] : []),
        ...(businessUsers || []).map(user => ({ 
          ...user, 
          is_owner: false 
        }))
      ];

      return allUsers;
    } catch (error) {
      console.error('Error getting business users:', error);
      return [];
    }
  };

  const createBusinessUser = async (email: string, fullName: string, role: 'business_admin' | 'business_user') => {
    if (!businessSettings) {
      throw new Error('No business settings found');
    }

    if (!user?.email) {
      throw new Error('Admin user email not found');
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-10).toUpperCase();

    const { data, error } = await supabase.functions.invoke('create-business-user', {
      body: {
        email,
        fullName,
        role,
        businessId: businessSettings.id,
        tempPassword
      }
    });

    if (error) {
      console.error('Error creating business user:', error);
      throw new Error(error.message || 'Failed to create business user');
    }

    // Send email notifications
    try {
      console.log('Sending user credentials emails...');
      const emailResult = await supabase.functions.invoke('send-user-credentials', {
        body: {
          userEmail: email,
          userName: fullName,
          tempPassword,
          businessName: businessSettings.business_name,
          adminEmail: user.email,
          adminName: user.user_metadata?.full_name || 'Admin'
        }
      });

      if (emailResult.error) {
        console.error('Error sending emails:', emailResult.error);
        // Don't throw error for email failure, just log it
        toast({
          title: "User Created",
          description: `User created successfully! Note: Email notification failed. Temporary password: ${tempPassword}`,
          duration: 15000,
        });
      } else {
        console.log('Emails sent successfully:', emailResult.data);
        toast({
          title: "User Created Successfully",
          description: `${fullName} has been added and notified via email. Temporary password: ${tempPassword}`,
          duration: 12000,
        });
      }
    } catch (emailError) {
      console.error('Failed to send emails:', emailError);
      toast({
        title: "User Created",
        description: `User created successfully! Note: Email notification failed. Temporary password: ${tempPassword}`,
        duration: 15000,
      });
    }

    return { ...data, tempPassword };
  };

  const removeUserFromBusiness = async (userId: string) => {
    if (!businessSettings) throw new Error('No business settings found');
    
    try {
      const { error } = await supabase.rpc('remove_user_from_business', {
        business_id_param: businessSettings.id,
        user_id_param: userId
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "User removed successfully.",
      });
    } catch (error: any) {
      console.error('Error removing user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove user.",
        variant: "destructive", 
      });
      throw error;
    }
  };

  const updateBusinessUserRole = async (userId: string, role: 'business_admin' | 'business_user') => {
    if (!businessSettings) throw new Error('No business settings found');
    
    try {
      const { error } = await supabase.rpc('update_business_user_role', {
        business_id_param: businessSettings.id,
        user_id_param: userId,
        new_role_param: role
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "User role updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user role.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const changeUserPassword = async (userId: string, newPassword: string) => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "User password updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating user password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user password.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Auto-refresh subscription status every 5 minutes
  useEffect(() => {
    if (!session || !businessSettings) return;

    const intervalId = setInterval(async () => {
      console.log('Auto-refreshing subscription status...');
      try {
        await checkSubscription();
        
        // Also refresh business settings to get latest data
        const { data: updatedBusinessData } = await supabase
          .from('business_settings')
          .select('*')
          .eq('user_id', user?.id)
          .single();
          
        if (updatedBusinessData) {
          setBusinessSettings(updatedBusinessData);
        }
      } catch (error) {
        console.error('Error auto-refreshing subscription:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [session, businessSettings, user?.id]);

  // Check if user needs to change password
  const requiresPasswordChange = () => {
    return user?.user_metadata?.requires_password_change === true;
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer loading with setTimeout
          setTimeout(() => {
            loadUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setBusinessSettings(null);
          setReviews([]);
          setUserRole(null);
          setSubscriptionStatus(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadUserData(session.user.id);
        
        // Immediately check subscription status on page load for existing sessions
        setTimeout(async () => {
          try {
            console.log('Immediate subscription check on page load...');
            await checkSubscription();
          } catch (error) {
            console.error('Error checking subscription on page load:', error);
          }
        }, 500); // Small delay to ensure user data is loaded first
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signup = async (email: string, password: string, businessName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          business_name: businessName,
          full_name: ''
        }
      }
    });

    // If no error but no user was created, it means the user already exists
    if (!error && !data.user) {
      return { error: new Error('An account with this email already exists. Please sign in instead.') as any };
    }

    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setBusinessSettings(null);
    setProfile(null);
    setReviews([]);
    setUserRole(null);
    setSubscriptionStatus(null);
    // Redirect to login page after logout
    window.location.href = '/login';
  };

  const addReview = async (review: Omit<Review, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([review])
        .select()
        .single();

      if (error) {
        console.error('Error adding review:', error);
        return { success: false, error: error.message };
      }

      // Call edge function to send notifications
      try {
        await supabase.functions.invoke('send-review-notification', {
          body: { review: data }
        });
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't fail the review creation if notification fails
      }

      setReviews(prev => [data, ...prev]);
      return { success: true };
    } catch (error) {
      console.error('Error adding review:', error);
      return { success: false, error: 'Failed to add review' };
    }
  };

  const updateBusinessSettings = async (settings: Partial<BusinessSettings>) => {
    if (!businessSettings || !user) return;

    const { error } = await supabase
      .from('business_settings')
      .update(settings)
      .eq('user_id', user.id);

    if (error) throw error;

    setBusinessSettings(prev => prev ? { ...prev, ...settings } : null);
  };

  const getBusinessByPath = async (path: string): Promise<BusinessSettings | null> => {
    const { data, error } = await supabase
      .rpc('get_public_business_info', { business_path: path })
      .single();

    if (error) return null;
    
    // Return a partial BusinessSettings object with only public fields populated
    // and other sensitive fields as null/undefined for security
    return {
      id: data.id,
      business_name: data.business_name,
      public_path: data.public_path,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.created_at, // Use created_at as fallback
      // Sensitive fields are not included in public view for security
      user_id: '',
      contact_email: '',
      google_review_url: null,
      review_threshold: 4, // Default value
      stripe_customer_id: null,
      stripe_subscription_id: null,
      subscription_status: null,
      subscription_end_date: null,
      payment_failed_at: null,
    } as BusinessSettings;
  };

  const getBusinessByAccountId = async (accountId: string): Promise<BusinessSettings | null> => {
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('user_id', accountId)
      .single();

    if (error) return null;
    return data;
  };

  const getReviewsByBusiness = async (businessId: string): Promise<Review[]> => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const changePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { error };
  };

  const getAnalytics = async () => {
    if (!businessSettings) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: [],
        recentReviews: []
      };
    }

    const businessReviews = await getReviewsByBusiness(businessSettings.id);
    const totalReviews = businessReviews.length;
    
    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: [],
        recentReviews: []
      };
    }
    
    const averageRating = businessReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    
    const ratingDistribution = businessReviews.reduce((acc: any[], review) => {
      const existing = acc.find(item => item.rating === review.rating);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ rating: review.rating, count: 1 });
      }
      return acc;
    }, []);
    
    const recentReviews = businessReviews.slice(0, 5);
    
    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      recentReviews
    };
  };

  // Super admin functions
  const getAllBusinessAccounts = async (): Promise<BusinessSettings[]> => {
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  };

  const getAllUsers = async (): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  };

  const updateUserPassword = async (userId: string, newPassword: string) => {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword
    });
    return { error };
  };

  const updateBusinessStatus = async (businessId: string, status: string): Promise<void> => {
    const { error } = await supabase
      .from('business_settings')
      .update({ status })
      .eq('id', businessId);
    
    if (error) throw error;
  };

  const getSuperAdminAnalytics = async () => {
    // Get total businesses
    const { count: totalBusinesses } = await supabase
      .from('business_settings')
      .select('*', { count: 'exact', head: true });

    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get total reviews
    const { count: totalReviews } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true });

    // Get average rating
    const { data: avgData } = await supabase
      .from('reviews')
      .select('rating');
    
    const averageRating = avgData?.length ? 
      avgData.reduce((sum, r) => sum + r.rating, 0) / avgData.length : 0;

    // Get business status distribution
    const { data: statusData } = await supabase
      .from('business_settings')
      .select('status');
    
    const businessStatusDistribution = statusData?.reduce((acc: any[], curr) => {
      const existing = acc.find(item => item.status === curr.status);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ status: curr.status, count: 1 });
      }
      return acc;
    }, []) || [];

    // Get recent businesses
    const { data: recentBusinesses } = await supabase
      .from('business_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    // Get review trends (last 6 months)
    const { data: reviewTrendsData } = await supabase
      .from('reviews')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString());

    const reviewTrends = reviewTrendsData?.reduce((acc: any[], review) => {
      const month = new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      const existing = acc.find(item => item.month === month);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ month, count: 1 });
      }
      return acc;
    }, []) || [];

    return {
      totalBusinesses: totalBusinesses || 0,
      totalUsers: totalUsers || 0,
      totalReviews: totalReviews || 0,
      averageRating,
      businessStatusDistribution,
      recentBusinesses: recentBusinesses || [],
      reviewTrends
    };
  };

  return (
    <ReviewContext.Provider value={{
      user,
      session,
      businessSettings,
      profile,
      reviews,
      userRole,
      businessRole,
      subscriptionStatus,
      redirectPath,
      supabase,
      login,
      signup,
      logout,
      addReview,
      updateBusinessSettings,
      getBusinessByPath,
      getBusinessByAccountId,
      getReviewsByBusiness,
      changePassword,
       checkSubscription,
       refreshSubscriptionStatus,
       createCheckout,
      openCustomerPortal,
       getInvoices,
       getAnalytics,
       // Business user management
       getUserBusinessRole,
       getBusinessUsers,
       createBusinessUser,
       removeUserFromBusiness,
       updateBusinessUserRole,
        changeUserPassword,
        requiresPasswordChange,
      // Super admin functions
      getAllBusinessAccounts,
      getAllUsers,
      updateUserPassword,
      updateBusinessStatus,
      getSuperAdminAnalytics
    }}>
      {children}
    </ReviewContext.Provider>
  );
};

export const useReview = () => {
  const context = useContext(ReviewContext);
  if (context === undefined) {
    throw new Error('useReview must be used within a ReviewProvider');
  }
  return context;
};
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session, AuthError } from '@supabase/supabase-js';

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
  login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signup: (email: string, password: string, businessName: string) => Promise<{ error: AuthError | null }>;
  logout: () => Promise<void>;
  addReview: (review: Omit<Review, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  updateBusinessSettings: (settings: Partial<BusinessSettings>) => Promise<void>;
  getBusinessByPath: (path: string) => Promise<BusinessSettings | null>;
  getBusinessByAccountId: (accountId: string) => Promise<BusinessSettings | null>;
  getReviewsByBusiness: (businessId: string) => Promise<Review[]>;
  changePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  checkSubscription: () => Promise<void>;
  createCheckout: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  getAnalytics: () => Promise<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: { rating: number; count: number }[];
    recentReviews: Review[];
  }>;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userRole, setUserRole] = useState<'super_admin' | 'business_user' | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    subscribed: boolean;
    product_id: string | null;
    subscription_end: string | null;
  } | null>(null);

  const loadUserData = async (userId: string) => {
    try {
      console.log('Loading user data for userId:', userId);
      
      // Get user's email to check if they're a super admin
      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log('User data:', userData, 'User error:', userError);
      
      // Check if user email is a known super admin
      const superAdminEmails = ['admin@platform.com', 'superadmin@platform.com'];
      const userEmail = userData?.user?.email;
      
      console.log('Checking if user email is super admin:', userEmail);
      console.log('Available super admin emails:', superAdminEmails);
      
      // TEMPORARY: Force super admin role for testing - replace this with actual email check
      if (userEmail) {
        console.log('TEMPORARY: Setting user as super admin for testing');
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
      setUserRole(roleData?.role || 'business_user');

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
      }

      // Check subscription status for business users
      if (userRole !== 'super_admin') {
        await checkSubscription();
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const checkSubscription = async () => {
    if (!session) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        setSubscriptionStatus({ subscribed: false, product_id: null, subscription_end: null });
        return;
      }

      setSubscriptionStatus(data);
      
      // Update business settings status based on subscription
      if (businessSettings && data.subscribed !== (businessSettings.status === 'active')) {
        const { error: updateError } = await supabase
          .from('business_settings')
          .update({ status: data.subscribed ? 'active' : 'inactive' })
          .eq('user_id', user?.id);
        
        if (!updateError) {
          setBusinessSettings(prev => prev ? { ...prev, status: data.subscribed ? 'active' : 'inactive' } : null);
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscriptionStatus({ subscribed: false, product_id: null, subscription_end: null });
    }
  };

  const createCheckout = async () => {
    if (!session) {
      console.error('No session found');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error creating checkout:', error);
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
    }
  };

  const openCustomerPortal = async () => {
    if (!session) {
      console.error('No session found');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error opening customer portal:', error);
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
    }
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
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadUserData(session.user.id);
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
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          business_name: businessName
        }
      }
    });
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
      .from('business_settings')
      .select('*')
      .eq('public_path', path)
      .single();

    if (error) return null;
    return data;
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
      subscriptionStatus,
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
      createCheckout,
      openCustomerPortal,
      getAnalytics,
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
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

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
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  business_name: string;
}

interface ReviewContextType {
  // Authentication
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, businessName: string, fullName: string) => Promise<boolean>;
  logout: () => void;
  
  // Reviews
  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'created_at'>) => Promise<{ success: boolean; data?: any; error?: any }>;
  getReviewsByBusiness: (businessId: string) => Review[];
  
  // Business Settings
  businessSettings: BusinessSettings | null;
  updateBusinessSettings: (settings: Partial<BusinessSettings>) => Promise<void>;
  getBusinessByPath: (path: string) => Promise<BusinessSettings | null>;
  getBusinessByAccountId: (accountId: string) => Promise<BusinessSettings | null>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  
  // Analytics
  getAnalytics: () => {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    recentReviews: Review[];
  };
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export const ReviewProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);

  // Set up auth state listener and load data
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile and business settings loading
          setTimeout(async () => {
            await loadUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setBusinessSettings(null);
          setReviews([]);
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

  const loadUserData = async (userId: string) => {
    try {
      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      setProfile(profileData);

      // Load business settings
      const { data: businessData } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      setBusinessSettings(businessData);

      // Load reviews
      if (businessData) {
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .eq('business_id', businessData.id)
          .order('created_at', { ascending: false });
        
        setReviews(reviewsData || []);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Authentication functions
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signup = async (email: string, password: string, businessName: string, fullName: string): Promise<boolean> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            business_name: businessName
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setBusinessSettings(null);
    setReviews([]);
  };

  // Review functions
  const addReview = async (review: Omit<Review, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([review])
        .select()
        .single();

      if (error) {
        console.error('Error adding review:', error);
        return { success: false, error };
      }

      setReviews(prev => [data, ...prev]);
      return { success: true, data };
    } catch (error) {
      console.error('Error adding review:', error);
      return { success: false, error };
    }
  };

  const getReviewsByBusiness = (businessId: string) => {
    return reviews.filter(review => review.business_id === businessId);
  };

  // Business settings functions
  const updateBusinessSettings = async (settings: Partial<BusinessSettings>) => {
    if (!businessSettings || !user) return;

    try {
      const { error } = await supabase
        .from('business_settings')
        .update(settings)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating business settings:', error);
        return;
      }

      const updatedSettings = { ...businessSettings, ...settings };
      setBusinessSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating business settings:', error);
    }
  };

  const getBusinessByPath = async (path: string): Promise<BusinessSettings | null> => {
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('public_path', path)
        .single();

      if (error) {
        console.error('Error getting business by path:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting business by path:', error);
      return null;
    }
  };

  const getBusinessByAccountId = async (accountId: string): Promise<BusinessSettings | null> => {
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', accountId)
        .single();

      if (error) {
        console.error('Error getting business by account ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting business by account ID:', error);
      return null;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password change error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Password change error:', error);
      return false;
    }
  };

  // Analytics functions
  const getAnalytics = () => {
    if (!user) return { totalReviews: 0, averageRating: 0, ratingDistribution: {}, recentReviews: [] };
    
    const businessReviews = getReviewsByBusiness(businessSettings?.id || '');
    const totalReviews = businessReviews.length;
    
    if (totalReviews === 0) {
      return { totalReviews: 0, averageRating: 0, ratingDistribution: {}, recentReviews: [] };
    }
    
    const averageRating = businessReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    
    const ratingDistribution = businessReviews.reduce((dist, review) => {
      dist[review.rating] = (dist[review.rating] || 0) + 1;
      return dist;
    }, {} as Record<number, number>);
    
    const recentReviews = businessReviews
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
    
    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      recentReviews
    };
  };

  return (
    <ReviewContext.Provider
      value={{
        user,
        session,
        profile,
        login,
        signup,
        logout,
        reviews,
        addReview,
        getReviewsByBusiness,
        businessSettings,
        updateBusinessSettings,
        getBusinessByPath,
        getBusinessByAccountId,
        changePassword,
        getAnalytics
      }}
    >
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
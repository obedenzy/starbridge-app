import { createContext, useContext, useEffect, useState } from 'react';

// Types
export interface Review {
  id: string;
  rating: number;
  name: string;
  email: string;
  comment: string;
  businessId: string;
  createdAt: string;
  isPublic: boolean;
}

export interface BusinessSettings {
  id: string;
  businessName: string;
  email: string;
  googleReviewUrl: string;
  threshold: number; // Reviews >= threshold redirect to Google
  customMessage: string;
  logoUrl?: string;
  primaryColor: string;
}

export interface User {
  id: string;
  email: string;
  businessName: string;
  businessAccountId: string;
  createdAt: string;
}

interface ReviewContextType {
  // Authentication
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, businessName: string) => Promise<boolean>;
  logout: () => void;
  
  // Reviews
  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
  getReviewsByBusiness: (businessId: string) => Review[];
  
  // Business Settings
  businessSettings: BusinessSettings | null;
  updateBusinessSettings: (settings: Partial<BusinessSettings>) => void;
  getBusinessByPath: (path: string) => BusinessSettings | null;
  
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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('reviewApp_user');
    const savedReviews = localStorage.getItem('reviewApp_reviews');
    const savedSettings = localStorage.getItem('reviewApp_businessSettings');

    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      
      // Load business settings for this user
      if (savedSettings) {
        const allSettings = JSON.parse(savedSettings);
        const userSettings = allSettings[userData.id];
        if (userSettings) {
          setBusinessSettings(userSettings);
        }
      }
    }

    if (savedReviews) {
      setReviews(JSON.parse(savedReviews));
    }
  }, []);

  // Authentication functions
  const login = async (email: string, password: string): Promise<boolean> => {
    const savedUsers = localStorage.getItem('reviewApp_users');
    const users = savedUsers ? JSON.parse(savedUsers) : {};
    
    const userData = users[email];
    if (userData && userData.password === password) {
      setUser({ id: userData.id, email, businessName: userData.businessName, businessAccountId: userData.businessAccountId, createdAt: userData.createdAt });
      localStorage.setItem('reviewApp_user', JSON.stringify({ id: userData.id, email, businessName: userData.businessName, businessAccountId: userData.businessAccountId, createdAt: userData.createdAt }));
      
      // Load business settings
      const savedSettings = localStorage.getItem('reviewApp_businessSettings');
      if (savedSettings) {
        const allSettings = JSON.parse(savedSettings);
        const userSettings = allSettings[userData.id];
        if (userSettings) {
          setBusinessSettings(userSettings);
        }
      }
      return true;
    }
    return false;
  };

  const signup = async (email: string, password: string, businessName: string): Promise<boolean> => {
    const savedUsers = localStorage.getItem('reviewApp_users');
    const users = savedUsers ? JSON.parse(savedUsers) : {};
    
    if (users[email]) {
      return false; // User already exists
    }

    const userId = crypto.randomUUID();
    const businessAccountId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    users[email] = {
      id: userId,
      email,
      password,
      businessName,
      businessAccountId,
      createdAt: now
    };
    
    localStorage.setItem('reviewApp_users', JSON.stringify(users));
    
    // Create default business settings
    const defaultSettings: BusinessSettings = {
      id: userId,
      businessName,
      email,
      googleReviewUrl: '',
      threshold: 4,
      customMessage: `Thank you for your feedback! Your review helps us improve our service.`,
      primaryColor: '#1e40af'
    };
    
    const savedSettings = localStorage.getItem('reviewApp_businessSettings');
    const allSettings = savedSettings ? JSON.parse(savedSettings) : {};
    allSettings[userId] = defaultSettings;
    localStorage.setItem('reviewApp_businessSettings', JSON.stringify(allSettings));
    
    setUser({ id: userId, email, businessName, businessAccountId, createdAt: now });
    setBusinessSettings(defaultSettings);
    localStorage.setItem('reviewApp_user', JSON.stringify({ id: userId, email, businessName, businessAccountId, createdAt: now }));
    
    return true;
  };

  const logout = () => {
    setUser(null);
    setBusinessSettings(null);
    localStorage.removeItem('reviewApp_user');
  };

  // Review functions
  const addReview = (review: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...review,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    
    const updatedReviews = [...reviews, newReview];
    setReviews(updatedReviews);
    localStorage.setItem('reviewApp_reviews', JSON.stringify(updatedReviews));
  };

  const getReviewsByBusiness = (businessId: string) => {
    return reviews.filter(review => review.businessId === businessId);
  };

  // Business settings functions
  const updateBusinessSettings = (settings: Partial<BusinessSettings>) => {
    if (!user || !businessSettings) return;
    
    const updatedSettings = { ...businessSettings, ...settings };
    setBusinessSettings(updatedSettings);
    
    const savedSettings = localStorage.getItem('reviewApp_businessSettings');
    const allSettings = savedSettings ? JSON.parse(savedSettings) : {};
    allSettings[user.id] = updatedSettings;
    localStorage.setItem('reviewApp_businessSettings', JSON.stringify(allSettings));
  };

  const getBusinessByPath = (path: string): BusinessSettings | null => {
    const savedSettings = localStorage.getItem('reviewApp_businessSettings');
    if (!savedSettings) return null;
    
    const allSettings = JSON.parse(savedSettings);
    return Object.values(allSettings).find((settings: any) => 
      settings.businessName.toLowerCase().replace(/\s+/g, '-') === path.toLowerCase()
    ) as BusinessSettings || null;
  };

  // Analytics functions
  const getAnalytics = () => {
    if (!user) return { totalReviews: 0, averageRating: 0, ratingDistribution: {}, recentReviews: [] };
    
    const businessReviews = getReviewsByBusiness(user.id);
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
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
        login,
        signup,
        logout,
        reviews,
        addReview,
        getReviewsByBusiness,
        businessSettings,
        updateBusinessSettings,
        getBusinessByPath,
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
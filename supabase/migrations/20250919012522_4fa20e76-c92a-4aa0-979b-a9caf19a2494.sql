-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  business_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business_settings table
CREATE TABLE public.business_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  review_threshold INTEGER NOT NULL DEFAULT 4,
  google_review_url TEXT,
  contact_email TEXT NOT NULL,
  public_path TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.business_settings(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  subject TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for business_settings
CREATE POLICY "Users can view their own business settings" 
ON public.business_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own business settings" 
ON public.business_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own business settings" 
ON public.business_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Business settings are viewable by public path" 
ON public.business_settings 
FOR SELECT 
USING (true);

-- Create RLS policies for reviews
CREATE POLICY "Users can view reviews for their business" 
ON public.reviews 
FOR SELECT 
USING (
  business_id IN (
    SELECT id FROM public.business_settings WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can insert reviews" 
ON public.reviews 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update reviews for their business" 
ON public.reviews 
FOR UPDATE 
USING (
  business_id IN (
    SELECT id FROM public.business_settings WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete reviews for their business" 
ON public.reviews 
FOR DELETE 
USING (
  business_id IN (
    SELECT id FROM public.business_settings WHERE user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_settings_updated_at
  BEFORE UPDATE ON public.business_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, business_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'My Business')
  );
  
  INSERT INTO public.business_settings (user_id, business_name, contact_email, public_path)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'My Business'),
    NEW.email,
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'my-business'), ' ', '-')) || '-' || SUBSTRING(NEW.id::text FROM 1 FOR 8)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'business_user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'business_user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Add status column to business_settings
ALTER TABLE public.business_settings 
ADD COLUMN status TEXT NOT NULL DEFAULT 'active';

-- Add last_login to profiles
ALTER TABLE public.profiles 
ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'super_admin'));

-- Update business_settings policies for super admin
CREATE POLICY "Super admins can view all business settings" 
ON public.business_settings 
FOR SELECT 
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update all business settings" 
ON public.business_settings 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'super_admin'));

-- Update profiles policies for super admin
CREATE POLICY "Super admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'super_admin'));

-- Update reviews policies for super admin
CREATE POLICY "Super admins can view all reviews" 
ON public.reviews 
FOR SELECT 
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage all reviews" 
ON public.reviews 
FOR ALL 
USING (public.has_role(auth.uid(), 'super_admin'));

-- Update the handle_new_user function to assign default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, business_name, last_login)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'My Business'),
    now()
  );
  
  INSERT INTO public.business_settings (user_id, business_name, contact_email, public_path, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'My Business'),
    NEW.email,
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'my-business'), ' ', '-')) || '-' || SUBSTRING(NEW.id::text FROM 1 FOR 8),
    'active'
  );
  
  -- Assign default business_user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'business_user');
  
  RETURN NEW;
END;
$$;

-- Add trigger for updating updated_at on user_roles
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Complete Super Admin Setup Script
-- This script sets up the role system and provides functions for super admin management

-- Ensure the role enum exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('super_admin', 'business_user');
    END IF;
END $$;

-- Ensure user_roles table exists with proper structure
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'business_user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles if not already enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create or replace the role checking function with proper search path
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

-- Create or replace the get user role function with proper search path
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1),
    'business_user'::app_role
  )
$$;

-- Function to assign super admin role to existing user
CREATE OR REPLACE FUNCTION public.assign_super_admin_role(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete any existing role for this user
  DELETE FROM public.user_roles WHERE user_id = user_uuid;
  
  -- Insert super admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_uuid, 'super_admin');
  
  -- Update profile to indicate super admin
  UPDATE public.profiles 
  SET 
    full_name = COALESCE(full_name, 'Super Admin'),
    business_name = 'Platform Administration'
  WHERE user_id = user_uuid;
  
  RETURN 'Super admin role assigned successfully to user: ' || user_uuid::TEXT;
END;
$$;

-- Function to list all users with their roles
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role app_role,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.email,
    p.full_name,
    COALESCE(ur.role, 'business_user'::app_role) as role,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
  ORDER BY p.created_at DESC;
END;
$$;

-- RLS policies for user_roles table
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'super_admin'));

-- Update business_settings policies for super admin access
DROP POLICY IF EXISTS "Super admins can view all business settings" ON public.business_settings;
DROP POLICY IF EXISTS "Super admins can update all business settings" ON public.business_settings;

CREATE POLICY "Super admins can view all business settings" 
ON public.business_settings 
FOR SELECT 
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update all business settings" 
ON public.business_settings 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'super_admin'));

-- Update profiles policies for super admin access
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;

CREATE POLICY "Super admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'super_admin'));

-- Update reviews policies for super admin access
DROP POLICY IF EXISTS "Super admins can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Super admins can manage all reviews" ON public.reviews;

CREATE POLICY "Super admins can view all reviews" 
ON public.reviews 
FOR SELECT 
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage all reviews" 
ON public.reviews 
FOR ALL 
USING (public.has_role(auth.uid(), 'super_admin'));

-- Update the handle_new_user function to assign default role properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, email, business_name, last_login)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'My Business'),
    now()
  );
  
  -- Create business settings for regular users (not super admins)
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id AND role = 'super_admin') THEN
    INSERT INTO public.business_settings (user_id, business_name, contact_email, public_path, status)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'My Business'),
      NEW.email,
      LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'my-business'), ' ', '-')) || '-' || SUBSTRING(NEW.id::text FROM 1 FOR 8),
      'active'
    );
  END IF;
  
  -- Assign default business_user role if no role exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'business_user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Add trigger for updating updated_at on user_roles
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
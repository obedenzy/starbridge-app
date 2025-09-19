-- SQL Script to Import into Database
-- Complete Super Admin and Role System Setup
-- Run this script in Supabase SQL Editor or any PostgreSQL client

-- =====================================================
-- 1. CREATE ROLE ENUM AND USER_ROLES TABLE
-- =====================================================

-- Create role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('super_admin', 'business_user');
    END IF;
END $$;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'business_user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CORE ROLE FUNCTIONS
-- =====================================================

-- Function to check if user has specific role
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

-- Function to get user's role
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

-- =====================================================
-- 3. SUPER ADMIN MANAGEMENT FUNCTIONS
-- =====================================================

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

-- =====================================================
-- 4. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- User roles table policies
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

-- Business settings policies for super admin
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

-- Profiles policies for super admin
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

-- Reviews policies for super admin
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

-- =====================================================
-- 5. USER CREATION TRIGGER
-- =====================================================

-- Update the handle_new_user function
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

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create trigger for updating updated_at on user_roles
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 6. EXAMPLE QUERIES TO USE AFTER SETUP
-- =====================================================

/*
-- To assign super admin role to an existing user (replace with actual user ID):
SELECT public.assign_super_admin_role('YOUR_USER_ID_HERE');

-- To view all users with their roles:
SELECT * FROM public.get_users_with_roles();

-- To check if current user is super admin:
SELECT public.has_role(auth.uid(), 'super_admin');

-- To get current user's role:
SELECT public.get_user_role(auth.uid());
*/

-- =====================================================
-- 7. FINAL SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Super Admin role system setup completed successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create a user through Supabase Auth UI or use the /create-super-admin page';
  RAISE NOTICE '2. Run: SELECT public.assign_super_admin_role(''USER_ID'') to assign super admin role';
  RAISE NOTICE '3. Login with super admin credentials to access /super-admin/dashboard';
END $$;
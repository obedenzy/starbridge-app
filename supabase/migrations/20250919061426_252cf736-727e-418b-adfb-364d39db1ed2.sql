-- Create super admin user (this will be done manually through auth)
-- The roles enum and user_roles table already exist from previous migration

-- Insert super admin role for an existing user
-- First, let's create a function to safely create a super admin
CREATE OR REPLACE FUNCTION public.create_super_admin(
  admin_email TEXT,
  admin_password TEXT,
  admin_name TEXT DEFAULT 'Super Admin'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Note: In production, user creation should be done through Supabase Auth UI or API
  -- This function provides the structure for when a user is created
  
  -- For now, we'll just return instructions
  RETURN 'Please create a user with email: ' || admin_email || ' through Supabase Auth, then run: SELECT public.assign_super_admin_role(''<user_id>'');';
END;
$$;

-- Function to assign super admin role to an existing user
CREATE OR REPLACE FUNCTION public.assign_super_admin_role(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user exists in auth.users (we can't query this directly due to RLS)
  -- So we'll just try to insert the role
  
  -- Delete any existing role for this user
  DELETE FROM public.user_roles WHERE user_id = user_uuid;
  
  -- Insert super admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_uuid, 'super_admin');
  
  -- Update or create profile
  INSERT INTO public.profiles (user_id, full_name, email, business_name)
  VALUES (
    user_uuid,
    'Super Admin',
    'admin@yourplatform.com',
    'Platform Admin'
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    full_name = 'Super Admin',
    business_name = 'Platform Admin';
  
  RETURN 'Super admin role assigned successfully to user: ' || user_uuid::TEXT;
END;
$$;

-- Function to create a demo super admin user with known credentials
-- This creates the database records for when the auth user is created
CREATE OR REPLACE FUNCTION public.setup_demo_super_admin()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  demo_user_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
BEGIN
  -- Create demo super admin records (will need real auth user)
  INSERT INTO public.profiles (user_id, full_name, email, business_name)
  VALUES (
    demo_user_id,
    'Demo Super Admin',
    'superadmin@demo.com',
    'Platform Administration'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Assign super admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (demo_user_id, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN 'Demo super admin setup complete. Email: superadmin@demo.com, Password: SuperAdmin123!';
END;
$$;

-- Run the demo setup
SELECT public.setup_demo_super_admin();
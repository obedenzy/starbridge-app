-- Remove the failed demo setup and create proper helper functions
DROP FUNCTION IF EXISTS public.setup_demo_super_admin();

-- Create a function to assign super admin role to any existing user
CREATE OR REPLACE FUNCTION public.assign_super_admin_role(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create a function to list all users with their roles (for super admin management)
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
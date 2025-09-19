-- Add business_admin role to the enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'business_admin';

-- Create business_users table to track users for each business
CREATE TABLE IF NOT EXISTS public.business_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_settings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'business_user',
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- Enable RLS on business_users
ALTER TABLE public.business_users ENABLE ROW LEVEL SECURITY;

-- Create policies for business_users table
CREATE POLICY "Business admins can manage business users" 
ON public.business_users 
FOR ALL 
USING (
  business_id IN (
    SELECT bs.id 
    FROM public.business_settings bs 
    JOIN public.business_users bu ON bs.id = bu.business_id 
    WHERE bu.user_id = auth.uid() AND bu.role = 'business_admin'
  )
);

CREATE POLICY "Business owners can manage business users" 
ON public.business_users 
FOR ALL 
USING (
  business_id IN (
    SELECT id 
    FROM public.business_settings 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own business user record" 
ON public.business_users 
FOR SELECT 
USING (user_id = auth.uid());

-- Function to invite user to business
CREATE OR REPLACE FUNCTION public.invite_user_to_business(
  business_id_param UUID,
  email_param TEXT,
  role_param app_role DEFAULT 'business_user'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
  existing_user_id UUID;
BEGIN
  -- Check if user exists
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = email_param;
  
  -- If user doesn't exist, create invitation record with email
  IF target_user_id IS NULL THEN
    -- For now, we'll require the user to exist
    RAISE EXCEPTION 'User with email % does not exist', email_param;
  END IF;
  
  -- Check if user is already part of this business
  SELECT user_id INTO existing_user_id
  FROM public.business_users
  WHERE business_id = business_id_param AND user_id = target_user_id;
  
  IF existing_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'User is already part of this business';
  END IF;
  
  -- Add user to business
  INSERT INTO public.business_users (business_id, user_id, role, invited_by)
  VALUES (business_id_param, target_user_id, role_param, auth.uid());
  
  RETURN target_user_id;
END;
$$;

-- Function to remove user from business
CREATE OR REPLACE FUNCTION public.remove_user_from_business(
  business_id_param UUID,
  user_id_param UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Don't allow removing the business owner
  IF EXISTS (
    SELECT 1 FROM public.business_settings 
    WHERE id = business_id_param AND user_id = user_id_param
  ) THEN
    RAISE EXCEPTION 'Cannot remove business owner from business';
  END IF;
  
  DELETE FROM public.business_users
  WHERE business_id = business_id_param AND user_id = user_id_param;
END;
$$;

-- Function to update business user role
CREATE OR REPLACE FUNCTION public.update_business_user_role(
  business_id_param UUID,
  user_id_param UUID,
  new_role_param app_role
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Don't allow changing the business owner's role through this function
  IF EXISTS (
    SELECT 1 FROM public.business_settings 
    WHERE id = business_id_param AND user_id = user_id_param
  ) THEN
    RAISE EXCEPTION 'Cannot change business owner role through this function';
  END IF;
  
  UPDATE public.business_users
  SET role = new_role_param, updated_at = now()
  WHERE business_id = business_id_param AND user_id = user_id_param;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_business_users_updated_at
  BEFORE UPDATE ON public.business_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get user's role in a specific business
CREATE OR REPLACE FUNCTION public.get_user_business_role(
  user_id_param UUID,
  business_id_param UUID
)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Check if user is the business owner
  SELECT CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.business_settings 
      WHERE id = business_id_param AND user_id = user_id_param
    ) THEN 'business_admin'::app_role
    ELSE COALESCE(
      (SELECT role FROM public.business_users 
       WHERE business_id = business_id_param AND user_id = user_id_param),
      'business_user'::app_role
    )
  END;
$$;
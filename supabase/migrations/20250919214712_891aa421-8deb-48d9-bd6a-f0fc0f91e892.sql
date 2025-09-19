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
  
  -- If user doesn't exist, require the user to exist
  IF target_user_id IS NULL THEN
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
  -- Don't allow changing the business owner's role
  IF EXISTS (
    SELECT 1 FROM public.business_settings 
    WHERE id = business_id_param AND user_id = user_id_param
  ) THEN
    RAISE EXCEPTION 'Cannot change business owner role';
  END IF;
  
  UPDATE public.business_users
  SET role = new_role_param, updated_at = now()
  WHERE business_id = business_id_param AND user_id = user_id_param;
END;
$$;

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
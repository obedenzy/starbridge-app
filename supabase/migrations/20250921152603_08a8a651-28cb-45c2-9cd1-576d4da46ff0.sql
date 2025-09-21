-- Fix role system: ensure business owners are properly set up as business_admin users

-- Insert business owners into business_users table if they don't exist
INSERT INTO public.business_users (business_id, user_id, role, created_at, updated_at)
SELECT 
  bs.business_id,
  bs.user_id,
  'business_admin'::app_role,
  bs.created_at,
  now()
FROM public.business_settings bs
WHERE NOT EXISTS (
  SELECT 1 FROM public.business_users bu 
  WHERE bu.business_id = bs.business_id 
  AND bu.user_id = bs.user_id
);

-- Update profiles table to ensure business owners have their business info
UPDATE public.profiles p
SET 
  business_id = bs.business_id,
  business_name = bs.business_name,
  full_name = COALESCE(NULLIF(p.full_name, ''), 'Business Owner', p.full_name),
  updated_at = now()
FROM public.business_settings bs
WHERE p.user_id = bs.user_id
  AND (p.business_id IS NULL OR p.business_id != bs.business_id OR p.full_name IS NULL OR p.full_name = '');

-- Update the get_user_business_role function to work with BIGINT business_id properly
CREATE OR REPLACE FUNCTION public.get_user_business_role(user_id_param uuid, business_id_param uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.business_settings 
      WHERE id = business_id_param AND user_id = user_id_param
    ) THEN 'business_admin'::app_role
    ELSE COALESCE(
      (SELECT role FROM public.business_users 
       WHERE business_id IN (SELECT business_id FROM public.business_settings WHERE id = business_id_param)
       AND user_id = user_id_param),
      'business_user'::app_role
    )
  END;
$function$;
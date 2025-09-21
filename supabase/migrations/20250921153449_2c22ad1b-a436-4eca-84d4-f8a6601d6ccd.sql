-- Fix the get_user_business_role function to properly detect business owners
CREATE OR REPLACE FUNCTION public.get_user_business_role(user_id_param uuid, business_id_param bigint)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    -- Check if user is the business owner (in business_settings table)
    WHEN EXISTS (
      SELECT 1 FROM public.business_settings 
      WHERE business_id = business_id_param AND user_id = user_id_param
    ) THEN 'business_admin'::app_role
    -- Otherwise check their role in business_users table
    ELSE COALESCE(
      (SELECT role FROM public.business_users 
       WHERE business_id = business_id_param AND user_id = user_id_param),
      'business_user'::app_role
    )
  END;
$function$;
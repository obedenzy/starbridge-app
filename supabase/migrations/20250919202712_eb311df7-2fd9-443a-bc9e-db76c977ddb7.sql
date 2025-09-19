-- Update the handle_new_user trigger to ensure new business accounts are created with 'inactive' status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Create business settings for regular users (not super admins) with 'inactive' status
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id AND role = 'super_admin') THEN
    INSERT INTO public.business_settings (user_id, business_name, contact_email, public_path, status)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'My Business'),
      NEW.email,
      LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'my-business'), ' ', '-')) || '-' || SUBSTRING(NEW.id::text FROM 1 FOR 8),
      'inactive'
    );
  END IF;
  
  -- Assign default business_user role if no role exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'business_user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;
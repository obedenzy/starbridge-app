-- Update profiles with missing full names for existing business owners
UPDATE public.profiles p
SET 
  full_name = COALESCE(NULLIF(p.full_name, ''), bs.business_name || ' Owner', 'Business Owner'),
  updated_at = now()
FROM public.business_settings bs
WHERE p.user_id = bs.user_id 
  AND (p.full_name IS NULL OR p.full_name = '');
-- Add business owners to business_users table (simpler approach)
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
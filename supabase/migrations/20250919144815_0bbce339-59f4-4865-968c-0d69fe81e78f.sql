-- Remove the overly permissive RLS policy that exposes all business data
DROP POLICY IF EXISTS "Business settings are viewable by public path" ON public.business_settings;

-- Create a security definer function to safely get public business info
CREATE OR REPLACE FUNCTION public.get_public_business_info(business_path text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  business_name text,
  public_path text,
  status text,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    bs.id,
    bs.business_name,
    bs.public_path,
    bs.status,
    bs.created_at
  FROM public.business_settings bs
  WHERE bs.status = 'active'
    AND (business_path IS NULL OR bs.public_path = business_path);
$$;
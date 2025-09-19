-- Remove the overly permissive RLS policy that exposes all business data
DROP POLICY IF EXISTS "Business settings are viewable by public path" ON public.business_settings;

-- Create a secure view that only exposes minimal necessary data for public access
CREATE OR REPLACE VIEW public.public_business_info AS
SELECT 
  id,
  business_name,
  public_path,
  status,
  created_at
FROM public.business_settings
WHERE status = 'active';

-- Enable RLS on the view
ALTER VIEW public.public_business_info SET (security_invoker = true);

-- Create RLS policy for the secure view - only allow reading active businesses
CREATE POLICY "Public can view active business info" 
ON public.public_business_info 
FOR SELECT 
USING (status = 'active');
-- First check what policies exist
SELECT policyname FROM pg_policies WHERE tablename = 'reviews';

-- Remove the overly permissive review insertion policy
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Validated reviews can be inserted" ON public.reviews;

-- Create a more secure policy that validates business exists and is active
CREATE POLICY "Secure review submissions" 
ON public.reviews 
FOR INSERT 
WITH CHECK (
  -- Ensure the business exists and is active
  EXISTS (
    SELECT 1 FROM public.business_settings 
    WHERE id = business_id 
    AND status = 'active'
  )
  -- Ensure required fields are provided
  AND customer_name IS NOT NULL 
  AND customer_name != ''
  AND rating >= 1 
  AND rating <= 5
  AND (
    -- For ratings below 4, require email and comment
    (rating >= 4) OR 
    (rating < 4 AND customer_email IS NOT NULL AND customer_email != '' AND comment IS NOT NULL AND comment != '')
  )
);

-- Create a function to check for rate limiting (basic email-based protection)
CREATE OR REPLACE FUNCTION public.check_review_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if more than 3 reviews from same email in last hour
  IF (
    SELECT COUNT(*) 
    FROM public.reviews 
    WHERE customer_email = NEW.customer_email 
    AND created_at > NOW() - INTERVAL '1 hour'
  ) >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Maximum 3 reviews per email per hour.';
  END IF;
  
  -- Check if more than 1 review for same business from same email in last 24 hours
  IF (
    SELECT COUNT(*) 
    FROM public.reviews 
    WHERE business_id = NEW.business_id 
    AND customer_email = NEW.customer_email 
    AND created_at > NOW() - INTERVAL '24 hours'
  ) >= 1 THEN
    RAISE EXCEPTION 'You can only submit one review per business per day.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS review_rate_limit_check ON public.reviews;

-- Create trigger for rate limiting
CREATE TRIGGER review_rate_limit_check
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.check_review_rate_limit();

-- Add indexes for better performance on rate limiting queries
CREATE INDEX IF NOT EXISTS idx_reviews_email_created_at ON public.reviews(customer_email, created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_business_email_created_at ON public.reviews(business_id, customer_email, created_at);